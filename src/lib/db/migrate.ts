import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
// Note: set DATABASE_URL in your shell environment before running migrations
// e.g. `export $(cat .env.local | xargs) && npx tsx src/lib/db/migrate.ts`

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
