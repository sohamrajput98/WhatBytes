window.addEventListener("DOMContentLoaded", async () => {
  if (!AppAPI.ensureAuthenticated()) return;
  UICommon.wireLogoutButton();

  const patientSelect = document.getElementById("patientSelect");
  const doctorSelect = document.getElementById("doctorSelect");
  const notesInput = document.getElementById("mappingNotes");
  const mappingForm = document.getElementById("mappingForm");
  const mappingTableBody = document.getElementById("mappingTableBody");
  const patientFilterSelect = document.getElementById("patientFilterSelect");
  const patientDoctorList = document.getElementById("patientDoctorList");

  const state = { patients: [], doctors: [], mappings: [] };

  function fillSelect(select, items, labelFn) {
    select.innerHTML = items.length
      ? items.map((item) => `<option value="${item.id}">${labelFn(item)}</option>`).join("")
      : '<option value="">No data</option>';
  }

  async function loadBaseData() {
    const [patientsRes, doctorsRes, mappingsRes] = await Promise.all([
      AppAPI.request("/patients/"),
      AppAPI.request("/doctors/"),
      AppAPI.request("/mappings/")
    ]);

    state.patients = patientsRes.data || [];
    state.doctors = doctorsRes.data || [];
    state.mappings = mappingsRes.data || [];

    fillSelect(patientSelect, state.patients, (p) => `${p.name} (#${p.id})`);
    fillSelect(doctorSelect, state.doctors, (d) => `${d.name} - ${d.specialization}`);

    patientFilterSelect.innerHTML = '<option value="">Select patient</option>' +
      state.patients.map((p) => `<option value="${p.id}">${p.name} (#${p.id})</option>`).join("");

    renderMappings();
  }

  function renderMappings() {
    mappingTableBody.innerHTML = state.mappings.length
      ? state.mappings.map((m) => `
        <tr>
          <td>${m.id}</td>
          <td>${m.patient?.name || "-"}</td>
          <td>${m.doctor?.name || "-"}</td>
          <td>${m.notes || "-"}</td>
          <td>${new Date(m.assigned_at).toLocaleString()}</td>
          <td><button class="btn-danger" data-delete-id="${m.id}">Delete</button></td>
        </tr>
      `).join("")
      : '<tr><td colspan="6" class="text-on-surface-variant">No mappings found.</td></tr>';
  }

  async function loadPatientDoctors(patientId) {
    if (!patientId) {
      patientDoctorList.innerHTML = '<li class="text-on-surface-variant">Select a patient to view assigned doctors.</li>';
      return;
    }

    try {
      const res = await AppAPI.request(`/mappings/${patientId}/`);
      const doctors = res.data?.doctors || [];
      patientDoctorList.innerHTML = doctors.length
        ? doctors.map((d) => `
          <li class="panel p-3 flex items-center justify-between">
            <div>
              <p class="font-semibold">${d.doctor?.name || "-"}</p>
              <p class="text-sm text-on-surface-variant">${d.doctor?.specialization || "-"}</p>
            </div>
            <p class="text-sm text-on-surface-variant">${d.notes || "No notes"}</p>
          </li>
        `).join("")
        : '<li class="text-on-surface-variant">No doctors assigned to this patient.</li>';
    } catch (err) {
      patientDoctorList.innerHTML = '<li class="text-red-300">Failed to load patient mappings.</li>';
    }
  }

  mappingForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await AppAPI.request("/mappings/", {
        method: "POST",
        body: {
          patient_id: Number(patientSelect.value),
          doctor_id: Number(doctorSelect.value),
          notes: notesInput.value.trim()
        }
      });
      UICommon.toast("Mapping created.");
      notesInput.value = "";
      await loadBaseData();
      await loadPatientDoctors(patientFilterSelect.value || patientSelect.value);
    } catch (err) {
      UICommon.toast(UICommon.formatError(err), "error");
    }
  });

  mappingTableBody.addEventListener("click", async (event) => {
    const btn = event.target.closest("button[data-delete-id]");
    if (!btn) return;

    const mappingId = btn.dataset.deleteId;
    if (!confirm(`Delete mapping #${mappingId}?`)) return;

    try {
      await AppAPI.request(`/mappings/${mappingId}/`, { method: "DELETE" });
      UICommon.toast("Mapping deleted.");
      await loadBaseData();
      await loadPatientDoctors(patientFilterSelect.value);
    } catch (err) {
      UICommon.toast(UICommon.formatError(err), "error");
    }
  });

  patientFilterSelect.addEventListener("change", async () => {
    await loadPatientDoctors(patientFilterSelect.value);
  });

  try {
    await loadBaseData();
    await loadPatientDoctors("");
  } catch (err) {
    UICommon.toast(UICommon.formatError(err), "error");
  }
});
