# Deployment guide

## Recommended hosting

- API: Render Web Service
- Database: Render PostgreSQL
- Frontend: Vercel or Render Static Site

## 1. Create PostgreSQL on Render

1. Open Render Dashboard.
2. Click `New` -> `Postgres`.
3. Create a database, for example `hr-document-db`.
4. Use the same region as the API service.
5. After creation, copy the internal database URL.

Use the internal URL for the Render API service. It is faster and stays inside Render's private network.

## 2. Deploy API on Render

Create `New` -> `Web Service` from the GitHub repository.

Recommended settings:

```text
Name: hr-document-api
Environment: Node
Build Command: corepack enable && corepack prepare pnpm@11.5.1 --activate && pnpm install --frozen-lockfile && pnpm --filter @workspace/api-server run build
Start Command: pnpm --filter @workspace/api-server run start
```

If the repository root contains the project directly, leave `Root Directory` empty.

Environment variables:

```text
DATABASE_URL=<Render internal PostgreSQL URL>
HR_USERNAME=<your HR login>
HR_PASSWORD=<your HR password>
DIRECTOR_USERNAME=<your director login>
DIRECTOR_PASSWORD=<your director password>
```

Do not set:

```text
DEMO_MODE=1
```

When `DATABASE_URL` is set, the API creates these tables automatically on startup:

- `employees`
- `documents`
- `custom_templates`

## 3. Deploy frontend

For Vercel:

```text
Framework Preset: Vite
Root Directory: artifacts/hr-docs
Install Command: cd ../.. && corepack enable && corepack prepare pnpm@11.5.1 --activate && pnpm install --frozen-lockfile
Build Command: cd ../.. && pnpm --filter @workspace/hr-docs run build
Output Directory: dist/public
```

Environment variable:

```text
API_URL=<Render API URL>
```

Example:

```text
API_URL=https://hr-document-api.onrender.com
```

## 4. Release check

After deployment:

1. Open the frontend URL.
2. Log in as HR.
3. Create an employee.
4. Create a document.
5. Send the document for signature.
6. Log in as director.
7. Sign the document.
8. Restart the API service on Render.
9. Check that the employee and document are still available.

If data remains after restart, PostgreSQL storage is working.
