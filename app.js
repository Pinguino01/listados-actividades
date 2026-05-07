const STORAGE_KEY = "burger-house-menu";
const CART_KEY = "burger-house-cart";
const AUTH_KEY = "burger-house-admin-auth";
const ADMIN_USER = "admin";
const ADMIN_PASSWORD = "admin123";
const PAYMENT_LINK = "https://apps.apple.com/do/app/coopesa-personal/id6760831661";

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
const cartEntry = document.querySelector("#cartEntry");
const cartCount = document.querySelector("#cartCount");
const cartModal = document.querySelector("#cartModal");
const closeCart = document.querySelector("#closeCart");
const cartItems = document.querySelector("#cartItems");
const cartEmpty = document.querySelector("#cartEmpty");
const cartWarning = document.querySelector("#cartWarning");
const cartTotal = document.querySelector("#cartTotal");
const clearCart = document.querySelector("#clearCart");
const confirmOrder = document.querySelector("#confirmOrder");
const qrModal = document.querySelector("#qrModal");
const closeQr = document.querySelector("#closeQr");
const paymentQr = document.querySelector("#paymentQr");
const paymentLink = document.querySelector("#paymentLink");
const productModal = document.querySelector("#productModal");
const closeProduct = document.querySelector("#closeProduct");
const detailImage = document.querySelector("#detailImage");
const detailCategory = document.querySelector("#detailCategory");
const detailName = document.querySelector("#detailName");
const detailDescription = document.querySelector("#detailDescription");
const detailPrice = document.querySelector("#detailPrice");
const detailAddCart = document.querySelector("#detailAddCart");
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
let selectedProductId = null;
let isAdminLoggedIn = sessionStorage.getItem(AUTH_KEY) === "true";
let items = loadItems();
let cart = loadCart();

renderMenu();
renderCart();
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

cartEntry.addEventListener("click", () => {
  renderCart();
  openDialog(cartModal);
});

closeCart.addEventListener("click", () => cartModal.close());

cartModal.addEventListener("click", (event) => {
  if (event.target === cartModal) {
    cartModal.close();
  }
});

cartItems.addEventListener("click", (event) => {
  const button = event.target.closest("[data-cart-action]");
  if (!button) return;

  const { cartAction, id } = button.dataset;

  if (cartAction === "increase") {
    changeCartQuantity(id, 1);
    return;
  }

  if (cartAction === "decrease") {
    changeCartQuantity(id, -1);
    return;
  }

  if (cartAction === "remove") {
    removeFromCart(id);
  }
});

clearCart.addEventListener("click", () => {
  cart = [];
  saveCart();
  renderCart();
});

confirmOrder.addEventListener("click", () => {
  if (cart.length === 0) {
    cartWarning.hidden = false;
    return;
  }

  cartWarning.hidden = true;
  paymentQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(PAYMENT_LINK)}`;
  paymentLink.href = PAYMENT_LINK;
  openDialog(qrModal);
});

closeQr.addEventListener("click", () => qrModal.close());

qrModal.addEventListener("click", (event) => {
  if (event.target === qrModal) {
    qrModal.close();
  }
});

closeProduct.addEventListener("click", () => productModal.close());

productModal.addEventListener("click", (event) => {
  if (event.target === productModal) {
    productModal.close();
  }
});

detailAddCart.addEventListener("click", () => {
  if (!selectedProductId) return;
  addToCart(selectedProductId);
  productModal.close();
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
  if (!actionButton) return;

  const { action, id } = actionButton.dataset;

  if (action === "view") {
    showProduct(id);
    return;
  }

  if (action === "cart") {
    addToCart(id);
    return;
  }

  if (!isAdminLoggedIn) return;

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

function loadCart() {
  try {
    const stored = JSON.parse(localStorage.getItem(CART_KEY));
    if (Array.isArray(stored)) return stored;
  } catch {
    localStorage.removeItem(CART_KEY);
  }

  return [];
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
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
        <div class="customer-card-actions" aria-label="Acciones del producto">
          <button class="ghost-button small-button" type="button" data-action="view" data-id="${escapeAttribute(item.id)}">Ver producto</button>
          <button class="primary-button small-button" type="button" data-action="cart" data-id="${escapeAttribute(item.id)}">Añadir al carrito</button>
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

function showProduct(id) {
  const item = items.find((food) => food.id === id);
  if (!item) return;

  selectedProductId = id;
  detailImage.src = item.image;
  detailImage.alt = item.name;
  detailCategory.textContent = item.category;
  detailName.textContent = item.name;
  detailDescription.textContent = item.description;
  detailPrice.textContent = `Bs ${formatPrice(item.price)}`;
  openDialog(productModal);
}

function addToCart(id) {
  const item = items.find((food) => food.id === id);
  if (!item) return;

  const cartItem = cart.find((entry) => entry.id === id);
  if (cartItem) {
    cartItem.quantity += 1;
  } else {
    cart.push({ id, quantity: 1 });
  }

  saveCart();
  renderCart();
}

function renderCart() {
  const totalQuantity = cart.reduce((sum, entry) => sum + entry.quantity, 0);
  const cartRows = cart
    .map((entry) => {
      const item = items.find((food) => food.id === entry.id);
      if (!item) return null;
      return { ...item, quantity: entry.quantity };
    })
    .filter(Boolean);

  cartCount.textContent = totalQuantity;
  cartEmpty.hidden = cartRows.length > 0;
  cartItems.hidden = cartRows.length === 0;
  cartWarning.hidden = true;

  cartItems.innerHTML = cartRows.map((item) => `
    <article class="cart-row">
      <img src="${escapeAttribute(item.image)}" alt="${escapeAttribute(item.name)}">
      <div class="cart-row-info">
        <strong>${escapeHtml(item.name)}</strong>
        <span>Bs ${formatPrice(item.price)} c/u</span>
        <div class="quantity-control" aria-label="Cantidad de ${escapeAttribute(item.name)}">
          <button type="button" data-cart-action="decrease" data-id="${escapeAttribute(item.id)}" aria-label="Restar ${escapeAttribute(item.name)}">-</button>
          <output>${item.quantity}</output>
          <button type="button" data-cart-action="increase" data-id="${escapeAttribute(item.id)}" aria-label="Sumar ${escapeAttribute(item.name)}">+</button>
        </div>
      </div>
      <div class="cart-row-total">
        <b>Bs ${formatPrice(item.price * item.quantity)}</b>
        <button class="remove-cart-item" type="button" data-cart-action="remove" data-id="${escapeAttribute(item.id)}">Eliminar</button>
      </div>
    </article>
  `).join("");

  const total = cartRows.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  cartTotal.textContent = `Bs ${formatPrice(total)}`;
}

function changeCartQuantity(id, amount) {
  const cartItem = cart.find((entry) => entry.id === id);
  if (!cartItem) return;

  cartItem.quantity += amount;
  if (cartItem.quantity <= 0) {
    removeFromCart(id);
    return;
  }

  saveCart();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter((entry) => entry.id !== id);
  saveCart();
  renderCart();
}

function openDialog(dialog) {
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
    return;
  }

  dialog.setAttribute("open", "");
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
