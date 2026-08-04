# mcp-gitlab

GitLab MCP — wraps the GitLab REST API v4 (BYO API key)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `gitlab_list_projects` | List all accessible GitLab projects. Returns project ID, name, path, description, star count, and URL. Use gitlab_get_project to fetch detailed info. |
| `gitlab_get_project` | Get details for a specific GitLab project (e.g., project ID "123" or path "group/project"). Returns name, description, visibility, stars, forks, and default branch. |
| `gitlab_list_issues` | Search issues in a GitLab project by project ID. Returns issue ID, title, state (open/closed), labels, assignee, and URL. Filter by status and labels. |
| `gitlab_list_mrs` | List merge requests in a GitLab project by project ID. Returns MR ID, title, state, author, source/target branches, and URL. Filter by state and author. |
| `gitlab_get_file` | Fetch file content from a GitLab repository by project ID and file path (e.g., "src/main.py"). Returns decoded content, file size, name, and encoding. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "gitlab": {
      "url": "https://gateway.pipeworx.io/gitlab/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Gitlab data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
