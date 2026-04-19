window.addEventListener("DOMContentLoaded", () => {
  if (!AppAPI.ensureAuthenticated()) return;
  UICommon.wireLogoutButton();

  const state = { doctors: [], filtered: [] };

  const cards = document.getElementById("doctorCards");
  const search = document.getElementById("doctorSearch");
  const availabilityFilter = document.getElementById("availabilityFilter");
  const modal = document.getElementById("doctorModal");
  const openBtn = document.getElementById("openDoctorModal");
  const closeBtn = document.getElementById("closeDoctorModal");
  const form = document.getElementById("doctorForm");
  const title = document.getElementById("doctorModalTitle");

  function openModal(doctor = null) {
    form.reset();
    form.doctor_id.value = "";
    title.textContent = "Add Doctor";

    if (doctor) {
      title.textContent = "Edit Doctor";
      form.doctor_id.value = doctor.id;
      form.name.value = doctor.name;
      form.specialization.value = doctor.specialization;
      form.experience_years.value = doctor.experience_years;
      form.contact_number.value = doctor.contact_number;
      form.email.value = doctor.email;
      form.available.value = String(doctor.available);
    }
    modal.classList.add("open");
  }

  function closeModal() {
    modal.classList.remove("open");
  }

  function render() {
    cards.innerHTML = state.filtered.length
      ? state.filtered.map((d) => `
        <article class="panel p-4 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-bold">${d.name}</h3>
            <span class="text-xs px-2 py-1 rounded ${d.available ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}">${d.available ? "Available" : "Unavailable"}</span>
          </div>
          <p class="text-on-surface-variant">${d.specialization} - ${d.experience_years} years</p>
          <p class="text-sm text-on-surface-variant">${d.email}<br/>${d.contact_number}</p>
          <div class="flex gap-2 flex-wrap">
            <button class="btn-secondary flex-1" data-action="edit" data-id="${d.id}">Edit</button>
            <button class="btn-danger min-w-[84px] text-center" data-action="delete" data-id="${d.id}">Delete</button>
          </div>
        </article>
      `).join("")
      : '<div class="panel p-4 text-on-surface-variant">No doctors found.</div>';
  }

  function applyFilters() {
    const q = search.value.trim().toLowerCase();
    const a = availabilityFilter.value;

    state.filtered = state.doctors.filter((d) => {
      const matchA = !a || String(d.available) === a;
      const blob = `${d.name} ${d.specialization} ${d.email}`.toLowerCase();
      const matchQ = !q || blob.includes(q);
      return matchA && matchQ;
    });

    render();
  }

  async function loadDoctors() {
    try {
      const res = await AppAPI.request("/doctors/");
      state.doctors = res.data || [];
      applyFilters();
    } catch (err) {
      UICommon.toast(UICommon.formatError(err), "error");
    }
  }

  openBtn.addEventListener("click", () => openModal());
  closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  search.addEventListener("input", applyFilters);
  availabilityFilter.addEventListener("change", applyFilters);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = {
      name: form.name.value.trim(),
      specialization: form.specialization.value.trim(),
      experience_years: Number(form.experience_years.value),
      contact_number: form.contact_number.value.trim(),
      email: form.email.value.trim(),
      available: form.available.value === "true"
    };

    try {
      if (form.doctor_id.value) {
        await AppAPI.request(`/doctors/${form.doctor_id.value}/`, { method: "PUT", body: payload });
        UICommon.toast("Doctor updated.");
      } else {
        await AppAPI.request("/doctors/", { method: "POST", body: payload });
        UICommon.toast("Doctor created.");
      }
      closeModal();
      await loadDoctors();
    } catch (err) {
      UICommon.toast(UICommon.formatError(err), "error");
    }
  });

  cards.addEventListener("click", async (event) => {
    const btn = event.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    const doctor = state.doctors.find((d) => String(d.id) === id);
    if (!doctor) return;

    if (btn.dataset.action === "edit") {
      openModal(doctor);
      return;
    }

    if (btn.dataset.action === "delete") {
      if (!confirm(`Delete doctor ${doctor.name}?`)) return;
      try {
        await AppAPI.request(`/doctors/${id}/`, { method: "DELETE" });
        UICommon.toast("Doctor deleted.");
        await loadDoctors();
      } catch (err) {
        UICommon.toast(UICommon.formatError(err), "error");
      }
    }
  });

  loadDoctors();
});

