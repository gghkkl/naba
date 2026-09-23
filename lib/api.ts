type TokenGetter = () => Promise<string | null>;

let getToken: TokenGetter = async () => null;

export function setApiTokenGetter(getter: TokenGetter | null) {
  getToken = getter ?? (async () => null);
}

export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}) {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (!domain) throw new Error("رابط الخادم غير مهيأ");
  const token = await getToken();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`https://${domain}${path}`, { ...init, headers });
  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    const message =
      typeof body === "object" && body && "error" in body
        ? String((body as { error: unknown }).error)
        : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return body as T;
}