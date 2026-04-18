# Polynya

Turn your Postgres into AI-ready data workspaces.

Stream Postgres to Iceberg. Build workspaces your agents can query. Stop pointing AI agents at your production database.

## Quickstart

```bash
npx polynya create --all
```

That's it. Your Postgres data is now syncing to Iceberg every 30 seconds. Query it with the included ephemeral ClickHouse, or connect any Iceberg-compatible engine.

## Commands

| Command | Description |
|---------|-------------|
| `polynya login` | Authenticate with GitHub |
| `polynya create` | Create a new project |
| `polynya status` | Show project status |
| `polynya query` | Run a SQL query |
| `polynya pause` | Pause replication |
| `polynya resume` | Resume replication |
| `polynya destroy` | Destroy a project |
| `polynya catalog` | Show catalog connection details |

## MCP

Connect Polynya as an MCP server so your AI agent can query your data:

```bash
claude mcp add --transport http polynya https://api.polynya.dev/mcp
```

Your agent gets its own ephemeral ClickHouse with near real-time data. It queries workspaces, creates views, and builds up an analytical layer that gets smarter over time.

## Links

- [polynya.dev](https://polynya.dev) - Website
- [docs.polynya.dev](https://docs.polynya.dev) - Documentation
- Built on [pg2iceberg](https://pg2iceberg.dev)
