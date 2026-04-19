(function () {
  function toast(message, kind = "success") {
    const container = document.getElementById("toast-container") || createContainer();
    const el = document.createElement("div");
    el.className = `rounded-lg px-4 py-3 text-sm font-semibold shadow-lg ${kind === "error" ? "bg-red-500/90 text-white" : "bg-emerald-500/90 text-white"}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
      el.remove();
    }, 3200);
  }

  function createContainer() {
    const wrap = document.createElement("div");
    wrap.id = "toast-container";
    wrap.className = "fixed top-4 right-4 z-[9999] space-y-2";
    document.body.appendChild(wrap);
    return wrap;
  }

  function formatError(err) {
    if (!err) return "Something went wrong.";
    if (err.details && typeof err.details === "object") {
      const firstKey = Object.keys(err.details)[0];
      const value = firstKey ? err.details[firstKey] : null;
      if (Array.isArray(value) && value.length) {
        return `${err.message} (${value[0]})`;
      }
    }
    return err.message || "Something went wrong.";
  }

  function wireLogoutButton() {
    document.addEventListener("click", (event) => {
      const target = event.target.closest("[data-action='logout']");
      if (!target) return;
      event.preventDefault();
      window.AppAPI.logout();
    });
  }

  window.UICommon = {
    toast,
    formatError,
    wireLogoutButton
  };
})();
