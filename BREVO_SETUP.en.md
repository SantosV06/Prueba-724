# Brevo transactional email: setup and Production acceptance

The server module `src/lib/brevo-email.server.ts` is part of the active application. After a new volunteer request is saved for the first time, the app attempts to send a confirmation to the applicant and an internal notification. Idempotent duplicate submissions must not resend either message. The internal notification excludes the applicant's personal message. Changing a request status does not send email, and this integration is not used for password recovery.

## Reported Production test

The project owner confirmed that the Production form saved a test request successfully and at least one real email arrived. This verifies that specific end-to-end test only. It does not prove that both recipient paths, idempotency, provider failures, or load behavior have all been verified.

The repository cannot read or change Vercel's secret environment variables. Configure them in Vercel without copying secret values into GitHub, logs, screenshots, or chat.

## 1. Prepare Brevo

1. Open or create the Brevo account that will send transactional messages.
2. Authenticate the sending domain in Brevo.
3. Publish the SPF/DKIM records requested by Brevo. Do not replace an existing SPF record without checking every service that sends mail from the domain.
4. Configure DMARC according to the domain owner's policy and wait for Brevo to confirm authentication.
5. Verify the exact sender address used for `BREVO_SENDER_EMAIL`.
6. In **SMTP & API**, create an API key for the Brevo API. Do not use an SMTP password.
7. Keep the API key in a secure secret manager.

Official references:
- [Authenticate your domain with Brevo](https://help.brevo.com/hc/en-us/articles/12163873366162-Authenticate-your-domain-with-Brevo-Brevo-code-DKIM-DMARC)
- [Send a transactional email using the API](https://developers.brevo.com/docs/send-a-transactional-email)

## 2. Required environment variables

In Vercel, open **Settings → Environment Variables** and configure the following values for **Production**.

| Variable | Required | Value | Secret? |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | Pooled Neon Production connection string with SSL. | Yes |
| `ADMIN_PASSWORD` | Initial owner only | Initial owner password, 14–256 characters. Does not reset an existing account. | Yes |
| `ADMIN_SESSION_SECRET` | Yes | Independent random secret of at least 32 bytes. | Yes |
| `ADMIN_TOTP_ENCRYPTION_KEY` | Yes | 32 random bytes encoded as Base64; preserve it securely. | Yes |
| `SITE_URL` | Recommended | Canonical HTTPS origin, no path/query, e.g. `https://your-site.vercel.app`. | No |
| `VITE_TURNSTILE_SITE_KEY` | Form required | Public Cloudflare Turnstile Site Key for the Production hostname. | Public |
| `TURNSTILE_SECRET_KEY` | Form required | Private Secret Key belonging to the same widget. | Yes |
| `BREVO_API_KEY` | Email required | Brevo API key. | Yes |
| `BREVO_SENDER_EMAIL` | Email required | Verified sender address. | No, operational config |
| `BREVO_SENDER_NAME` | Optional | Display name, e.g. `Fundación Venezuela Nueva Esperanza`. | No |
| `VOLUNTEER_NOTIFICATION_EMAIL` | Internal alert required | Team-controlled mailbox for new request notifications. | No, operational config |
| `DATA_RETENTION_DAYS` | Optional | Approved integer between 30 and 3650; does not schedule deletion. | No |

Generate independent session and TOTP keys in a private Node.js 24 terminal, running this command twice:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Never prefix private keys with `VITE_`. The Turnstile Site Key is public and embedded during client build; the Secret Key is server-only. If you change the Site Key, redeploy so the client bundle is rebuilt.

## 3. Apply the variables

1. Confirm that you selected the correct Vercel project.
2. Add each variable using its exact name, without surrounding quotes or extra whitespace.
3. Select **Production** for every variable required by the live site.
4. Confirm that `DATABASE_URL` points to the Production Neon database, not a test branch.
5. Confirm that the Turnstile keys belong to the same widget and hostname.
6. Save the variables and create a new Production deployment from `main`.
7. Wait for **Ready** and inspect build logs if the deployment fails.

Changing Vercel variables does not retroactively update an existing deployment. Redeploy after changes. Keep Preview, Development, and Production credentials separate. Never point Preview at the Production database.

## 4. Test the live form and messages

Use a mailbox you control and clearly fake test data.

1. Open the public HTTPS site and go to the volunteer form.
2. Confirm that Turnstile loads and accepts the test.
3. Submit one request.
4. Confirm that the UI succeeds and the request appears exactly once in `/solicitudes`.
5. Check the applicant confirmation and internal notification separately, including spam folders.
6. Confirm that the internal notification does not include the applicant's personal message and that its link points to the right panel.
7. Review Vercel/Brevo logs without exposing secrets or personal information.
8. Remove the test record according to the organization's retention policy.

The reported Production test established that the form saved successfully and at least one email arrived. Record the two recipients separately if you verify them; do not claim both were tested based only on one received message.

### Additional tests

- In an isolated test environment, verify that an idempotent repeat does not duplicate the saved request or send the same notifications again. Do not attempt to test idempotency by clicking the public form repeatedly; normal submissions can generate distinct keys.
- Mock Brevo HTTP/network failures in tests and confirm that a request already saved remains successful.
- Ensure logs do not include API keys, email bodies, applicant addresses, or personal messages.

Do not run destructive tests or write-oriented E2E tests against the Production database.

## 5. Automated checks

Run locally:

```sh
npm ci --include=dev
npm run check
npm run build
```

The Brevo unit tests mock the provider. They check message preparation, recipients, HTML escaping, exclusion of the personal message from the internal notice, missing configuration, and error handling. They do not send real messages or prove DNS authentication and provider delivery.

## 6. Troubleshooting

- **The form cannot be submitted / Turnstile does not load:** check `VITE_TURNSTILE_SITE_KEY`, authorized hostname, the latest Production build, CSP, and `TURNSTILE_SECRET_KEY`.
- **The request is saved but no email arrives:** confirm that `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, and `VOLUNTEER_NOTIFICATION_EMAIL` are set in Production; confirm sender authentication and inspect provider logs.
- **Only one of the two messages arrives:** test the applicant and internal recipient independently.
- **A changed variable appears to have no effect:** create a new deployment.
- **A message lands in spam:** inspect SPF/DKIM/DMARC, sender reputation, and recipient filtering.

Remember: email is a side effect after the database save. A provider failure should not cause an already saved volunteer request to be described as lost.
