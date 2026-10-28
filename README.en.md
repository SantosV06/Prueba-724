# Fundación VNE — Prueba-724

English-language setup and operational guides for the active application are available below. The Spanish README remains the more detailed project overview.

- [Complete installation guide](INSTALLATION_GUIDE.en.md)
- [Brevo transactional email setup](BREVO_SETUP.en.md)
- [Architecture](ARCHITECTURE.md)
- [Operations and recovery](OPERATIONS.md)
- [Security controls and incident reporting](SECURITY.md)

The active application is deployed from the repository root to Vercel and uses Neon PostgreSQL. After a new volunteer request is saved, Brevo is used only when `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, and `VOLUNTEER_NOTIFICATION_EMAIL` are set: one confirmation to the applicant and one internal notice that omits the personal message. Moving a saved request to `aceptada` or `descartada` attempts a separate email to the applicant and does not require the internal mailbox. `contactada`, an unchanged status, trash, and restore do not send mail. A provider failure does not undo the saved request or status. The public form also needs a Turnstile hostname from `TURNSTILE_EXPECTED_HOSTNAME` or `SITE_URL`; the Vercel production-URL fallback used for the sitemap does not satisfy that check.

A production test reported by the project owner confirmed that the form saved successfully and at least one real email arrived. This does not prove that both new-request messages, the status email, idempotency, or provider failures have been fully tested. CI mocks Brevo and, in the `validate` job, skips Cloudflare `siteverify`.
