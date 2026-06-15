# HR Document Automator release notes

## Demo release

This release is prepared for diploma demonstration and works without a required database connection.

## How to run

1. Install dependencies:

```bash
pnpm install
```

2. Start API server:

```bash
pnpm --filter @workspace/api-server run dev
```

The API uses port `5000` by default.

3. Start frontend:

```bash
pnpm --filter @workspace/hr-docs run dev
```

The frontend is available at `http://localhost:3000`.

## Demo users

HR user:

```text
login: hr
password: hr2024
```

Director user:

```text
login: director
password: director2024
```

## Main functionality

- HR login and director login.
- Employee list and employee creation.
- Document registry.
- Document creation from templates.
- Sending a document for director signature.
- Director signature workflow.
- Uploading and changing the director signature image.
- Document preview and printing.
- Demo mode without PostgreSQL.

## Release checks

- TypeScript check: passed.
- Production build: passed.
- API default port: `5000`.
- API validation errors are returned as `400` instead of generic `500`.

## Known limitations

- Demo data is stored in memory and resets after API restart.
- Microsoft SQL Server integration is planned as the next step.
- Frontend bundle size can be optimized later with code splitting.
