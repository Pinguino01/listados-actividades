import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  onSnapshot,
  setDoc
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBxLAPwwDSYWvA-4L-tttL5k8j2e2xmWM0",
  authDomain: "listados-2a35a.firebaseapp.com",
  projectId: "listados-2a35a",
  storageBucket: "listados-2a35a.firebasestorage.app",
  messagingSenderId: "478725901922",
  appId: "1:478725901922:web:00aa7b0638aa00627f4b3b"
};

const STORAGE_KEY = "activity-attendance-lists-v1";
const ACTIVE_KEY = "activity-attendance-active-list-v1";
const COLLECTION_NAME = "attendanceLists";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const listsCollection = collection(db, COLLECTION_NAME);
const FIREBASE_TIMEOUT_MS = 8000;

const fields = [
  { id: "name", label: "Nombre", type: "text" },
  { id: "institution", label: "Institucion", type: "text" },
  { id: "phone", label: "Numero de telefono", type: "tel" },
  { id: "email", label: "Correo", type: "email" },
  { id: "address", label: "Direccion", type: "text" }
];

const defaultFields = ["name", "institution", "phone"];

const state = {
  lists: [],
  activeId: null,
  listSearch: "",
  attendeeSearch: "",
  firebaseReady: false,
  applyingRemote: false
};

const els = {
  listStack: document.querySelector("#listStack"),
  listSearch: document.querySelector("#listSearch"),
  newListButton: document.querySelector("#newListButton"),
  duplicateListButton: document.querySelector("#duplicateListButton"),
  deleteListButton: document.querySelector("#deleteListButton"),
  printButton: document.querySelector("#printButton"),
  listTitle: document.querySelector("#listTitle"),
  fieldOptions: document.querySelector("#fieldOptions"),
  attendeeForm: document.querySelector("#attendeeForm"),
  addAttendeeButton: document.querySelector("#addAttendeeButton"),
  attendeeHead: document.querySelector("#attendeeHead"),
  attendeeBody: document.querySelector("#attendeeBody"),
  attendeeSearch: document.querySelector("#attendeeSearch"),
  clearSearchButton: document.querySelector("#clearSearchButton"),
  attendeeCount: document.querySelector("#attendeeCount"),
  fieldCount: document.querySelector("#fieldCount"),
  syncStatus: document.querySelector("#syncStatus"),
  emptyState: document.querySelector("#emptyState")
};

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createBlankList(title = "Nueva actividad") {
  return {
    id: createId(),
    title,
    fields: [...defaultFields],
    attendees: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function normalizeList(list) {
  return {
    id: list.id,
    title: list.title || "Sin titulo",
    fields: Array.isArray(list.fields) && list.fields.length ? list.fields : [...defaultFields],
    attendees: Array.isArray(list.attendees) ? list.attendees : [],
    createdAt: list.createdAt || new Date().toISOString(),
    updatedAt: list.updatedAt || new Date().toISOString()
  };
}

function setSyncStatus(text, status = "waiting") {
  els.syncStatus.textContent = text;
  els.syncStatus.className = `sync-${status}`;
}

function withTimeout(promise, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), FIREBASE_TIMEOUT_MS);
    })
  ]);
}

function loadLocalState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved?.lists?.length) {
      state.lists = saved.lists.map(normalizeList);
      state.activeId = localStorage.getItem(ACTIVE_KEY) || saved.activeId || state.lists[0].id;
      return;
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }

  const firstList = createBlankList("Actividad principal");
  state.lists = [firstList];
  state.activeId = firstList.id;
  saveLocalState();
}

function saveLocalState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ lists: state.lists, activeId: state.activeId })
  );
  localStorage.setItem(ACTIVE_KEY, state.activeId || "");
}

async function saveListToFirebase(list) {
  if (state.applyingRemote) return;

  try {
    await withTimeout(
      setDoc(doc(db, COLLECTION_NAME, list.id), normalizeList(list)),
      "Firebase tardo demasiado en guardar"
    );
    setSyncStatus("Guardado en Firebase", "ok");
  } catch (error) {
    console.error(error);
    setSyncStatus("Guardado local", "error");
  }
}

async function deleteListFromFirebase(listId) {
  try {
    await withTimeout(
      deleteDoc(doc(db, COLLECTION_NAME, listId)),
      "Firebase tardo demasiado en eliminar"
    );
    setSyncStatus("Guardado en Firebase", "ok");
  } catch (error) {
    console.error(error);
    setSyncStatus("Eliminado solo local", "error");
  }
}

async function uploadLocalListsIfFirebaseIsEmpty() {
  const snapshot = await withTimeout(
    getDocs(listsCollection),
    "Firebase tardo demasiado en consultar"
  );
  if (!snapshot.empty) return;
  await Promise.all(state.lists.map((list) => saveListToFirebase(list)));
}

function subscribeToFirebase() {
  onSnapshot(
    listsCollection,
    (snapshot) => {
      const remoteLists = snapshot.docs
        .map((item) => normalizeList({ id: item.id, ...item.data() }))
        .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
      if (!remoteLists.length) return;

      state.applyingRemote = true;
      state.lists = remoteLists;
      if (!state.lists.some((list) => list.id === state.activeId)) {
        state.activeId = state.lists[0].id;
      }
      saveLocalState();
      render();
      state.applyingRemote = false;
      state.firebaseReady = true;
      setSyncStatus("Conectado a Firebase", "ok");
    },
    (error) => {
      console.error(error);
      state.firebaseReady = false;
      setSyncStatus("Sin conexion Firebase", "error");
    }
  );
}

async function startFirebaseSync() {
  setSyncStatus("Conectando Firebase", "waiting");
  subscribeToFirebase();

  try {
    await uploadLocalListsIfFirebaseIsEmpty();
  } catch (error) {
    console.error(error);
    setSyncStatus("Usando guardado local", "error");
  }
}

function getActiveList() {
  return state.lists.find((list) => list.id === state.activeId) || state.lists[0];
}

function persistList(list) {
  list.updatedAt = new Date().toISOString();
  saveLocalState();
  saveListToFirebase(list);
}

function plural(count, singular, pluralText) {
  return `${count} ${count === 1 ? singular : pluralText}`;
}

function fieldById(id) {
  return fields.find((field) => field.id === id);
}

function normalize(text) {
  return String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function renderLists() {
  const queryText = normalize(state.listSearch);
  const visibleLists = state.lists.filter((list) => normalize(list.title).includes(queryText));
  els.listStack.innerHTML = "";

  visibleLists.forEach((list) => {
    const button = document.createElement("button");
    button.className = `list-item${list.id === state.activeId ? " active" : ""}`;
    button.type = "button";
    button.dataset.id = list.id;

    const title = document.createElement("strong");
    title.textContent = list.title || "Sin titulo";

    const detail = document.createElement("span");
    detail.textContent = `${plural(list.attendees.length, "asistente", "asistentes")} - ${plural(list.fields.length, "campo", "campos")}`;

    button.append(title, detail);
    els.listStack.append(button);
  });
}

function renderFieldOptions(list) {
  els.fieldOptions.innerHTML = "";

  fields.forEach((field) => {
    const label = document.createElement("label");
    label.className = "field-pill";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = list.fields.includes(field.id);
    checkbox.dataset.field = field.id;
    checkbox.disabled = field.id === "name" && list.fields.length === 1;

    label.append(checkbox, document.createTextNode(field.label));
    els.fieldOptions.append(label);
  });
}

function renderForm(list) {
  els.attendeeForm.innerHTML = "";

  list.fields.forEach((fieldId) => {
    const field = fieldById(fieldId);
    if (!field) return;

    const label = document.createElement("label");
    label.textContent = field.label;

    const input = document.createElement("input");
    input.type = field.type;
    input.name = field.id;
    input.autocomplete = field.id === "email" ? "email" : "off";

    label.append(input);
    els.attendeeForm.append(label);
  });
}

function attendeeMatches(attendee, list) {
  const queryText = normalize(state.attendeeSearch);
  if (!queryText) return true;
  return list.fields.some((fieldId) => normalize(attendee[fieldId]).includes(queryText));
}

function renderTable(list) {
  const visibleAttendees = list.attendees.filter((attendee) => attendeeMatches(attendee, list));
  const headRow = document.createElement("tr");

  list.fields.forEach((fieldId) => {
    const th = document.createElement("th");
    th.textContent = fieldById(fieldId)?.label || fieldId;
    headRow.append(th);
  });

  const actionHead = document.createElement("th");
  actionHead.className = "row-actions";
  actionHead.textContent = "Acciones";
  headRow.append(actionHead);

  els.attendeeHead.innerHTML = "";
  els.attendeeHead.append(headRow);
  els.attendeeBody.innerHTML = "";

  visibleAttendees.forEach((attendee) => {
    const row = document.createElement("tr");
    row.dataset.id = attendee.id;

    list.fields.forEach((fieldId) => {
      const td = document.createElement("td");
      const input = document.createElement("input");
      const field = fieldById(fieldId);
      input.type = field?.type || "text";
      input.value = attendee[fieldId] || "";
      input.dataset.field = fieldId;
      input.setAttribute("aria-label", field?.label || fieldId);
      td.append(input);
      row.append(td);
    });

    const actions = document.createElement("td");
    actions.className = "row-actions";
    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-row";
    deleteButton.type = "button";
    deleteButton.textContent = "Quitar";
    deleteButton.dataset.deleteId = attendee.id;
    actions.append(deleteButton);
    row.append(actions);
    els.attendeeBody.append(row);
  });

  els.emptyState.parentElement.classList.toggle("is-empty", visibleAttendees.length === 0);
}

function render() {
  const list = getActiveList();
  if (!list) return;

  state.activeId = list.id;
  els.listTitle.value = list.title;
  els.attendeeSearch.value = state.attendeeSearch;
  els.attendeeCount.textContent = plural(list.attendees.length, "asistente", "asistentes");
  els.fieldCount.textContent = plural(list.fields.length, "campo", "campos");

  renderLists();
  renderFieldOptions(list);
  renderForm(list);
  renderTable(list);
}

function addList() {
  const list = createBlankList(`Actividad ${state.lists.length + 1}`);
  state.lists.unshift(list);
  state.activeId = list.id;
  state.attendeeSearch = "";
  saveLocalState();
  saveListToFirebase(list);
  render();
  els.listTitle.focus();
  els.listTitle.select();
}

function duplicateList() {
  const active = getActiveList();
  const copy = {
    ...active,
    id: createId(),
    title: `${active.title} copia`,
    attendees: active.attendees.map((attendee) => ({ ...attendee, id: createId() })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  state.lists.unshift(copy);
  state.activeId = copy.id;
  saveLocalState();
  saveListToFirebase(copy);
  render();
}

function deleteList() {
  if (state.lists.length === 1) {
    alert("Debe existir al menos un listado.");
    return;
  }

  const active = getActiveList();
  const confirmed = confirm(`Eliminar "${active.title}"? Esta accion no se puede deshacer.`);
  if (!confirmed) return;

  state.lists = state.lists.filter((list) => list.id !== active.id);
  state.activeId = state.lists[0].id;
  state.attendeeSearch = "";
  saveLocalState();
  deleteListFromFirebase(active.id);
  render();
}

function updateFields(event) {
  const checkbox = event.target.closest("input[type='checkbox'][data-field]");
  if (!checkbox) return;

  const list = getActiveList();
  const fieldId = checkbox.dataset.field;
  const fieldSet = new Set(list.fields);

  if (checkbox.checked) {
    fieldSet.add(fieldId);
  } else if (fieldSet.size > 1) {
    fieldSet.delete(fieldId);
  }

  list.fields = fields.map((field) => field.id).filter((id) => fieldSet.has(id));
  persistList(list);
  render();
}

function addAttendee() {
  const list = getActiveList();
  const formInputs = [...els.attendeeForm.querySelectorAll("input")];
  const attendee = { id: createId() };

  formInputs.forEach((input) => {
    attendee[input.name] = input.value.trim();
  });

  const hasAnyValue = list.fields.some((fieldId) => attendee[fieldId]);
  if (!hasAnyValue) {
    formInputs[0]?.focus();
    return;
  }

  list.attendees.push(attendee);
  persistList(list);
  formInputs.forEach((input) => {
    input.value = "";
  });
  render();
  els.attendeeForm.querySelector("input")?.focus();
}

function updateAttendee(event) {
  const input = event.target.closest("tbody input[data-field]");
  if (!input) return;

  const list = getActiveList();
  const row = input.closest("tr");
  const attendee = list.attendees.find((item) => item.id === row.dataset.id);
  if (!attendee) return;

  attendee[input.dataset.field] = input.value;
  persistList(list);
  renderLists();
  els.attendeeCount.textContent = plural(list.attendees.length, "asistente", "asistentes");
}

function removeAttendee(event) {
  const button = event.target.closest("[data-delete-id]");
  if (!button) return;

  const list = getActiveList();
  list.attendees = list.attendees.filter((attendee) => attendee.id !== button.dataset.deleteId);
  persistList(list);
  render();
}

els.newListButton.addEventListener("click", addList);
els.duplicateListButton.addEventListener("click", duplicateList);
els.deleteListButton.addEventListener("click", deleteList);
els.printButton.addEventListener("click", () => window.print());

els.listSearch.addEventListener("input", (event) => {
  state.listSearch = event.target.value;
  renderLists();
});

els.listStack.addEventListener("click", (event) => {
  const button = event.target.closest(".list-item");
  if (!button) return;
  state.activeId = button.dataset.id;
  state.attendeeSearch = "";
  saveLocalState();
  render();
});

els.listTitle.addEventListener("input", (event) => {
  const list = getActiveList();
  list.title = event.target.value.trimStart() || "Sin titulo";
  persistList(list);
  renderLists();
});

els.fieldOptions.addEventListener("change", updateFields);
els.addAttendeeButton.addEventListener("click", addAttendee);

els.attendeeForm.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addAttendee();
  }
});

els.attendeeBody.addEventListener("input", updateAttendee);
els.attendeeBody.addEventListener("click", removeAttendee);

els.attendeeSearch.addEventListener("input", (event) => {
  state.attendeeSearch = event.target.value;
  renderTable(getActiveList());
});

els.clearSearchButton.addEventListener("click", () => {
  state.attendeeSearch = "";
  render();
});

loadLocalState();
render();
startFirebaseSync();
