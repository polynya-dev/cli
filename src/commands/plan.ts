import chalk from "chalk";
import { api } from "../client";
import { loadProjectConfig, tableNames } from "../project";

export async function planCommand() {
  const config = loadProjectConfig();
  const localTables = tableNames(config);

  let remote;
  try {
    remote = await api.getProject(config.project.id);
  } catch {
    console.log(chalk.yellow(`Project ${config.project.name} not found on server.`));
    return;
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
  console.log(chalk.dim(`Run ${chalk.cyan("polynya apply")} to apply.`));
}
