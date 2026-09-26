const STORAGE_KEY = "bluelog_admin_token";
const RETURN_KEY = "bluelog_admin_return";

export function readAdminToken() {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function storeAdminToken(token) {
  window.sessionStorage.setItem(STORAGE_KEY, token);
}

export function clearAdminToken() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* sessionStorage can be unavailable in private contexts */
  }
}

export function rememberAdminReturn(path) {
  try {
    window.sessionStorage.setItem(RETURN_KEY, path);
  } catch {
    /* sessionStorage can be unavailable in private contexts */
  }
}

export function consumeAdminReturn() {
  try {
    const value = window.sessionStorage.getItem(RETURN_KEY) || "";
    window.sessionStorage.removeItem(RETURN_KEY);
    return value;
  } catch {
    return "";
  }
}

export function adminAuthHeaders(headers = {}) {
  const token = readAdminToken();
  if (!token) return { ...headers };
  return { ...headers, Authorization: `Bearer ${token}` };
}
