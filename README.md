# mcp-gitlab

GitLab MCP — wraps the GitLab REST API v4 (BYO API key)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

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

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/gitlab/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Gitlab data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
