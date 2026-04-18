import chalk from "chalk";
import { api } from "../client";

const statusColors: Record<string, (s: string) => string> = {
  running: chalk.green,
  provisioning: chalk.yellow,
  error: chalk.red,
  destroying: chalk.dim,
  stopped: chalk.dim,
};

export async function lsCommand() {
  const projects = await api.listProjects();

  if (projects.length === 0) {
    console.log(chalk.dim("No projects. Run: npx polynya create -n <name>"));
    return;
  }

  console.log(
    chalk.bold(
      "NAME".padEnd(20) +
        "STATUS".padEnd(15) +
        "TABLES".padEnd(10) +
        "CREATED"
    )
  );

  for (const p of projects) {
    const colorFn = statusColors[p.status] ?? chalk.white;
    console.log(
      p.name.padEnd(20) +
        colorFn(p.status.padEnd(15)) +
        String(p.tables.length).padEnd(10) +
        p.created_at.slice(0, 10)
    );
  }
}
