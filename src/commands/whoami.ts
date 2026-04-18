import chalk from "chalk";
import { getApiKey, getApiUrl } from "../config";

export async function whoamiCommand() {
  const res = await fetch(`${getApiUrl()}/api/v1/whoami`, {
    headers: { Authorization: `Bearer ${getApiKey()}` },
  });

  if (!res.ok) {
    console.error(chalk.red("Not logged in or invalid API key."));
    process.exit(1);
  }

  const user = (await res.json()) as {
    login: string;
    email: string | null;
    provider: string;
    created_at: string;
  };

  console.log(chalk.bold("Login:    ") + user.login);
  console.log(chalk.bold("Provider: ") + user.provider);
  if (user.email) {
    console.log(chalk.bold("Email:    ") + user.email);
  }
  console.log(chalk.bold("Since:    ") + user.created_at.slice(0, 10));
}
