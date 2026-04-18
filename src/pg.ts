import pg from "pg";
import chalk from "chalk";

export function resolvePgUrl(positionalArg?: string): string {
  const url = positionalArg || process.env.DATABASE_URL;
  if (!url) {
    console.error(
      chalk.red(
        "No Postgres URL provided. Pass it as an argument or set DATABASE_URL."
      )
    );
    process.exit(1);
  }
  return url;
}

export async function discoverTables(
  pgUrl: string
): Promise<{ schema: string; table: string; full: string }[]> {
  const client = new pg.Client({ connectionString: pgUrl });
  await client.connect();

  const { rows } = await client.query<{
    table_schema: string;
    table_name: string;
  }>(
    `SELECT table_schema, table_name
     FROM information_schema.tables
     WHERE table_type = 'BASE TABLE'
       AND table_schema NOT IN ('pg_catalog', 'information_schema', '_pg2iceberg')
     ORDER BY table_schema, table_name`
  );

  await client.end();

  return rows.map((r) => ({
    schema: r.table_schema,
    table: r.table_name,
    full: `${r.table_schema}.${r.table_name}`,
  }));
}
