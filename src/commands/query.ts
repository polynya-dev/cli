import chalk from "chalk";
import ora from "ora";
import { loadProjectKey } from "../project";

const QUERY_URL = "https://query.polynya.dev";

export async function queryCommand(
  _name: string | undefined,
  sql: string | undefined,
  options: { format?: string }
) {
  const projectKey = loadProjectKey();

  // No SQL provided — show curl example
  if (!sql) {
    console.log(chalk.dim("# Query via curl:"));
    console.log(`curl -X POST '${QUERY_URL}/?default_format=PrettyCompact' \\`);
    console.log(`  --user 'default:${projectKey}' \\`);
    console.log(`  -d 'SHOW TABLES'`);
    return;
  }

  const format = options.format ?? "TabSeparatedWithNames";
  const spinner = ora({ text: "Running query...", color: "cyan" }).start();

  for (let attempt = 0; attempt < 30; attempt++) {
    const params = new URLSearchParams({ default_format: format });
    const res = await fetch(`${QUERY_URL}/?${params}`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`default:${projectKey}`)}`,
      },
      body: sql,
    });

    if (res.status === 503) {
      // Session starting — retry
      if (attempt === 0) {
        spinner.text = "Starting ClickHouse session...";
      }
      const delay = parseInt(res.headers.get("Retry-After") ?? "10", 10);
      await new Promise((r) => setTimeout(r, delay * 1000));
      continue;
    }

    spinner.stop();

    const body = await res.text();
    if (!res.ok) {
      console.error(chalk.red(body.trim()));
      process.exit(1);
    }

    console.log(body.trimEnd());
    return;
  }

  spinner.stop();
  console.error(chalk.red("Timed out waiting for ClickHouse."));
  process.exit(1);
}
