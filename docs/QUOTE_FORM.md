# Quote / proposal request form

The "Request Your Free Proposal" form (`src/app/components/QuoteForm.tsx`) is the
site's main lead-capture channel. This document covers what happens on submit and
how to switch on email notifications.

## What happens on submit

`submitQuote()` (`src/app/lib/submitQuote.ts`) runs after the shared validation +
spam checks in `quoteValidation.ts` pass, and performs two Firestore writes:

1. **`messages`** — the durable lead record. It matches the public-create rule in
   `firestore.rules` (`{ name, email, subject, body, status: 'new', createdAt }`)
   and shows up immediately in the admin **Messages** inbox
   (`src/admin/pages/Messages.tsx`). This is the source of truth; **if it fails,
   the user is shown an error and nothing is reported as sent.**
2. **`mail`** — a document for the Firebase **Trigger Email** extension to send as
   an email. This write is **best-effort**: the lead is already saved by step 1,
   so a missing extension or an undeployed `mail` rule is logged but never fails
   the submission. (Losing leads is the bug this fixes — see issue #9.)

`replyTo` on the email is set to the prospect's address, so replying from the
inbox goes straight back to them.

## Enabling email delivery

Persistence works out of the box once `firestore.rules` is deployed. Email
requires a one-time setup:

1. **Deploy the rules** so the `mail` create rule exists:
   ```sh
   firebase deploy --only firestore:rules
   ```
2. **Install the Trigger Email extension** and point it at the `mail` collection:
   ```sh
   firebase ext:install firebase/firestore-send-email
   ```
   During configuration set the SMTP connection URI (or SendGrid/Mailgun
   credentials) and the **Email documents collection** to `mail`.
3. **Recipient address.** Notifications go to `QUOTE_NOTIFY_EMAIL` in
   `src/app/lib/submitQuote.ts`. It is pinned server-side by the `to ==` check in
   the `firestore.rules` `mail` block, so to change it you must edit **both**
   places (the rule prevents the collection from being used as an open relay).

## Hardening (recommended)

The public can create `messages`/`mail` documents (that is by design — visitors
are not signed in). The shape is locked down in the rules and the client runs
honeypot, timing, content and rate-limit checks first, but for scripted-spam
protection enable [Firebase App Check](https://firebase.google.com/docs/app-check)
on Firestore.
