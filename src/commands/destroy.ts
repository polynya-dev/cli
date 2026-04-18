import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import chalk from "chalk";
import ora from "ora";
import { api } from "../client";
import { resolveProjectName } from "../project";

export async function destroyCommand(
  name: string | undefined,
  options: { yes?: boolean }
) {
  const projectName = resolveProjectName(name);
  const projects = await api.listProjects();
  const project = projects.find((p) => p.name === projectName);

  if (!project) {
    console.error(chalk.red(`Project '${projectName}' not found`));
    process.exit(1);
  }

  if (!options.yes) {
    const rl = createInterface({ input: stdin, output: stdout });
    const answer = await rl.question(
      chalk.yellow(
        `Destroy project '${projectName}'? Data will be deleted. [y/N] `
      )
    );
    rl.close();
    if (answer.toLowerCase() !== "y") {
      console.log("Cancelled.");
      return;
    }
  }

  const spinner = ora("Destroying project...").start();
  try {
    await api.destroyProject(project.id);

    // Poll until project disappears from the list
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const current = await api.listProjects();
      const found = current.find((p) => p.id === project.id);
      if (!found) {
        spinner.succeed(`Project '${projectName}' destroyed.`);
        return;
      }
      if (found.status === "destroyed") {
        spinner.succeed(`Project '${projectName}' destroyed.`);
        return;
      }
    }
    spinner.succeed(`Project '${projectName}' destruction in progress.`);
  } catch (err) {
    spinner.fail((err as Error).message);
    process.exit(1);
  }
}
