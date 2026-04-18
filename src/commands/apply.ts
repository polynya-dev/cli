import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import chalk from "chalk";
import ora from "ora";
import { api } from "../client";
import { loadProjectConfig, tableNames } from "../project";

export async function applyCommand() {
  const config = loadProjectConfig();
  const localTables = tableNames(config);

  let remote;
  try {
    remote = await api.getProject(config.project.id);
  } catch {
    console.error(chalk.red(`Project ${config.project.name} not found on server.`));
    process.exit(1);
  }

  if (remote.status !== "running" && remote.status !== "paused") {
    console.error(chalk.red(`Project is ${remote.status}, cannot apply changes.`));
    process.exit(1);
  }

  const remoteTables = remote.tables;
  const toAdd = localTables.filter((t) => !remoteTables.includes(t));
  const toRemove = remoteTables.filter((t) => !localTables.includes(t));

  if (toAdd.length === 0 && toRemove.length === 0) {
    console.log(chalk.dim("No changes. Tables are in sync."));
    return;
  }

  console.log();
  console.log(`${chalk.bold(config.project.name)}: ${toAdd.length + toRemove.length} change(s)`);
  console.log();
  for (const t of toAdd) {
    console.log(chalk.green(`  + table "${t}"`));
  }
  for (const t of toRemove) {
    console.log(chalk.red(`  - table "${t}"`));
  }
  console.log();
  console.log(chalk.dim(`Plan: ${toAdd.length} to add, ${toRemove.length} to remove.`));
  console.log();

  const rl = createInterface({ input: stdin, output: stdout });
  const answer = await rl.question(chalk.yellow("Project will be briefly paused before applying. Apply changes? [y/N] "));
  rl.close();
  if (answer.toLowerCase() !== "y") {
    console.log("Cancelled.");
    return;
  }

  const spinner = ora("Applying changes...").start();
  try {
    // Pause if running
    if (remote.status === "running") {
      spinner.text = "Pausing project...";
      await api.pauseProject(config.project.id);
    }

    spinner.text = "Updating config...";
    const result = await api.updateProject(config.project.id, {
      tables: config.tables,
      sink: config.sink,
    });
    spinner.succeed(result.message);
  } catch (err) {
    spinner.fail((err as Error).message);
    process.exit(1);
  }
}
