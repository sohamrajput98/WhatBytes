window.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const showLogin = document.getElementById("showLogin");
  const showRegister = document.getElementById("showRegister");

  if (window.AppAPI.getAccessToken()) {
    window.location.href = "./dashboard-overview.html";
    return;
  }

  function switchMode(mode) {
    const isLogin = mode === "login";
    loginForm.classList.toggle("hidden", !isLogin);
    registerForm.classList.toggle("hidden", isLogin);
    showLogin.className = isLogin ? "btn-primary flex-1" : "btn-secondary flex-1";
    showRegister.className = isLogin ? "btn-secondary flex-1" : "btn-primary flex-1";
  }

  showLogin.addEventListener("click", () => switchMode("login"));
  showRegister.addEventListener("click", () => switchMode("register"));

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(loginForm);
    try {
      const payload = await AppAPI.request("/auth/login/", {
        method: "POST",
        body: {
          email: form.get("email"),
          password: form.get("password")
        },
        skipAuth: true
      });
      AppAPI.setTokens(payload.data.tokens);
      AppAPI.setUser(payload.data.user);
      UICommon.toast("Logged in successfully.");
      window.location.href = "./dashboard-overview.html";
    } catch (err) {
      UICommon.toast(UICommon.formatError(err), "error");
    }
  });

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(registerForm);
    try {
      const payload = await AppAPI.request("/auth/register/", {
        method: "POST",
        body: {
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password")
        },
        skipAuth: true
      });
      AppAPI.setTokens(payload.data.tokens);
      AppAPI.setUser(payload.data.user);
      UICommon.toast("Account created successfully.");
      window.location.href = "./dashboard-overview.html";
    } catch (err) {
      UICommon.toast(UICommon.formatError(err), "error");
    }
  });
});
