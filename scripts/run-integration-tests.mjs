import { execSync } from 'node:child_process';

function sh(cmd, env = {}, options = {}) {
  execSync(cmd, {
    stdio: 'inherit',
    env: { ...process.env, ...env },
    input: options.input,
  });
}

function withSchema(url, schema) {
  const u = new URL(url);
  u.searchParams.set('schema', schema);
  return u.toString();
}

const inputUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleetsource';
const base = new URL(inputUrl);
base.searchParams.delete('schema');
const baseUrl = base.toString();

const testSchema = process.env.TEST_DB_SCHEMA || 'audit_test';
const testDbUrl = withSchema(baseUrl, testSchema);

process.env.DATABASE_URL = testDbUrl;
process.env.SESSION_SECRET ||= 'integration_tests_secret_32chars_minimum____';

// Optional: bring up docker-compose if requested (useful for local dev), but don't require it.
if (process.env.USE_DOCKER_COMPOSE === '1') {
  try {
    sh('docker compose up -d');
  } catch {
    // If Docker isn't available, continue and assume DATABASE_URL points to a reachable Postgres.
  }
}

// Ensure the test schema exists without requiring `psql` or Docker.
// prisma db execute connects using the URL provided.
sh(
  'npx prisma db execute --stdin',
  { DATABASE_URL: baseUrl },
  { input: `CREATE SCHEMA IF NOT EXISTS ${testSchema};\n` }
);

// Apply schema into the test schema namespace.
sh('npx prisma db push --skip-generate', {
  DATABASE_URL: testDbUrl,
});

// Run vitest with the test database URL.
sh('npx vitest run', {
  DATABASE_URL: testDbUrl,
  SESSION_SECRET: process.env.SESSION_SECRET,
});
