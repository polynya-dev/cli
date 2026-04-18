import chalk from "chalk";
import { api } from "../client";
import { loadProjectConfig } from "../project";

export async function statusCommand() {
  const config = loadProjectConfig();
  const detail = await api.getProject(config.project.id);

  const statusColor =
    detail.status === "running" ? chalk.green :
    detail.status === "paused" ? chalk.yellow :
    detail.status === "provisioning" ? chalk.cyan :
    detail.status === "destroying" || detail.status === "destroyed" ? chalk.red :
    chalk.dim;

  console.log(chalk.bold("Project:  ") + chalk.white(detail.name));
  console.log(chalk.bold("Status:   ") + statusColor(detail.status));
  console.log(chalk.bold("Tables:   ") + chalk.cyan(detail.tables.join(", ")));
  console.log(chalk.bold("Catalog:  ") + chalk.dim(detail.catalog_url));
  console.log(chalk.bold("Query:    ") + chalk.dim(detail.query_url ?? "n/a"));
  console.log(chalk.bold("MCP:      ") + chalk.dim("https://api.polynya.dev/mcp"));
  console.log(chalk.bold("Created:  ") + chalk.dim(detail.created_at));
  if (detail.error) {
    console.log(chalk.bold("Error:    ") + chalk.red(detail.error));
  }

  const session = detail.session;
  if (session?.active) {
    const uptime = session.started_at
      ? Math.round((Date.now() - new Date(session.started_at).getTime()) / 60000)
      : 0;
    const lastQuery = session.last_query_at
      ? Math.round((Date.now() - new Date(session.last_query_at).getTime()) / 60000)
      : null;
    console.log(
      chalk.bold("Session:  ") +
      chalk.green(session.status!) +
      chalk.dim(` (up ${uptime}m` + (lastQuery !== null ? `, last query ${lastQuery}m ago` : "") + ")")
    );
  } else {
    console.log(chalk.bold("Session:  ") + chalk.dim("none"));
  }
}
