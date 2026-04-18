import { createServer } from "node:http";
import { exec } from "node:child_process";
import { platform } from "node:process";
import chalk from "chalk";
import { saveConfig, loadConfig } from "../config";

function openBrowser(url: string) {
  const cmd =
    platform === "darwin"
      ? "open"
      : platform === "win32"
        ? "start"
        : "xdg-open";
  exec(`${cmd} "${url}"`);
}

export function loginCommand(): Promise<void> {
  return new Promise((resolve) => {
    const config = loadConfig();

    const server = createServer((req, res) => {
      const url = new URL(req.url ?? "/", `http://localhost`);

      if (url.pathname !== "/callback") {
        res.writeHead(404);
        res.end();
        return;
      }

      const apiKey = url.searchParams.get("key");
      const login = url.searchParams.get("login") ?? "user";

      if (!apiKey) {
        res.writeHead(400);
        res.end("Missing key");
        return;
      }

      // Send a nice response to the browser
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`<!DOCTYPE html>
<html><head><title>Polynya</title>
<style>body{font-family:system-ui;background:#040711;color:#e2e8f0;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
.card{text-align:center}h1{font-size:24px}p{color:#94a3b8}</style></head>
<body><div class="card"><h1>Welcome, ${login}</h1><p>You can close this tab and return to your terminal.</p></div></body></html>`);

      // Save the key and shut down
      saveConfig({ apiKey });
      console.log();
      console.log(
        chalk.green(`\u2713 Logged in as ${chalk.bold(login)}`)
      );

      server.close();
      resolve();
    });

    // Listen on random port
    server.listen(0, () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        console.error(chalk.red("Failed to start local server"));
        process.exit(1);
      }

      const port = addr.port;
      const authUrl = `${config.apiUrl}/auth/github?port=${port}`;

      console.log(chalk.bold("Login with GitHub"));
      console.log();
      console.log(chalk.dim("Opening browser..."));

      openBrowser(authUrl);
      console.log(chalk.dim("Waiting for authorization..."));
    });
  });
}
