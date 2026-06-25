/**
 * Bootstrap the first super_admin account.
 *
 * Usage:
 *   npx tsx scripts/seed-admin.ts
 *
 * Prerequisites:
 *   - A Firebase project with Authentication (Email/Password) enabled.
 *   - A service account key JSON file. Set its path via the
 *     GOOGLE_APPLICATION_CREDENTIALS environment variable, or place it at
 *     `./serviceAccountKey.json` (git-ignored).
 *
 * The script will:
 *   1. Create a Firebase Auth user (or use an existing one) with the given email.
 *   2. Write the `admins/{uid}` Firestore document with role `super_admin`.
 *
 * Environment variables (or interactive prompts):
 *   ADMIN_EMAIL    — Email for the admin account.
 *   ADMIN_PASSWORD — Password for the admin account (min 6 chars).
 *   ADMIN_NAME     — Display name (optional, defaults to "Super Admin").
 */

import { cert, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { createInterface } from "readline";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const rl = createInterface({ input: process.stdin, output: process.stdout });

function ask(question: string): Promise<string> {
  return new Promise((res) => rl.question(question, (answer) => res(answer.trim())));
}

async function main() {
  // --- Resolve service account ---
  const keyPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    resolve(process.cwd(), "serviceAccountKey.json");

  if (!existsSync(keyPath)) {
    console.error(
      `\n❌ Service account key not found at: ${keyPath}\n` +
        `   Set GOOGLE_APPLICATION_CREDENTIALS or place the file at ./serviceAccountKey.json.\n`,
    );
    process.exit(1);
  }

  const serviceAccount = JSON.parse(
    readFileSync(keyPath, "utf-8"),
  ) as ServiceAccount;

  initializeApp({ credential: cert(serviceAccount) });
  const authAdmin = getAuth();
  const db = getFirestore();

  // --- Gather input ---
  const email =
    process.env.ADMIN_EMAIL || (await ask("Admin email: "));
  const password =
    process.env.ADMIN_PASSWORD || (await ask("Admin password (min 6 chars): "));
  const displayName =
    process.env.ADMIN_NAME || (await ask("Display name [Super Admin]: ")) || "Super Admin";

  if (!email || !password) {
    console.error("❌ Email and password are required.");
    process.exit(1);
  }

  if (password.length < 6) {
    console.error("❌ Password must be at least 6 characters.");
    process.exit(1);
  }

  // --- Create or fetch Auth user ---
  let uid: string;
  try {
    const existing = await authAdmin.getUserByEmail(email);
    uid = existing.uid;
    console.log(`ℹ️  Auth user already exists (uid: ${uid}). Using existing account.`);
  } catch {
    const created = await authAdmin.createUser({
      email,
      password,
      displayName,
      emailVerified: true,
    });
    uid = created.uid;
    console.log(`✅ Created Auth user (uid: ${uid}).`);
  }

  // --- Write admins/{uid} document ---
  const adminRef = db.collection("admins").doc(uid);
  const existing = await adminRef.get();

  if (existing.exists) {
    console.log(`ℹ️  admins/${uid} already exists. Updating role to super_admin.`);
    await adminRef.update({
      role: "super_admin",
      disabled: false,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    await adminRef.set({
      email,
      displayName,
      role: "super_admin",
      disabled: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`✅ Created admins/${uid} document with role: super_admin.`);
  }

  console.log(
    `\n🎉 Done! Sign in at /admin/login with:\n   Email: ${email}\n   Password: (the one you provided)\n`,
  );

  rl.close();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
