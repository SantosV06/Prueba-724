# Fundación VNE — Prueba-724

English-language setup and operational guides for the active application are available below. The Spanish README remains the more detailed project overview.

- [Complete installation guide](INSTALLATION_GUIDE.en.md)
- [Brevo transactional email setup](BREVO_SETUP.en.md)
- [Architecture](ARCHITECTURE.md)
- [Operations and recovery](OPERATIONS.md)
- [Security controls and incident reporting](SECURITY.md)
- [Repository architecture and test boundaries](ARCHITECTURE.md)

The active application is deployed from the repository root to Vercel and uses Neon PostgreSQL. Brevo notifications are attempted only after a new volunteer request has been saved. A production test reported by the project owner confirmed that the form saved successfully and at least one real email arrived. This does not prove that both notification messages or failure/idempotency scenarios have been fully tested.
