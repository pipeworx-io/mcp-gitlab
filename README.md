# mcp-gitlab

GitLab MCP — wraps the GitLab REST API v4 (BYO API key)

Part of the [Pipeworx](https://pipeworx.io) open MCP gateway.

## Tools

| Tool | Description |
|------|-------------|

## Quick Start

Add to your MCP client config:

```json
{
  "mcpServers": {
    "gitlab": {
      "url": "https://gateway.pipeworx.io/gitlab/mcp"
    }
  }
}
```

Or use the CLI:

```bash
npx pipeworx use gitlab
```

## License

MIT
