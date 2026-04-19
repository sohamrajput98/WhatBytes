const NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: "dashboard", href: "dashboard-overview.html" },
  { key: "patients", label: "Clinical Records", icon: "personal_injury", href: "patient-management.html" },
  { key: "doctors", label: "Staff Directory", icon: "medical_services", href: "doctor-staff-directory.html" },
  { key: "mappings", label: "Network Mappings", icon: "hub", href: "patient-doctor-mapping.html" }
];

function sidebarTemplate(activeKey) {
  const links = NAV_ITEMS.map((item) => {
    const active = item.key === activeKey;
    return `
      <a href="${item.href}" class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${active ? "bg-emerald-500/10 text-emerald-400 border-r-2 border-emerald-400 font-medium" : "text-slate-400 hover:text-slate-100 hover:bg-white/5"}">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' ${active ? 1 : 0};">${item.icon}</span>
        <span>${item.label}</span>
      </a>`;
  }).join("\n");

  return `
    <aside class="app-sidebar hidden md:flex flex-col h-screen border-r border-white/5 bg-[#0b1020] sticky top-0 py-6 px-4">
      <div class="flex items-center gap-3 px-2 mb-10">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-[0_4px_14px_0_rgba(34,197,94,0.39)]">
          <span class="material-symbols-outlined text-on-primary-fixed" style="font-variation-settings: 'FILL' 1;">medical_services</span>
        </div>
        <div>
          <h1 class="text-lg font-black text-white tracking-tight">Sanctuary Health</h1>
          <p class="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Care Operations</p>
        </div>
      </div>
      <nav class="flex-1 space-y-1">${links}</nav>
      <div class="pt-6 mt-6 border-t border-white/5 space-y-1">
        <a href="#" class="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-100 hover:bg-white/5 rounded-lg text-sm transition-colors">
          <span class="material-symbols-outlined">help</span>
          <span>Help Center</span>
        </a>
        <a href="#" data-action="logout" class="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-100 hover:bg-white/5 rounded-lg text-sm transition-colors">
          <span class="material-symbols-outlined">logout</span>
          <span>Sign Out</span>
        </a>
      </div>
    </aside>`;
}

function mobileNavTemplate(activeKey) {
  const links = NAV_ITEMS.map((item) => {
    const active = item.key === activeKey;
    return `
      <a href="${item.href}" class="flex flex-col items-center gap-1 ${active ? "text-emerald-400" : "text-slate-500"}">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' ${active ? 1 : 0};">${item.icon}</span>
        <span class="text-[10px] font-medium">${item.label.split(" ")[0]}</span>
      </a>`;
  }).join("\n");

  return `<nav class="mobile-nav md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-16 px-4">${links}</nav>`;
}

window.addEventListener("DOMContentLoaded", () => {
  const activePage = document.body.dataset.page || "overview";

  const sidebarMount = document.querySelector("[data-sidebar]");
  if (sidebarMount) {
    sidebarMount.outerHTML = sidebarTemplate(activePage);
  }

  const mobileMount = document.querySelector("[data-mobile-nav]");
  if (mobileMount) {
    mobileMount.outerHTML = mobileNavTemplate(activePage);
  }
});

