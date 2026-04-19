window.addEventListener("DOMContentLoaded", async () => {
  if (!AppAPI.ensureAuthenticated()) return;
  UICommon.wireLogoutButton();

  const welcomeText = document.getElementById("welcomeText");
  const statPatients = document.getElementById("statPatients");
  const statDoctors = document.getElementById("statDoctors");
  const statMappings = document.getElementById("statMappings");
  const statUnmapped = document.getElementById("statUnmapped");
  const body = document.getElementById("recentPatientsBody");

  try {
    const me = await AppAPI.request("/auth/me/");
    welcomeText.textContent = `Welcome back, ${me.data.name}.`;

    const [patientsRes, doctorsRes, mappingsRes] = await Promise.all([
      AppAPI.request("/patients/"),
      AppAPI.request("/doctors/"),
      AppAPI.request("/mappings/")
    ]);

    const patients = patientsRes.data || [];
    const doctors = doctorsRes.data || [];
    const mappings = mappingsRes.data || [];

    const mappedPatientIds = new Set(mappings.map((m) => m.patient?.id).filter(Boolean));
    const unmappedCount = patients.filter((p) => !mappedPatientIds.has(p.id)).length;

    statPatients.textContent = String(patients.length);
    statDoctors.textContent = String(doctors.length);
    statMappings.textContent = String(mappings.length);
    statUnmapped.textContent = String(unmappedCount);

    const recent = [...patients]
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 8);

    body.innerHTML = recent.length
      ? recent.map((p) => `
        <tr>
          <td>${p.name}</td>
          <td>${p.age}</td>
          <td>${p.gender}</td>
          <td>${p.contact_number || "-"}</td>
          <td>${new Date(p.updated_at).toLocaleString()}</td>
        </tr>
      `).join("")
      : '<tr><td colspan="5" class="text-on-surface-variant">No patients found.</td></tr>';
  } catch (err) {
    UICommon.toast(UICommon.formatError(err), "error");
  }
});
