import chalk from "chalk";
import ora from "ora";
import { checkbox } from "@inquirer/prompts";
import { resolvePgUrl, discoverTables } from "../pg";
import { api } from "../client";
import { configExists, configPath, saveProjectConfig, saveProjectKey } from "../project";
import { ensureLoggedIn } from "../config";

export async function createCommand(
  pgUrl: string | undefined,
  options: {
    tables?: string;
    all?: boolean;
  }
) {
  if (configExists()) {
    console.error(chalk.red(`${configPath()} already exists. Destroy the project first.`));
    process.exit(1);
  }

  await ensureLoggedIn();

  // Check quota before connecting to Postgres.
  const quota = await api.getQuota();
  if (quota.limit !== null && quota.used >= quota.limit) {
    console.error(chalk.red(`To prevent abuse, we limit number of projects you can create, including destroyed.`));
    console.error(chalk.dim(`Email support@polynya.dev to request more.`));
    process.exit(1);
  }

  const url = resolvePgUrl(pgUrl);
  let selectedTables: string[];

  if (options.tables) {
    selectedTables = options.tables.split(",").map((t) => t.trim());
  } else {
    const spinner = ora("Connecting to Postgres...").start();
    let tables;
    try {
      tables = await discoverTables(url);
      spinner.succeed(`Found ${tables.length} tables`);
    } catch (err) {
      spinner.fail((err as Error).message);
      process.exit(1);
    }

    if (tables.length === 0) {
      console.error(chalk.red("No tables found."));
      process.exit(1);
    }

    if (options.all) {
      selectedTables = tables.map((t) => t.full);
      for (const t of selectedTables) {
        console.log(chalk.dim(`  ${t}`));
      }
    } else {
      selectedTables = await checkbox({
        message: "Select tables to replicate",
        choices: tables.map((t) => ({
          name: t.full,
          value: t.full,
          checked: true,
        })),
      });

      if (selectedTables.length === 0) {
        console.log("No tables selected.");
        return;
      }
    }
  }

  const spinner = ora("Creating project...").start();
  try {
    const project = await api.createProject({
      pg_url: url,
      tables: selectedTables,
    });

    // Write polynya.yaml and save project key to ~/.polynya/keys/
    saveProjectConfig({
      project: { id: project.id, name: project.name },
      tables: selectedTables.map((t) => ({ name: t })),
    });
    if (project.project_key) {
      saveProjectKey(project.id, project.project_key);
    }

    spinner.succeed(
      `Project ${chalk.bold(project.name)} created — ${selectedTables.length} table${selectedTables.length > 1 ? "s" : ""} syncing`
    );
    console.log();
    if (project.project_key) {
      console.log(chalk.dim("  Project key: ") + project.project_key);
    }
    console.log(chalk.dim("  Config:      ") + configPath());
    console.log(
      chalk.dim("  Run ") +
        chalk.cyan("polynya catalog") +
        chalk.dim(" for connection details")
    );
  } catch (err) {
    spinner.fail((err as Error).message);
    process.exit(1);
  }
}
