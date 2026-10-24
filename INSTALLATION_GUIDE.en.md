# Complete installation guide (English)

This guide covers a fresh deployment of the active application from the repository root. The historical Cloudflare version is not part of the current deployment. See [OPERATIONS.md](OPERATIONS.md), [SECURITY.md](SECURITY.md), and [BREVO_SETUP.en.md](BREVO_SETUP.en.md) for operational details.

## 1. Prerequisites

- GitHub access to `SantosV06/Prueba-724` or an authorized fork.
- Vercel account connected to the repository.
- Neon PostgreSQL account.
- Cloudflare account for Turnstile.
- Brevo account if transactional email is required.
- A domain/hostname you control and a secure password/secret manager.
- For local development: Git, Node.js **24.x**, and npm **11.9.0**.

The application uses the versioned SQL migrations in `migrations/*.sql`; do not manually recreate tables from historical SQL.

## 2. Import the repository into Vercel

1. Open the repository in GitHub. For an independent installation, create a fork in your own account or organization.
2. In Vercel, choose **Add New → Project → Import Git Repository** and select the repository you will administer.
3. Set the root directory to `./`, select Node.js 24.x, and deploy from `main`.
4. Keep the installation command configured in `vercel.json`: `npm ci --include=dev --no-audit --no-fund`.
5. Use `npm run build`. Do not force a static `dist` deployment; Nitro builds the Vercel output.

## 3. Create the Neon database

1. Create a new Neon PostgreSQL project for this installation.
2. Keep Production separate from Preview/test databases.
3. Copy the pooled connection string from Neon and require SSL.
4. Store it as the Vercel `DATABASE_URL` secret.
5. Do not point an existing production database at this deployment until you have authorization and a backup.

Migrations are applied during the build process. Do not delete tables to work around a migration error.

## 4. Generate application secrets

Run the following command in a private terminal with Node.js 24, twice, to generate independent values:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Use one value for `ADMIN_SESSION_SECRET` and the other for `ADMIN_TOTP_ENCRYPTION_KEY`. Preserve the TOTP encryption key in a secure vault; losing or replacing it without a re-encryption plan may make existing authenticator secrets unreadable.

Set `ADMIN_PASSWORD` to a strong initial password of 14–256 characters. It initializes the owner account only when no accounts exist. Changing this environment variable later does not change an existing account password.

## 5. Configure Cloudflare Turnstile

1. Create a Turnstile widget in Cloudflare.
2. Authorize the exact Production hostname (and a separate Preview hostname if needed).
3. Add the public Site Key as `VITE_TURNSTILE_SITE_KEY` and the private Secret Key as `TURNSTILE_SECRET_KEY`.
4. Ensure the keys belong to the same widget. Never expose the secret key with a `VITE_` prefix.
5. Redeploy after changing the public key because it is included at build time.

Do not use the official test keys from CI on the public production site.

## 6. Configure Brevo transactional email

Follow [BREVO_SETUP.en.md](BREVO_SETUP.en.md). In short, authenticate the sending domain, verify the sender, create an API key (not an SMTP password), and configure `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, and `VOLUNTEER_NOTIFICATION_EMAIL`. `BREVO_SENDER_NAME` is optional.

When a new volunteer request is successfully saved, the server attempts a confirmation email to the volunteer and an internal notification. If Brevo is missing or unavailable, the saved request remains valid. An email failure must not be interpreted as a failed database save.

## 7. Configure Vercel environment variables

In **Settings → Environment Variables**, add the exact variable names below to **Production**. Do not add quotes around values.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Pooled Neon Production URL with SSL. |
| `ADMIN_PASSWORD` | Initial owner only | Initial password; does not reset an existing account. |
| `ADMIN_SESSION_SECRET` | Yes | Independent random secret, at least 32 bytes. |
| `ADMIN_TOTP_ENCRYPTION_KEY` | Yes | 32 random bytes encoded as Base64. |
| `SITE_URL` | Recommended | Canonical HTTPS origin without path, query, or fragment. |
| `VITE_TURNSTILE_SITE_KEY` | Form required | Public Site Key for the exact hostname. |
| `TURNSTILE_SECRET_KEY` | Form required | Private Secret Key for the same widget. |
| `BREVO_API_KEY` | Email required | Brevo API key. |
| `BREVO_SENDER_EMAIL` | Email required | Verified sender address. |
| `BREVO_SENDER_NAME` | Optional | Display name for the sender. |
| `VOLUNTEER_NOTIFICATION_EMAIL` | Internal notification required | Team mailbox for new-request notifications. |
| `DATA_RETENTION_DAYS` | Optional | Approved retention interval, integer from 30 to 3650; does not schedule automatic deletion. |

Set `SITE_URL` to the public HTTPS origin, such as `https://your-project.vercel.app`, with no path or query. Keep Production, Preview, and local credentials separate. Never commit real secrets or put private values in a `VITE_` variable. Create a new deployment after changing environment variables.

## 8. Deploy and verify the database

1. Save the Production variables.
2. Trigger a new deployment from `main`.
3. Wait for **Ready** and inspect build logs if it fails.
4. During build, the app validates configuration and applies pending migrations. Do not delete tables to fix an error.
5. Visit `https://YOUR-DOMAIN/api/health`. An `ok` result indicates the database schema is reachable; it does not prove that the public form or email delivery works.

## 9. First admin login and language preference

1. Open `https://YOUR-DOMAIN/solicitudes`.
2. Sign in as `admin` using the initial `ADMIN_PASSWORD`.
3. The first valid login creates the owner account if no accounts exist yet.
4. Open **Account Security → 2FA**, enroll an authenticator, and confirm a code.
5. Store recovery codes safely; they are shown only once.
6. Create individual accounts for team members and require 2FA only after the owner's account is protected.

The public site's default language is stored in the database and can be changed by the owner from **Owner Tools → Default Language** to **Español**, **English**, or **Português**. This is a live database setting, not a source-code default. To verify it, open a private browser window without a `lang` query parameter. An explicit `?lang=en`, `?lang=es`, or `?lang=pt` takes precedence. If the database setting cannot be read, the site falls back to Spanish. This preference does not translate user-submitted data or automatically change every browser's explicit language selection.

## 10. Acceptance test: volunteer form and email

Use a mailbox you control and clearly fake test data.

1. Open the Production volunteer page and complete Turnstile.
2. Submit one test request.
3. Confirm that the UI reports success and the request appears exactly once in `/solicitudes`.
4. Check the volunteer confirmation and internal notification mailbox separately, including spam folders.
5. Verify the internal email does not include the personal message and that its panel link is correct.
6. Review Vercel/Brevo logs without publishing personal data or secrets.
7. Remove the test request in accordance with the organization's policy.

The project owner has reported a real Production test in which the request was saved successfully and at least one email arrived. That confirms the specific tested path only; it does not establish that both messages, idempotency, provider failures, or load behavior have all been tested. Unit tests mock Brevo and do not deliver real messages.

Never run destructive tests or write-oriented E2E tests against the Production database.

## 11. Preview and local development

For Preview, use a separate Neon branch/database, separate secrets, test recipients, and matching Turnstile keys for the Preview hostname. Only set `PREVIEW_DATABASE_ISOLATED=true` after manually verifying that the database is isolated. This flag does not prove isolation. Do not send real Brevo email from Preview unless explicitly authorized and recipient-controlled.

Local setup:

```bash
git clone https://github.com/SantosV06/Prueba-724.git
cd Prueba-724
npm ci --include=dev
```

Copy `.env.example` to `.env.local`, fill it with local test credentials, and run:

```bash
node --env-file=.env.local --run dev
```

Without `DATABASE_URL`, development uses in-memory PGLite and data is lost when the process exits. Never reuse Production secrets locally.

## 12. Maintenance and recovery

- `npm run check`: types, lint, and tests.
- `npm run build`: validation and Vercel build.
- `npm run db:verify`: private, read-only database verification.
- `npm run data:retention`: reports old trashed requests; it does not delete.
- `npm run data:retention -- --apply`: applies an approved purge of old trashed requests.
- `npm run admin:recover -- admin`: private owner recovery procedure; see [OPERATIONS.md](OPERATIONS.md).

Zelle is informational only; the application does not process, confirm, or reconcile payments. A green CI run does not prove Production configuration, successful email delivery, accessibility conformance, load capacity, or a successful database restore. Record which tests were actually performed before handing over the installation.
