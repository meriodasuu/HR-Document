# HR Document Automator release notes

## Demo release

This release is prepared for diploma demonstration and can work in two modes:

- PostgreSQL mode with persistent data storage.
- Demo mode without a database for local quick checks.

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
- PostgreSQL data storage.
- Demo mode fallback for local checks without PostgreSQL.

## Release checks

- TypeScript check: passed.
- Production build: passed.
- API default port: `5000`.
- API validation errors are returned as `400` instead of generic `500`.
- PostgreSQL tables are created automatically on API startup when `DATABASE_URL` is set.

## Known limitations

- If `DATABASE_URL` is not set, the API uses in-memory demo storage and data resets after API restart.
- Microsoft SQL Server integration can be added later if the product needs to use SSMS locally.
- Frontend bundle size can be optimized later with code splitting.

## Production environment variables

For persistent storage, set:

```text
DATABASE_URL=postgresql://...
```

Do not set `DEMO_MODE=1` in production, otherwise the API will use in-memory storage even if `DATABASE_URL` exists.

Optional custom users:

```text
HR_USERNAME=your_hr_login
HR_PASSWORD=your_hr_password
DIRECTOR_USERNAME=your_director_login
DIRECTOR_PASSWORD=your_director_password
```
