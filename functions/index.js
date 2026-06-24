const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

exports.submitQuote = onCall(async (request) => {
  const { form, honeypot } = request.data;
  
  // V2 onCall provides the express request via rawRequest
  const ip = request.rawRequest.ip || request.rawRequest.headers['x-forwarded-for'] || "unknown-ip";

  // 1. Honeypot check
  if (typeof honeypot === 'string' && honeypot.trim().length > 0) {
    // Log blocked spam attempt
    await db.collection("spam_logs").add({
      reason: "honeypot",
      ip: ip,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      form: form || {}
    });
    // Return silently to deceive bot
    return { success: true };
  }

  // 2. Rate limiting check (5 requests per minute)
  const safeIp = ip.replace(/[^a-zA-Z0-9:-]/g, '_');
  const rateLimitRef = db.collection("rate_limits").doc(`quote_${safeIp}`);
  
  const allowed = await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(rateLimitRef);
    const now = Date.now();
    const WINDOW_MS = 60 * 1000;
    const MAX_REQUESTS = 5;

    if (!doc.exists) {
      transaction.set(rateLimitRef, { count: 1, windowStart: now });
      return true;
    }

    const docData = doc.data();
    if (now - docData.windowStart > WINDOW_MS) {
      // Window expired, reset
      transaction.update(rateLimitRef, { count: 1, windowStart: now });
      return true;
    }

    if (docData.count >= MAX_REQUESTS) {
      return false; // Rate limit exceeded
    }

    // Increment count
    transaction.update(rateLimitRef, { count: docData.count + 1 });
    return true;
  });

  if (!allowed) {
    // Log blocked spam attempt
    await db.collection("spam_logs").add({
      reason: "rate_limit",
      ip: ip,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    // Return a user-friendly error message via HttpsError
    throw new HttpsError("resource-exhausted", "Too many submissions. Please wait a minute before trying again.");
  }

  // 3. Process the quote request
  if (!form || typeof form !== 'object') {
    throw new HttpsError("invalid-argument", "Invalid form data.");
  }

  const name = typeof form.name === 'string' ? form.name.trim() : "";
  const email = typeof form.email === 'string' ? form.email.trim() : "";
  const phone = typeof form.phone === 'string' ? form.phone.trim() : "";
  const business = typeof form.business === 'string' ? form.business.trim() : "";
  const budget = typeof form.budget === 'string' ? form.budget.trim() : "";
  const type = typeof form.type === 'string' ? form.type.trim() : "";
  const description = typeof form.description === 'string' ? form.description.trim() : "";

  if (!name || !email || !business || !budget || !type) {
    throw new HttpsError("invalid-argument", "Missing required form fields.");
  }

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  const subject = `New quote request: ${type} — ${business}`;

  const text = [
    `New proposal request from ${name} (${business}).`,
    ``,
    `Email: ${email}`,
    `Phone: ${phone || "—"}`,
    `Budget: ${budget}`,
    `Website type: ${type}`,
    ``,
    `Project description:`,
    description || "(none provided)",
  ].join("\n");

  const html = [
    `<h2>New quote request</h2>`,
    `<p><strong>${escapeHtml(name)}</strong> (${escapeHtml(business)})</p>`,
    `<ul>`,
    `<li>Email: ${escapeHtml(email)}</li>`,
    `<li>Phone: ${escapeHtml(phone || "—")}</li>`,
    `<li>Budget: ${escapeHtml(budget)}</li>`,
    `<li>Website type: ${escapeHtml(type)}</li>`,
    `</ul>`,
    `<p><strong>Project description</strong></p>`,
    `<p>${escapeHtml(description || "(none provided)").replace(/\n/g, "<br>")}</p>`,
  ].join("");

  const messageData = {
    name,
    email,
    subject,
    body: text,
    status: "new",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await db.collection("messages").add(messageData);

  const mailData = {
    to: ["hello@servio.dev"],
    replyTo: email,
    message: {
      subject,
      text,
      html
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  try {
    await db.collection("mail").add(mailData);
  } catch (err) {
    console.warn("Mail notification queue failed:", err);
  }

  return { success: true };
});
