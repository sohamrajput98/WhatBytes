(function () {
  const STORAGE_KEYS = {
    ACCESS: "accessToken",
    REFRESH: "refreshToken",
    USER: "currentUser"
  };

  function getAccessToken() {
    return localStorage.getItem(STORAGE_KEYS.ACCESS);
  }

  function getRefreshToken() {
    return localStorage.getItem(STORAGE_KEYS.REFRESH);
  }

  function setTokens(tokens) {
    if (tokens && tokens.access) {
      localStorage.setItem(STORAGE_KEYS.ACCESS, tokens.access);
    }
    if (tokens && tokens.refresh) {
      localStorage.setItem(STORAGE_KEYS.REFRESH, tokens.refresh);
    }
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.ACCESS);
    localStorage.removeItem(STORAGE_KEYS.REFRESH);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }

  function setUser(user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  function getUser() {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  }

  async function request(path, options = {}, retry = true) {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };

    const access = getAccessToken();
    if (access && !options.skipAuth) {
      headers.Authorization = `Bearer ${access}`;
    }

    const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch (error) {
      payload = null;
    }

    if (response.status === 401 && retry && getRefreshToken() && !options.skipAuth) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return request(path, options, false);
      }
      clearSession();
      throw new Error("Session expired. Please log in again.");
    }

    if (!response.ok || !payload || payload.success === false) {
      const message = payload?.error || payload?.message || `Request failed with status ${response.status}`;
      const details = payload?.details || {};
      const err = new Error(message);
      err.details = details;
      err.status = response.status;
      throw err;
    }

    return payload;
  }

  async function refreshAccessToken() {
    try {
      const refresh = getRefreshToken();
      if (!refresh) {
        return false;
      }
      const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh })
      });
      const payload = await res.json();
      if (!res.ok || !payload.success || !payload.data?.access) {
        return false;
      }
      localStorage.setItem(STORAGE_KEYS.ACCESS, payload.data.access);
      return true;
    } catch (error) {
      return false;
    }
  }

  function ensureAuthenticated() {
    if (!getAccessToken()) {
      window.location.href = "./auth.html";
      return false;
    }
    return true;
  }

  function logout() {
    clearSession();
    window.location.href = "./auth.html";
  }

  window.AppAPI = {
    request,
    setTokens,
    getAccessToken,
    getRefreshToken,
    clearSession,
    ensureAuthenticated,
    logout,
    setUser,
    getUser,
    storageKeys: STORAGE_KEYS
  };
})();
