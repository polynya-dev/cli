import chalk from "chalk";
import ora from "ora";
import { resolvePgUrl, discoverTables } from "../pg";

export async function tablesCommand(
  pgUrl: string | undefined,
  options: { json?: boolean }
) {
  const url = resolvePgUrl(pgUrl);

  const spinner = ora("Connecting to Postgres...").start();
  let tables;
  try {
    tables = await discoverTables(url);
    spinner.succeed(`Found ${tables.length} tables`);
  } catch (err) {
    spinner.fail((err as Error).message);
    process.exit(1);
  }

  if (options.json) {
    console.log(JSON.stringify(tables.map((t) => t.full)));
    return;
  }

  for (const t of tables) {
    console.log(t.full);
  }
}
