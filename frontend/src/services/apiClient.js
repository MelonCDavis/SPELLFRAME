const API_BASE =
  import.meta.env.VITE_API_URL || "https://spellframe.onrender.com";

function getToken() {
  return localStorage.getItem("tcc_token");
}

async function request(path, options = {}) {
  const token = getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
     const text = await res.text().catch(() => "");
     try {
       const data = text ? JSON.parse(text) : null;
       const msg = data?.error || data?.message;
       throw new Error(msg || text || res.statusText);
     } catch {
       throw new Error(text || res.statusText);
     }
  }

  if (res.status === 204) return null;
  return res.json();
}

export function apiGet(path) {
  return request(path, { method: "GET" });
}

export function apiPost(path, body) {
  return request(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function apiPatch(path, body) {
  return request(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function apiDelete(path) {
  return request(path, { method: "DELETE" });
}
