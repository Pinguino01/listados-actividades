const STORAGE_KEY = "burger-house-menu";
const AUTH_KEY = "burger-house-admin-auth";
const ADMIN_USER = "admin";
const ADMIN_PASSWORD = "admin123";

const starterItems = [
  {
    id: crypto.randomUUID(),
    name: "Classic Burger",
    price: 24.9,
    category: "Hamburguesas",
    description: "Carne a la plancha, queso cheddar, lechuga fresca y salsa especial.",
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: crypto.randomUUID(),
    name: "Combo Doble",
    price: 39.9,
    category: "Combos",
    description: "Hamburguesa doble con papas doradas y bebida fria.",
    image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: crypto.randomUUID(),
    name: "Papas Crispy",
    price: 12.5,
    category: "Combos",
    description: "Papas crocantes con sal fina y salsa de la casa.",
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: crypto.randomUUID(),
    name: "Soda Helada",
    price: 8,
    category: "Bebidas",
    description: "Bebida refrescante servida bien fria.",
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=80"
  }
];

const menuGrid = document.querySelector("#menuGrid");
const itemCount = document.querySelector("#itemCount");
const emptyState = document.querySelector("#emptyState");
const tabs = document.querySelectorAll(".tab");
const adminEntry = document.querySelector("#adminEntry");
const adminModal = document.querySelector("#adminModal");
const closeAdmin = document.querySelector("#closeAdmin");
const adminPanelTitle = document.querySelector("#adminPanelTitle");
const loginForm = document.querySelector("#loginForm");
const loginError = document.querySelector("#loginError");
const adminUser = document.querySelector("#adminUser");
const adminPassword = document.querySelector("#adminPassword");
const adminForm = document.querySelector("#adminForm");
const logoutAdmin = document.querySelector("#logoutAdmin");
const clearMenu = document.querySelector("#clearMenu");
const cancelEdit = document.querySelector("#cancelEdit");
const saveFood = document.querySelector("#saveFood");
const imageFile = document.querySelector("#foodImageFile");
const imageUrl = document.querySelector("#foodImageUrl");
const nameInput = document.querySelector("#foodName");
const priceInput = document.querySelector("#foodPrice");
const categoryInput = document.querySelector("#foodCategory");
const descriptionInput = document.querySelector("#foodDescription");
const previewImage = document.querySelector("#previewImage");
const previewName = document.querySelector("#previewName");
const previewDescription = document.querySelector("#previewDescription");
const previewPrice = document.querySelector("#previewPrice");

let activeCategory = "Todos";
let currentImageData = "";
let editingItemId = null;
let isAdminLoggedIn = sessionStorage.getItem(AUTH_KEY) === "true";
let items = loadItems();

renderMenu();
renderAdminState();
updatePreview();

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    activeCategory = tab.dataset.category;
    tabs.forEach((button) => button.classList.toggle("is-active", button === tab));
    renderMenu();
  });
});

adminEntry.addEventListener("click", () => {
  renderAdminState();
  if (typeof adminModal.showModal === "function") {
    adminModal.showModal();
    (isAdminLoggedIn ? nameInput : adminUser).focus();
    return;
  }

  adminModal.setAttribute("open", "");
});

closeAdmin.addEventListener("click", () => adminModal.close());

adminModal.addEventListener("click", (event) => {
  if (event.target === adminModal) {
    adminModal.close();
  }
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const validUser = adminUser.value.trim() === ADMIN_USER;
  const validPassword = adminPassword.value === ADMIN_PASSWORD;

  if (!validUser || !validPassword) {
    loginError.hidden = false;
    adminPassword.select();
    return;
  }

  isAdminLoggedIn = true;
  sessionStorage.setItem(AUTH_KEY, "true");
  loginForm.reset();
  loginError.hidden = true;
  renderAdminState();
  renderMenu();
  nameInput.focus();
});

[nameInput, priceInput, descriptionInput, imageUrl].forEach((field) => {
  field.addEventListener("input", updatePreview);
});

imageFile.addEventListener("change", async () => {
  const file = imageFile.files?.[0];
  if (!file) {
    currentImageData = "";
    updatePreview();
    return;
  }

  currentImageData = await readFileAsDataUrl(file);
  updatePreview();
});

adminForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!isAdminLoggedIn) return;

  const editingItem = items.find((item) => item.id === editingItemId);
  const image = currentImageData || imageUrl.value.trim() || editingItem?.image || fallbackImage();
  const foodItem = {
    id: editingItemId || crypto.randomUUID(),
    name: nameInput.value.trim(),
    price: Number(priceInput.value),
    category: categoryInput.value,
    description: descriptionInput.value.trim(),
    image
  };

  if (editingItemId) {
    items = items.map((item) => item.id === editingItemId ? foodItem : item);
  } else {
    items = [foodItem, ...items];
  }

  saveItems();
  renderMenu();
  resetForm();
});

clearMenu.addEventListener("click", () => {
  if (!isAdminLoggedIn) return;

  const confirmed = confirm("Quieres borrar todos los productos agregados y volver al menu inicial?");
  if (!confirmed) return;

  items = [...starterItems];
  saveItems();
  renderMenu();
  resetForm();
});

cancelEdit.addEventListener("click", resetForm);

logoutAdmin.addEventListener("click", () => {
  isAdminLoggedIn = false;
  editingItemId = null;
  sessionStorage.removeItem(AUTH_KEY);
  resetForm();
  renderAdminState();
  renderMenu();
});

menuGrid.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton || !isAdminLoggedIn) return;

  const { action, id } = actionButton.dataset;

  if (action === "edit") {
    startEdit(id);
    return;
  }

  if (action === "delete") {
    deleteItem(id);
  }
});

function loadItems() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(stored) && stored.length) return stored;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }

  return [...starterItems];
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function renderMenu() {
  const visibleItems = activeCategory === "Todos"
    ? items
    : items.filter((item) => item.category === activeCategory);

  menuGrid.innerHTML = visibleItems.map((item) => `
    <article class="menu-card">
      <div class="image-wrap">
        <img src="${escapeAttribute(item.image)}" alt="${escapeAttribute(item.name)}" loading="lazy">
      </div>
      <div class="menu-card-content">
        <div>
          <h3>${escapeHtml(item.name)}</h3>
          <p>${escapeHtml(item.description)}</p>
        </div>
        <div class="card-footer">
          <span class="price">Bs ${formatPrice(item.price)}</span>
          <span class="pill">${escapeHtml(item.category)}</span>
        </div>
        ${isAdminLoggedIn ? `
          <div class="admin-card-actions" aria-label="Acciones de administrador">
            <button class="ghost-button small-button" type="button" data-action="edit" data-id="${escapeAttribute(item.id)}">Editar</button>
            <button class="danger-button small-button" type="button" data-action="delete" data-id="${escapeAttribute(item.id)}">Eliminar</button>
          </div>
        ` : ""}
      </div>
    </article>
  `).join("");

  itemCount.textContent = `${visibleItems.length} ${visibleItems.length === 1 ? "producto" : "productos"}`;
  emptyState.hidden = visibleItems.length > 0;
}

function updatePreview() {
  const editingItem = items.find((item) => item.id === editingItemId);
  const image = currentImageData || imageUrl.value.trim() || editingItem?.image || fallbackImage();
  previewImage.src = image;
  previewName.textContent = nameInput.value.trim() || "Vista previa";
  previewDescription.textContent = descriptionInput.value.trim() || "Completa los datos para ver como se vera en el menu.";
  previewPrice.textContent = `Bs ${formatPrice(Number(priceInput.value || 0))}`;
}

function resetForm() {
  adminForm.reset();
  currentImageData = "";
  editingItemId = null;
  adminPanelTitle.textContent = isAdminLoggedIn ? "Agregar comida" : "Iniciar sesion";
  saveFood.textContent = "Agregar producto";
  cancelEdit.hidden = true;
  updatePreview();
}

function renderAdminState() {
  loginForm.hidden = isAdminLoggedIn;
  adminForm.hidden = !isAdminLoggedIn;
  adminPanelTitle.textContent = isAdminLoggedIn
    ? (editingItemId ? "Editar comida" : "Agregar comida")
    : "Iniciar sesion";
}

function startEdit(id) {
  const item = items.find((food) => food.id === id);
  if (!item) return;

  editingItemId = id;
  nameInput.value = item.name;
  priceInput.value = item.price;
  categoryInput.value = item.category;
  descriptionInput.value = item.description;
  imageUrl.value = item.image.startsWith("data:") ? "" : item.image;
  currentImageData = item.image.startsWith("data:") ? item.image : "";
  adminPanelTitle.textContent = "Editar comida";
  saveFood.textContent = "Guardar cambios";
  cancelEdit.hidden = false;
  updatePreview();

  if (typeof adminModal.showModal === "function" && !adminModal.open) {
    adminModal.showModal();
  } else {
    adminModal.setAttribute("open", "");
  }

  nameInput.focus();
}

function deleteItem(id) {
  const item = items.find((food) => food.id === id);
  if (!item) return;

  const confirmed = confirm(`Quieres eliminar "${item.name}" del menu?`);
  if (!confirmed) return;

  items = items.filter((food) => food.id !== id);
  saveItems();
  if (editingItemId === id) resetForm();
  renderMenu();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", reject);
    reader.readAsDataURL(file);
  });
}

function fallbackImage() {
  return "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80";
}

function formatPrice(value) {
  return Number(value || 0).toFixed(2);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
