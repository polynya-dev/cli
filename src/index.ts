process.removeAllListeners("warning");
import { Command } from "commander";
import { loginCommand } from "./commands/login";
import { whoamiCommand } from "./commands/whoami";
import { createCommand } from "./commands/create";
import { applyCommand } from "./commands/apply";
import { lsCommand } from "./commands/ls";
import { statusCommand } from "./commands/status";
import { catalogCommand } from "./commands/catalog";
import { queryCommand } from "./commands/query";
import { pauseCommand } from "./commands/pause";
import { resumeCommand } from "./commands/resume";
import { destroyCommand } from "./commands/destroy";

const program = new Command();

program
  .name("polynya")
  .description("Postgres to Iceberg in one command")
  .version("0.1.0");

program
  .command("login")
  .description("Login via GitHub")
  .action(loginCommand);

program
  .command("whoami")
  .description("Show current logged-in user")
  .action(whoamiCommand);

program
  .command("deploy")
  .description("Deploy changes from polynya.yaml (add/remove tables, update sink)")
  .action(applyCommand);

program
  .command("create [pg-url]")
  .description("Create a project (reads DATABASE_URL if no arg)")
  .option("-t, --tables <tables>", "Comma-separated tables (skips interactive picker)")
  .option("--all", "Replicate all tables (skips interactive picker)")
  .action(createCommand);

program
  .command("ls")
  .description("List projects")
  .action(lsCommand);

program
  .command("status [project]")
  .description("Show project status (reads polynya.yaml if no arg)")
  .action(statusCommand);

program
  .command("catalog [project]")
  .description("Show catalog connection details")
  .action(catalogCommand);

program
  .command("query [sql]")
  .description("Run a SQL query, or show curl example if no SQL given")
  .option("-f, --format <format>", "Output format (TabSeparated, JSON, CSV, JSONCompact)")
  .option("-p, --project <name>", "Project name (reads polynya.yaml if omitted)")
  .action((sql, options) => queryCommand(options.project, sql, options));

program
  .command("pause [project]")
  .description("Pause a project (stops syncing, retains replication slot)")
  .action(pauseCommand);

program
  .command("resume [project]")
  .description("Resume a paused project")
  .action(resumeCommand);

program
  .command("destroy [project]")
  .description("Destroy a project")
  .option("-y, --yes", "Skip confirmation")
  .action(destroyCommand);

program.parseAsync().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`Error: ${msg}`);
  process.exit(1);
});
