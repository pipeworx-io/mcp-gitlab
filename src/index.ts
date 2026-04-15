interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

/**
 * GitLab MCP — wraps the GitLab REST API v4 (BYO API key)
 *
 * Tools:
 * - gitlab_list_projects: list projects accessible to the user
 * - gitlab_get_project: get a single project by ID
 * - gitlab_list_issues: list issues in a project
 * - gitlab_list_mrs: list merge requests in a project
 * - gitlab_get_file: get a file's contents from a repository
 */


const BASE = 'https://gitlab.com/api/v4';

// ── Tool definitions ──────────────────────────────────────────────────

const tools: McpToolExport['tools'] = [
  {
    name: 'gitlab_list_projects',
    description:
      'List GitLab projects accessible to the authenticated user. Returns project ID, name, path, description, stars, and URL.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        _apiKey: { type: 'string', description: 'GitLab personal access token' },
        search: { type: 'string', description: 'Search projects by name' },
        owned: {
          type: 'boolean',
          description: 'If true, only return projects owned by the user (default: false)',
        },
        per_page: {
          type: 'number',
          description: 'Number of projects to return (default 20, max 100)',
        },
      },
      required: ['_apiKey'],
    },
  },
  {
    name: 'gitlab_get_project',
    description:
      'Get a single GitLab project by ID or URL-encoded path. Returns full project details including name, description, visibility, stars, forks, and default branch.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        _apiKey: { type: 'string', description: 'GitLab personal access token' },
        id: {
          type: 'string',
          description: 'Project ID (numeric) or URL-encoded path (e.g., "group%2Fproject")',
        },
      },
      required: ['_apiKey', 'id'],
    },
  },
  {
    name: 'gitlab_list_issues',
    description:
      'List issues in a GitLab project. Returns issue IID, title, state, labels, assignee, and URL.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        _apiKey: { type: 'string', description: 'GitLab personal access token' },
        project_id: { type: 'string', description: 'Project ID or URL-encoded path' },
        state: {
          type: 'string',
          description: 'Filter by state: "opened", "closed", or "all" (default: "opened")',
        },
        search: { type: 'string', description: 'Search issues by title or description' },
        per_page: {
          type: 'number',
          description: 'Number of issues to return (default 20, max 100)',
        },
      },
      required: ['_apiKey', 'project_id'],
    },
  },
  {
    name: 'gitlab_list_mrs',
    description:
      'List merge requests in a GitLab project. Returns MR IID, title, state, author, source/target branches, and URL.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        _apiKey: { type: 'string', description: 'GitLab personal access token' },
        project_id: { type: 'string', description: 'Project ID or URL-encoded path' },
        state: {
          type: 'string',
          description: 'Filter by state: "opened", "closed", "merged", or "all" (default: "opened")',
        },
        per_page: {
          type: 'number',
          description: 'Number of merge requests to return (default 20, max 100)',
        },
      },
      required: ['_apiKey', 'project_id'],
    },
  },
  {
    name: 'gitlab_get_file',
    description:
      'Get a file from a GitLab repository. Returns the file content (decoded from base64), file name, size, and encoding.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        _apiKey: { type: 'string', description: 'GitLab personal access token' },
        project_id: { type: 'string', description: 'Project ID or URL-encoded path' },
        file_path: { type: 'string', description: 'Path to the file within the repository' },
        ref: {
          type: 'string',
          description: 'Branch, tag, or commit SHA (default: default branch)',
        },
      },
      required: ['_apiKey', 'project_id', 'file_path'],
    },
  },
];

// ── Helpers ───────────────────────────────────────────────────────────

function extractKey(args: Record<string, unknown>): string {
  const key = args._apiKey as string;
  if (!key) throw new Error('GitLab personal access token required. Pass _apiKey parameter.');
  return key;
}

async function gitlabGet(token: string, path: string, params?: Record<string, string>): Promise<unknown> {
  const qs = params ? `?${new URLSearchParams(params)}` : '';
  const res = await fetch(`${BASE}${path}${qs}`, {
    headers: { 'PRIVATE-TOKEN': token },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitLab API error ${res.status}: ${text}`);
  }
  return res.json();
}

// ── Tool implementations ─────────────────────────────────────────────

async function listProjects(token: string, search?: string, owned?: boolean, perPage?: number) {
  const count = Math.min(100, Math.max(1, perPage ?? 20));
  const params: Record<string, string> = {
    per_page: String(count),
    order_by: 'updated_at',
    sort: 'desc',
  };
  if (search) params.search = search;
  if (owned) params.owned = 'true';

  const data = (await gitlabGet(token, '/projects', params)) as {
    id: number;
    name: string;
    path_with_namespace: string;
    description: string | null;
    star_count: number;
    forks_count: number;
    web_url: string;
    default_branch: string;
    visibility: string;
    last_activity_at: string;
  }[];

  return {
    projects: data.map((p) => ({
      id: p.id,
      name: p.name,
      full_path: p.path_with_namespace,
      description: p.description ?? null,
      stars: p.star_count,
      forks: p.forks_count,
      url: p.web_url,
      default_branch: p.default_branch,
      visibility: p.visibility,
      last_activity: p.last_activity_at,
    })),
  };
}

async function getProject(token: string, id: string) {
  const data = (await gitlabGet(token, `/projects/${encodeURIComponent(id)}`)) as {
    id: number;
    name: string;
    path_with_namespace: string;
    description: string | null;
    web_url: string;
    star_count: number;
    forks_count: number;
    open_issues_count: number;
    default_branch: string;
    visibility: string;
    archived: boolean;
    creator_id: number;
    namespace: { full_path: string };
    topics: string[];
    created_at: string;
    last_activity_at: string;
  };

  return {
    id: data.id,
    name: data.name,
    full_path: data.path_with_namespace,
    description: data.description ?? null,
    url: data.web_url,
    stars: data.star_count,
    forks: data.forks_count,
    open_issues: data.open_issues_count,
    default_branch: data.default_branch,
    visibility: data.visibility,
    archived: data.archived,
    namespace: data.namespace?.full_path ?? null,
    topics: data.topics ?? [],
    created_at: data.created_at,
    last_activity: data.last_activity_at,
  };
}

async function listIssues(token: string, projectId: string, state?: string, search?: string, perPage?: number) {
  const count = Math.min(100, Math.max(1, perPage ?? 20));
  const params: Record<string, string> = {
    state: state ?? 'opened',
    per_page: String(count),
    order_by: 'updated_at',
    sort: 'desc',
  };
  if (search) params.search = search;

  const data = (await gitlabGet(
    token,
    `/projects/${encodeURIComponent(projectId)}/issues`,
    params,
  )) as {
    iid: number;
    title: string;
    state: string;
    labels: string[];
    assignee: { username: string; name: string } | null;
    author: { username: string } | null;
    web_url: string;
    created_at: string;
    updated_at: string;
  }[];

  return {
    issues: data.map((i) => ({
      iid: i.iid,
      title: i.title,
      state: i.state,
      labels: i.labels,
      assignee: i.assignee?.username ?? null,
      author: i.author?.username ?? null,
      url: i.web_url,
      created_at: i.created_at,
      updated_at: i.updated_at,
    })),
  };
}

async function listMergeRequests(token: string, projectId: string, state?: string, perPage?: number) {
  const count = Math.min(100, Math.max(1, perPage ?? 20));
  const params: Record<string, string> = {
    state: state ?? 'opened',
    per_page: String(count),
    order_by: 'updated_at',
    sort: 'desc',
  };

  const data = (await gitlabGet(
    token,
    `/projects/${encodeURIComponent(projectId)}/merge_requests`,
    params,
  )) as {
    iid: number;
    title: string;
    state: string;
    author: { username: string } | null;
    source_branch: string;
    target_branch: string;
    merge_status: string;
    web_url: string;
    created_at: string;
    updated_at: string;
  }[];

  return {
    merge_requests: data.map((mr) => ({
      iid: mr.iid,
      title: mr.title,
      state: mr.state,
      author: mr.author?.username ?? null,
      source_branch: mr.source_branch,
      target_branch: mr.target_branch,
      merge_status: mr.merge_status,
      url: mr.web_url,
      created_at: mr.created_at,
      updated_at: mr.updated_at,
    })),
  };
}

async function getFile(token: string, projectId: string, filePath: string, ref?: string) {
  const params: Record<string, string> = {};
  if (ref) params.ref = ref;

  const data = (await gitlabGet(
    token,
    `/projects/${encodeURIComponent(projectId)}/repository/files/${encodeURIComponent(filePath)}`,
    params,
  )) as {
    file_name: string;
    file_path: string;
    size: number;
    encoding: string;
    content: string;
    ref: string;
    last_commit_id: string;
  };

  // Decode base64 content
  let content: string;
  try {
    content = atob(data.content);
  } catch {
    content = data.content;
  }

  return {
    file_name: data.file_name,
    file_path: data.file_path,
    size: data.size,
    ref: data.ref,
    last_commit: data.last_commit_id,
    content,
  };
}

// ── callTool dispatcher ──────────────────────────────────────────────

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const apiKey = extractKey(args);

  switch (name) {
    case 'gitlab_list_projects':
      return listProjects(
        apiKey,
        args.search as string | undefined,
        args.owned as boolean | undefined,
        args.per_page as number | undefined,
      );
    case 'gitlab_get_project':
      return getProject(apiKey, args.id as string);
    case 'gitlab_list_issues':
      return listIssues(
        apiKey,
        args.project_id as string,
        args.state as string | undefined,
        args.search as string | undefined,
        args.per_page as number | undefined,
      );
    case 'gitlab_list_mrs':
      return listMergeRequests(
        apiKey,
        args.project_id as string,
        args.state as string | undefined,
        args.per_page as number | undefined,
      );
    case 'gitlab_get_file':
      return getFile(
        apiKey,
        args.project_id as string,
        args.file_path as string,
        args.ref as string | undefined,
      );
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export default { tools, callTool, meter: { credits: 5 } } satisfies McpToolExport;
