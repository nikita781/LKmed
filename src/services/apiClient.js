const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export async function apiClient(path, options = {}) {
  const { body, headers = {}, method = "GET", ...restOptions } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...restOptions,
  });

  if (!response.ok) {
    const message = `API request failed with status ${response.status}`;
    throw new Error(message);
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  return response.json();
}
