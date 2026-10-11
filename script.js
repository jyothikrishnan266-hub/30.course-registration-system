const STORAGE_KEY = "medicalRecordsDemo";

const form = document.getElementById("patientForm");
const table = document.getElementById("recordsTable");
const searchInput = document.getElementById("searchInput");

let records = loadRecords();

function loadRecords() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// Escape user-entered text before displaying it in HTML.
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function saveRecords() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch {
    alert("Unable to save records in this browser.");
    return false;
  }
}

function updateDashboard() {
  document.getElementById("totalPatients").textContent =
    records.length;

  document.getElementById("malePatients").textContent =
    records.filter(r => r.gender === "Male").length;

  document.getElementById("femalePatients").textContent =
    records.filter(r => r.gender === "Female").length;
}

function renderRecords() {
  const query = searchInput.value.trim().toLowerCase();

  const filtered = records.filter(r =>
    [r.id, r.name, r.diagnosis, r.doctor, r.phone]
      .some(value => String(value ?? "").toLowerCase().includes(query))
  );

  table.innerHTML = filtered.map(r => `
    <tr>
      <td>${escapeHTML(r.id)}</td>
      <td>
        <strong>${escapeHTML(r.name)}</strong><br>
        <small>${escapeHTML(r.phone || "No phone")}</small>
      </td>
      <td>${escapeHTML(r.age)} / ${escapeHTML(r.gender)}</td>
      <td>${escapeHTML(r.doctor)}</td>
      <td>${escapeHTML(r.date)}</td>
      <td>${escapeHTML(r.diagnosis)}</td>
      <td>
        <button class="action-btn edit-btn"
          data-action="edit" data-id="${escapeHTML(r.id)}">
          Edit
        </button>
        <button class="action-btn delete-btn"
          data-action="delete" data-id="${escapeHTML(r.id)}">
          Delete
        </button>
      </td>
    </tr>
  `).join("");

  document.getElementById("emptyMessage").style.display =
    filtered.length ? "none" : "block";

  updateDashboard();
}

function showForm() {
  document.getElementById("formPanel").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
  document.getElementById("name").focus({ preventScroll: true });
}

function resetForm() {
  form.reset();
  document.getElementById("recordId").value = "";
  document.getElementById("formTitle").textContent =
    "Add Patient Record";
  document.getElementById("saveBtn").textContent = "Save Record";
}

form.addEventListener("submit", function(event) {
  event.preventDefault();

  const recordId = document.getElementById("recordId").value;
  const age = Number(document.getElementById("age").value);
  const name = document.getElementById("name").value.trim();
  const doctor = document.getElementById("doctor").value.trim();
  const diagnosis = document.getElementById("diagnosis").value.trim();

  if (!name || !doctor || !diagnosis ||
      !Number.isInteger(age) || age < 0 || age > 125) {
    alert("Please enter valid patient information.");
    return;
  }

  const patient = {
    id: recordId || (
      "MR-" + Date.now().toString(36).toUpperCase()
    ),
    name,
    age,
    gender: document.getElementById("gender").value,
    phone: document.getElementById("phone").value.trim(),
    doctor,
    date: document.getElementById("date").value,
    diagnosis
  };

  const previousRecords = records.slice();

  if (recordId) {
    const index = records.findIndex(r => r.id === recordId);

    if (index === -1) {
      alert("Record not found. Please refresh the page.");
      return;
    }

    records[index] = patient;
  } else {
    records.unshift(patient);
  }

  if (!saveRecords()) {
    records = previousRecords;
    return;
  }

  renderRecords();
  resetForm();
  alert(recordId
    ? "Patient record updated successfully."
    : "Patient record saved successfully.");
});

table.addEventListener("click", function(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;
  const patient = records.find(r => r.id === id);

  if (!patient) return;

  if (action === "edit") {
    document.getElementById("recordId").value = patient.id;
    document.getElementById("name").value = patient.name;
    document.getElementById("age").value = patient.age;
    document.getElementById("gender").value = patient.gender;
    document.getElementById("phone").value = patient.phone;
    document.getElementById("doctor").value = patient.doctor;
    document.getElementById("date").value = patient.date;
    document.getElementById("diagnosis").value = patient.diagnosis;

    document.getElementById("formTitle").textContent =
      "Edit Patient Record";
    document.getElementById("saveBtn").textContent =
      "Update Record";

    showForm();
  }

  if (action === "delete") {
    const confirmed = confirm(
      `Delete the record for ${patient.name}? This cannot be undone.`
    );

    if (!confirmed) return;

    const previousRecords = records.slice();
    records = records.filter(r => r.id !== id);

    if (!saveRecords()) {
      records = previousRecords;
      return;
    }

    renderRecords();

    if (document.getElementById("recordId").value === id) {
      resetForm();
    }
  }
});

searchInput.addEventListener("input", renderRecords);

// Display saved records when the page opens.
renderRecords();