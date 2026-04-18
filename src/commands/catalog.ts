import chalk from "chalk";
import { api } from "../client";
import { resolveProjectName } from "../project";

export async function catalogCommand(name?: string) {
  const projectName = resolveProjectName(name);
  const projects = await api.listProjects();
  const project = projects.find((p) => p.name === projectName);

  if (!project) {
    console.error(chalk.red(`Project '${projectName}' not found`));
    process.exit(1);
  }

  const catalog = await api.getCatalog(project.id);

  console.log(chalk.bold("Catalog:   ") + catalog.catalog_url);
  console.log(chalk.bold("Warehouse: ") + catalog.warehouse);
  console.log(chalk.bold("Namespace: ") + catalog.namespace);
}
