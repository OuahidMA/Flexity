/**
 * HTTP client for the Flexity API.
 *
 * Requests default to cookie-based auth (`credentials: "include"`), which is how
 * the session travels after login. A bearer token can still be supplied by
 * callers that need one explicitly.
 */

const API_BASE = (import.meta.env.VITE_API_URL ?? "/api").replace(/\/+$/, "");

/**
 * Error thrown for non-2xx responses. Callers inspect `status` to branch on
 * transport-level outcomes (for example, a 401 clears the local session).
 */
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Perform a JSON request against the API.
 *
 * @param {string} path - API path starting with "/" (e.g. "/auth/me").
 * @param {object} [options] - Request configuration.
 * @param {string} [options.method="GET"] - HTTP method.
 * @param {unknown} [options.body] - Serialized as JSON; also sets Content-Type.
 * @param {string} [options.token] - Optional bearer token; cookies are the default.
 * @param {object} [options.headers] - Extra headers merged over Accept.
 * @param {AbortSignal} [options.signal] - Lets hooks cancel stale requests.
 * @param {RequestCredentials} [options.credentials="include"] - Send session cookies.
 * @returns {Promise<any>} Parsed JSON body, or null when the response is not JSON.
 * @throws {ApiError} When the server responds with a non-2xx status.
 */
export async function apiRequest(path, options = {}) {
  const {
    method = "GET",
    body,
    token,
    headers,
    signal,
    credentials = "include",
  } = options;

  const config = {
    method,
    signal,
    credentials,
    headers: {
      Accept: "application/json",
      ...headers,
    },
  };

  if (body !== undefined) {
    config.headers["Content-Type"] = "application/json";
    config.body = JSON.stringify(body);
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, config);
  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new ApiError(
      data?.message ?? "Something went wrong. Please try again.",
      response.status,
      data
    );
  }

  return data;
}

export { API_BASE };
