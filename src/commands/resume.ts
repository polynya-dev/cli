import chalk from "chalk";
import { api } from "../client";
import { resolveProjectName } from "../project";

export async function resumeCommand(name?: string) {
  const projectName = resolveProjectName(name);
  const projects = await api.listProjects();
  const project = projects.find((p) => p.name === projectName);

  if (!project) {
    console.error(chalk.red(`Project '${projectName}' not found`));
    process.exit(1);
  }

  const result = await api.resumeProject(project.id);
  console.log(chalk.green(result.message));
}
