window.addEventListener("DOMContentLoaded", () => {
  if (!AppAPI.ensureAuthenticated()) return;
  UICommon.wireLogoutButton();

  const state = { patients: [], filtered: [] };

  const body = document.getElementById("patientsBody");
  const search = document.getElementById("patientSearch");
  const genderFilter = document.getElementById("genderFilter");
  const modal = document.getElementById("patientModal");
  const openBtn = document.getElementById("openPatientModal");
  const closeBtn = document.getElementById("closePatientModal");
  const form = document.getElementById("patientForm");
  const title = document.getElementById("patientModalTitle");

  function openModal(editPatient = null) {
    form.reset();
    form.patient_id.value = "";
    title.textContent = "Add Patient";

    if (editPatient) {
      title.textContent = "Edit Patient";
      form.patient_id.value = editPatient.id;
      form.name.value = editPatient.name;
      form.age.value = editPatient.age;
      form.gender.value = editPatient.gender;
      form.contact_number.value = editPatient.contact_number;
      form.address.value = editPatient.address;
      form.medical_history.value = editPatient.medical_history || "";
    }
    modal.classList.add("open");
  }

  function closeModal() {
    modal.classList.remove("open");
  }

  function applyFilters() {
    const q = search.value.trim().toLowerCase();
    const g = genderFilter.value;
    state.filtered = state.patients.filter((p) => {
      const matchGender = !g || p.gender === g;
      const blob = `${p.name} ${p.gender} ${p.contact_number} ${p.address}`.toLowerCase();
      const matchSearch = !q || blob.includes(q);
      return matchGender && matchSearch;
    });
    render();
  }

  function render() {
    body.innerHTML = state.filtered.length
      ? state.filtered.map((p) => `
        <tr>
          <td>${p.name}</td>
          <td>${p.age}</td>
          <td>${p.gender}</td>
          <td>${p.contact_number}</td>
          <td>${p.address}</td>
          <td>${p.medical_history || "-"}</td>
          <td class="space-x-2">
            <button class="btn-secondary" data-action="edit" data-id="${p.id}">Edit</button>
            <button class="btn-danger" data-action="delete" data-id="${p.id}">Delete</button>
          </td>
        </tr>
      `).join("")
      : '<tr><td colspan="7" class="text-on-surface-variant">No patients found.</td></tr>';
  }

  async function loadPatients() {
    try {
      const res = await AppAPI.request("/patients/");
      state.patients = res.data || [];
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
  genderFilter.addEventListener("change", applyFilters);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      name: form.name.value.trim(),
      age: Number(form.age.value),
      gender: form.gender.value,
      contact_number: form.contact_number.value.trim(),
      address: form.address.value.trim(),
      medical_history: form.medical_history.value.trim()
    };

    const patientId = form.patient_id.value;

    try {
      if (patientId) {
        await AppAPI.request(`/patients/${patientId}/`, { method: "PUT", body: payload });
        UICommon.toast("Patient updated.");
      } else {
        await AppAPI.request("/patients/", { method: "POST", body: payload });
        UICommon.toast("Patient created.");
      }
      closeModal();
      await loadPatients();
    } catch (err) {
      UICommon.toast(UICommon.formatError(err), "error");
    }
  });

  body.addEventListener("click", async (event) => {
    const btn = event.target.closest("button[data-action]");
    if (!btn) return;

    const id = btn.dataset.id;
    const patient = state.patients.find((p) => String(p.id) === id);
    if (!patient) return;

    if (btn.dataset.action === "edit") {
      openModal(patient);
      return;
    }

    if (btn.dataset.action === "delete") {
      if (!confirm(`Delete patient ${patient.name}?`)) return;
      try {
        await AppAPI.request(`/patients/${id}/`, { method: "DELETE" });
        UICommon.toast("Patient deleted.");
        await loadPatients();
      } catch (err) {
        UICommon.toast(UICommon.formatError(err), "error");
      }
    }
  });

  loadPatients();
});
