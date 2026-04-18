import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import chalk from "chalk";
import { api } from "../client";
import { resolveProjectName } from "../project";

export async function pauseCommand(name?: string) {
  const projectName = resolveProjectName(name);
  const projects = await api.listProjects();
  const project = projects.find((p) => p.name === projectName);

  if (!project) {
    console.error(chalk.red(`Project '${projectName}' not found`));
    process.exit(1);
  }

  console.log(
    chalk.yellow(
      "Warning: While paused, the replication slot is retained on your Postgres.\n" +
      "WAL will accumulate and increase disk usage until the project is resumed."
    )
  );

  const rl = createInterface({ input: stdin, output: stdout });
  const answer = await rl.question(chalk.yellow(`Pause project '${projectName}'? [y/N] `));
  rl.close();

  if (answer.toLowerCase() !== "y") {
    console.log("Cancelled.");
    return;
  }

  const result = await api.pauseProject(project.id);
  console.log(chalk.green(result.message));
}
