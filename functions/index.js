const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

exports.submitQuote = onCall(async (request) => {
  const { form, honeypot } = request.data;
  
  // V2 onCall provides the express request via rawRequest
  const ip = request.rawRequest.ip || request.rawRequest.headers['x-forwarded-for'] || "unknown-ip";

  // 1. Honeypot check
  if (honeypot) {
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
  if (!form || !form.name || !form.email || !form.body) {
    throw new HttpsError("invalid-argument", "Missing required form fields.");
  }

  const messageData = {
    name: form.name,
    email: form.email,
    subject: form.subject || "New Quote Request",
    body: form.body,
    status: "new",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await db.collection("messages").add(messageData);

  const mailData = {
    to: ["hello@servio.dev"],
    replyTo: form.email,
    message: {
      subject: messageData.subject,
      text: messageData.body,
      html: form.html || messageData.body.replace(/\n/g, "<br>")
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
