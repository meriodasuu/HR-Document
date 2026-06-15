import { pool } from ".";

export async function ensureDatabaseSchema() {
  if (!pool) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      position TEXT NOT NULL,
      department TEXT NOT NULL,
      employee_number TEXT NOT NULL UNIQUE,
      hire_date TEXT NOT NULL,
      salary NUMERIC(12, 2),
      phone TEXT,
      email TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS custom_templates (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'custom',
      description TEXT NOT NULL DEFAULT '',
      fields JSONB NOT NULL DEFAULT '[]'::jsonb,
      content TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id SERIAL PRIMARY KEY,
      number TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      template_id INTEGER,
      signed_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
}
