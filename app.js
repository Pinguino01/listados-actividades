import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================================
   FIREBASE
========================================= */

const firebaseConfig = {
  apiKey: "AIzaSyCAHJvADlZAXkB5OTywm_Hn9t1sGo9acn0",
  authDomain: "menu-interactivo-913fa.firebaseapp.com",
  databaseURL: "https://menu-interactivo-913fa-default-rtdb.firebaseio.com",
  projectId: "menu-interactivo-913fa",
  storageBucket: "menu-interactivo-913fa.firebasestorage.app",
  messagingSenderId: "173342971594",
  appId: "1:173342971594:web:dd275dbb131e3f5d98c633",
  measurementId: "G-M3D9CT1VTR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* =========================================
   CONFIG
========================================= */

const CART_KEY = "burger-house-cart";
const AUTH_KEY = "burger-house-admin-auth";

const ADMIN_USER = "admin";
const ADMIN_PASSWORD = "admin123";

const PAYMENT_LINK =
  "https://apps.apple.com/do/app/coopesa-personal/id6760831661";

/* =========================================
   DOM
========================================= */

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

const adminContent = document.querySelector("#adminContent");

const showProductsAdmin =
  document.querySelector("#showProductsAdmin");

const showOrdersAdmin =
  document.querySelector("#showOrdersAdmin");

const productsAdminView =
  document.querySelector("#productsAdminView");

const ordersAdminView =
  document.querySelector("#ordersAdminView");

const ordersList = document.querySelector("#ordersList");
const ordersEmpty = document.querySelector("#ordersEmpty");

const adminForm = document.querySelector("#adminForm");

const logoutAdmin = document.querySelector("#logoutAdmin");

const clearMenu = document.querySelector("#clearMenu");

const cancelEdit = document.querySelector("#cancelEdit");

const saveFood = document.querySelector("#saveFood");

const imageFile =
  document.querySelector("#foodImageFile");

const imageUrl =
  document.querySelector("#foodImageUrl");

const nameInput =
  document.querySelector("#foodName");

const priceInput =
  document.querySelector("#foodPrice");

const categoryInput =
  document.querySelector("#foodCategory");

const descriptionInput =
  document.querySelector("#foodDescription");

const previewImage =
  document.querySelector("#previewImage");

const previewName =
  document.querySelector("#previewName");

const previewDescription =
  document.querySelector("#previewDescription");

const previewPrice =
  document.querySelector("#previewPrice");

/* =========================================
   SCREENSAVER
========================================= */

const screensaver =
  document.querySelector("#screensaver");

const screensaverImage =
  document.querySelector("#screensaverImage");

const screensaverName =
  document.querySelector("#screensaverName");

const screensaverDescription =
  document.querySelector("#screensaverDescription");

const screensaverPrice =
  document.querySelector("#screensaverPrice");

/* =========================================
   STATE
========================================= */

let activeCategory = "Todos";

let currentImageData = "";

let editingItemId = null;

let selectedProductId = null;

let isAdminLoggedIn =
  sessionStorage.getItem(AUTH_KEY) === "true";

let items = [];

let orders = [];

let cart = loadCart();

/* =========================================
   FIREBASE LISTENERS
========================================= */

function listenProducts() {
  onSnapshot(collection(db, "products"), (snapshot) => {

    items = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data()
    }));

    cleanInvalidCartItems();

    renderMenu();

    renderCart();

  });
}

function listenOrders() {
  onSnapshot(collection(db, "orders"), (snapshot) => {

    orders = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data()
    }));

    renderOrders();

  });
}

/* =========================================
   INIT
========================================= */

listenProducts();

listenOrders();

renderCart();

renderAdminState();

updatePreview();

/* =========================================
   CATEGORY TABS
========================================= */

tabs.forEach((tab) => {

  tab.addEventListener("click", () => {

    activeCategory = tab.dataset.category;

    tabs.forEach((button) => {

      button.classList.toggle(
        "is-active",
        button === tab
      );

    });

    renderMenu();

  });

});

/* =========================================
   MODAL HELPERS
========================================= */

function openDialog(dialog) {

  if (typeof dialog.showModal === "function") {

    dialog.showModal();

    return;

  }

  dialog.setAttribute("open", "");

}

function closeDialog(dialog) {

  if (typeof dialog.close === "function") {

    dialog.close();

    return;

  }

  dialog.removeAttribute("open");

}

/* =========================================
   ADMIN MODAL
========================================= */

adminEntry.addEventListener("click", () => {

  renderAdminState();

  openDialog(adminModal);

  (isAdminLoggedIn ? nameInput : adminUser).focus();

});

closeAdmin.addEventListener("click", () => {

  closeDialog(adminModal);

});

adminModal.addEventListener("click", (event) => {

  if (event.target === adminModal) {

    closeDialog(adminModal);

  }

});

/* =========================================
   CART MODAL
========================================= */

cartEntry.addEventListener("click", () => {

  renderCart();

  openDialog(cartModal);

});

closeCart.addEventListener("click", () => {

  closeDialog(cartModal);

});

cartModal.addEventListener("click", (event) => {

  if (event.target === cartModal) {

    closeDialog(cartModal);

  }

});

/* =========================================
   CART ACTIONS
========================================= */

cartItems.addEventListener("click", (event) => {

  const button =
    event.target.closest("[data-cart-action]");

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

/* =========================================
   CONFIRM ORDER
========================================= */

confirmOrder.addEventListener("click", async () => {

  if (cart.length === 0) {

    cartWarning.hidden = false;

    return;

  }

  cartWarning.hidden = true;

  await saveConfirmedOrder();

  paymentQr.src =
    `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(PAYMENT_LINK)}`;

  paymentLink.href = PAYMENT_LINK;

  openDialog(qrModal);

});

/* =========================================
   QR MODAL
========================================= */

closeQr.addEventListener("click", () => {

  closeDialog(qrModal);

});

qrModal.addEventListener("click", (event) => {

  if (event.target === qrModal) {

    closeDialog(qrModal);

  }

});

/* =========================================
   PRODUCT MODAL
========================================= */

closeProduct.addEventListener("click", () => {

  closeDialog(productModal);

});

productModal.addEventListener("click", (event) => {

  if (event.target === productModal) {

    closeDialog(productModal);

  }

});

detailAddCart.addEventListener("click", () => {

  if (!selectedProductId) return;

  addToCart(selectedProductId);

  closeDialog(productModal);

});

/* =========================================
   LOGIN
========================================= */

loginForm.addEventListener("submit", (event) => {

  event.preventDefault();

  const validUser =
    adminUser.value.trim() === ADMIN_USER;

  const validPassword =
    adminPassword.value === ADMIN_PASSWORD;

  if (!validUser || !validPassword) {

    loginError.hidden = false;

    adminPassword.select();

    return;

  }

  isAdminLoggedIn = true;

  sessionStorage.setItem(AUTH_KEY, "true");

  loginError.hidden = true;

  loginForm.reset();

  renderAdminState();

  renderMenu();

  nameInput.focus();

});

/* =========================================
   ADMIN TABS
========================================= */

showProductsAdmin.addEventListener("click", () => {

  setAdminView("products");

});

showOrdersAdmin.addEventListener("click", () => {

  setAdminView("orders");

});

/* =========================================
   PREVIEW
========================================= */

[
  nameInput,
  priceInput,
  descriptionInput,
  imageUrl
].forEach((field) => {

  field.addEventListener("input", updatePreview);

});

categoryInput.addEventListener("change", () => {

  if (categoryInput.value === "Hamburguesas") {

    priceInput.value = 250;

  }

  updatePreview();

});

/* =========================================
   IMAGE UPLOAD
========================================= */

imageFile.addEventListener("change", async () => {

  const file = imageFile.files?.[0];

  if (!file) {

    currentImageData = "";

    updatePreview();

    return;

  }

  currentImageData =
    await readFileAsDataUrl(file);

  updatePreview();

});

/* =========================================
   SAVE PRODUCT
========================================= */

adminForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    if (!isAdminLoggedIn) return;

    const editingItem = items.find(
      (item) => item.id === editingItemId
    );

    const image =
      currentImageData ||
      imageUrl.value.trim() ||
      editingItem?.image ||
      fallbackImage();

    const foodItem = normalizeItemPrice({
      name: nameInput.value.trim(),
      price: Number(priceInput.value),
      category: categoryInput.value,
      description: descriptionInput.value.trim(),
      image
    });

    try {

      if (editingItemId) {

        await updateDoc(
          doc(db, "products", editingItemId),
          foodItem
        );

      } else {

        await addDoc(
          collection(db, "products"),
          foodItem
        );

      }

      resetForm();

    } catch (error) {

      console.error(error);

      alert("Error guardando producto");

    }

  }
);

/* =========================================
   CLEAR MENU
========================================= */

clearMenu.addEventListener(
  "click",
  async () => {

    if (!isAdminLoggedIn) return;

    const confirmed = confirm(
      "Quieres borrar todos los productos?"
    );

    if (!confirmed) return;

    try {

      const snapshot = await getDocs(
        collection(db, "products")
      );

      const deletions = snapshot.docs.map(
        (product) =>
          deleteDoc(
            doc(db, "products", product.id)
          )
      );

      await Promise.all(deletions);

      resetForm();

    } catch (error) {

      console.error(error);

      alert("Error borrando productos");

    }

  }
);

/* =========================================
   CANCEL EDIT
========================================= */

cancelEdit.addEventListener(
  "click",
  resetForm
);

/* =========================================
   LOGOUT
========================================= */

logoutAdmin.addEventListener("click", () => {

  isAdminLoggedIn = false;

  editingItemId = null;

  sessionStorage.removeItem(AUTH_KEY);

  resetForm();

  renderAdminState();

  renderMenu();

});

/* =========================================
   MENU ACTIONS
========================================= */

menuGrid.addEventListener("click", (event) => {

  const actionButton =
    event.target.closest("[data-action]");

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

/* =========================================
   HELPERS
========================================= */

function normalizeItemPrice(item) {

  return item.category === "Hamburguesas"
    ? { ...item, price: 250 }
    : item;

}

function loadCart() {

  try {

    const stored = JSON.parse(
      localStorage.getItem(CART_KEY)
    );

    if (Array.isArray(stored)) {

      return stored;

    }

  } catch {

    localStorage.removeItem(CART_KEY);

  }

  return [];

}

function saveCart() {

  localStorage.setItem(
    CART_KEY,
    JSON.stringify(cart)
  );

}

function cleanInvalidCartItems() {

  cart = cart.filter((entry) =>
    items.some((item) => item.id === entry.id)
  );

  saveCart();

}

/* =========================================
   RENDER MENU
========================================= */

function renderMenu() {

  const visibleItems =
    activeCategory === "Todos"
      ? items
      : items.filter(
          (item) =>
            item.category === activeCategory
        );

  menuGrid.innerHTML = visibleItems
    .map(
      (item) => `
      <article class="menu-card">

        <div class="image-wrap">

          <img
            src="${escapeAttribute(item.image)}"
            alt="${escapeAttribute(item.name)}"
            loading="lazy"
          >

        </div>

        <div class="menu-card-content">

          <div>

            <h3>
              ${escapeHtml(item.name)}
            </h3>

            <p>
              ${escapeHtml(item.description)}
            </p>

          </div>

          <div class="card-footer">

            <span class="price">
              $${formatPrice(item.price)}
            </span>

            <span class="pill">
              ${escapeHtml(item.category)}
            </span>

          </div>

          <div class="customer-card-actions">

            <button
              class="ghost-button small-button"
              type="button"
              data-action="view"
              data-id="${escapeAttribute(item.id)}"
            >
              Ver producto
            </button>

            <button
              class="primary-button small-button"
              type="button"
              data-action="cart"
              data-id="${escapeAttribute(item.id)}"
            >
              Añadir al carrito
            </button>

          </div>

          ${
            isAdminLoggedIn
              ? `
            <div class="admin-card-actions">

              <button
                class="ghost-button small-button"
                type="button"
                data-action="edit"
                data-id="${escapeAttribute(item.id)}"
              >
                Editar
              </button>

              <button
                class="danger-button small-button"
                type="button"
                data-action="delete"
                data-id="${escapeAttribute(item.id)}"
              >
                Eliminar
              </button>

            </div>
          `
              : ""
          }

        </div>

      </article>
    `
    )
    .join("");

  itemCount.textContent =
    `${visibleItems.length} ${
      visibleItems.length === 1
        ? "producto"
        : "productos"
    }`;

  emptyState.hidden =
    visibleItems.length > 0;

}

/* =========================================
   PREVIEW
========================================= */

function updatePreview() {

  const editingItem = items.find(
    (item) => item.id === editingItemId
  );

  const image =
    currentImageData ||
    imageUrl.value.trim() ||
    editingItem?.image ||
    fallbackImage();

  previewImage.src = image;

  previewName.textContent =
    nameInput.value.trim() ||
    "Vista previa";

  previewDescription.textContent =
    descriptionInput.value.trim() ||
    "Completa los datos para ver como se vera en el menu.";

  previewPrice.textContent =
    `$${formatPrice(
      Number(priceInput.value || 0)
    )}`;

}

/* =========================================
   RESET FORM
========================================= */

function resetForm() {

  adminForm.reset();

  currentImageData = "";

  editingItemId = null;

  priceInput.value = 250;

  adminPanelTitle.textContent =
    isAdminLoggedIn
      ? "Agregar comida"
      : "Iniciar sesion";

  saveFood.textContent =
    "Agregar producto";

  cancelEdit.hidden = true;

  updatePreview();

}

/* =========================================
   ADMIN STATE
========================================= */

function renderAdminState() {

  loginForm.style.display =
    isAdminLoggedIn ? "none" : "grid";

  adminContent.style.display =
    isAdminLoggedIn ? "grid" : "none";

  adminPanelTitle.textContent =
    isAdminLoggedIn
      ? editingItemId
        ? "Editar comida"
        : "Agregar comida"
      : "Iniciar sesion";

  if (isAdminLoggedIn) {

    setAdminView("products");

  }

}

function setAdminView(view) {

  const showingOrders = view === "orders";

  showProductsAdmin.classList.toggle(
    "is-active",
    !showingOrders
  );

  showOrdersAdmin.classList.toggle(
    "is-active",
    showingOrders
  );

  productsAdminView.classList.toggle(
    "is-active",
    !showingOrders
  );

  ordersAdminView.classList.toggle(
    "is-active",
    showingOrders
  );

  adminPanelTitle.textContent =
    showingOrders
      ? "Pedidos confirmados"
      : editingItemId
      ? "Editar comida"
      : "Agregar comida";

}

/* =========================================
   EDIT PRODUCT
========================================= */

function startEdit(id) {

  const item = items.find(
    (food) => food.id === id
  );

  if (!item) return;

  setAdminView("products");

  editingItemId = id;

  nameInput.value = item.name;

  priceInput.value = item.price;

  categoryInput.value = item.category;

  descriptionInput.value =
    item.description;

  imageUrl.value =
    item.image.startsWith("data:")
      ? ""
      : item.image;

  currentImageData =
    item.image.startsWith("data:")
      ? item.image
      : "";

  adminPanelTitle.textContent =
    "Editar comida";

  saveFood.textContent =
    "Guardar cambios";

  cancelEdit.hidden = false;

  updatePreview();

  openDialog(adminModal);

  nameInput.focus();

}

/* =========================================
   DELETE PRODUCT
========================================= */

async function deleteItem(id) {

  const item = items.find(
    (food) => food.id === id
  );

  if (!item) return;

  const confirmed = confirm(
    `Quieres eliminar "${item.name}" del menu?`
  );

  if (!confirmed) return;

  try {

    await deleteDoc(
      doc(db, "products", id)
    );

    if (editingItemId === id) {

      resetForm();

    }

  } catch (error) {

    console.error(error);

    alert("Error eliminando producto");

  }

}

/* =========================================
   PRODUCT DETAIL
========================================= */

function showProduct(id) {

  const item = items.find(
    (food) => food.id === id
  );

  if (!item) return;

  selectedProductId = id;

  detailImage.src = item.image;

  detailImage.alt = item.name;

  detailCategory.textContent =
    item.category;

  detailName.textContent =
    item.name;

  detailDescription.textContent =
    item.description;

  detailPrice.textContent =
    `$${formatPrice(item.price)}`;

  openDialog(productModal);

}

/* =========================================
   CART
========================================= */

function addToCart(id) {

  const item = items.find(
    (food) => food.id === id
  );

  if (!item) return;

  const cartItem = cart.find(
    (entry) => entry.id === id
  );

  if (cartItem) {

    cartItem.quantity += 1;

  } else {

    cart.push({
      id,
      quantity: 1
    });

  }

  saveCart();

  renderCart();

}

function renderCart() {

  const totalQuantity = cart.reduce(
    (sum, entry) => sum + entry.quantity,
    0
  );

  const cartRows = cart
    .map((entry) => {

      const item = items.find(
        (food) => food.id === entry.id
      );

      if (!item) return null;

      return {
        ...item,
        quantity: entry.quantity
      };

    })
    .filter(Boolean);

  cartCount.textContent =
    totalQuantity;

  cartEmpty.hidden =
    cartRows.length > 0;

  cartItems.hidden =
    cartRows.length === 0;

  cartWarning.hidden = true;

  cartItems.innerHTML = cartRows
    .map(
      (item) => `
      <article class="cart-row">

        <img
          src="${escapeAttribute(item.image)}"
          alt="${escapeAttribute(item.name)}"
        >

        <div class="cart-row-info">

          <strong>
            ${escapeHtml(item.name)}
          </strong>

          <span>
            $${formatPrice(item.price)} c/u
          </span>

          <div class="quantity-control">

            <button
              type="button"
              data-cart-action="decrease"
              data-id="${escapeAttribute(item.id)}"
            >
              -
            </button>

            <output>
              ${item.quantity}
            </output>

            <button
              type="button"
              data-cart-action="increase"
              data-id="${escapeAttribute(item.id)}"
            >
              +
            </button>

          </div>

        </div>

        <div class="cart-row-total">

          <b>
            $${formatPrice(
              item.price * item.quantity
            )}
          </b>

          <button
            class="remove-cart-item"
            type="button"
            data-cart-action="remove"
            data-id="${escapeAttribute(item.id)}"
          >
            Eliminar
          </button>

        </div>

      </article>
    `
    )
    .join("");

  const total = cartRows.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0
  );

  cartTotal.textContent =
    `$${formatPrice(total)}`;

}

/* =========================================
   CART HELPERS
========================================= */

function changeCartQuantity(id, amount) {

  const cartItem = cart.find(
    (entry) => entry.id === id
  );

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

  cart = cart.filter(
    (entry) => entry.id !== id
  );

  saveCart();

  renderCart();

}

/* =========================================
   SAVE ORDER
========================================= */

async function saveConfirmedOrder() {

  const orderItems = cart
    .map((entry) => {

      const item = items.find(
        (food) => food.id === entry.id
      );

      if (!item) return null;

      return {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: entry.quantity,
        image: item.image
      };

    })
    .filter(Boolean);

  if (!orderItems.length) return;

  const total = orderItems.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0
  );

  const order = {
    createdAt: new Date().toISOString(),
    items: orderItems,
    total
  };

  try {

    await addDoc(
      collection(db, "orders"),
      order
    );

    cart = [];

    saveCart();

    renderCart();

  } catch (error) {

    console.error(error);

    alert("Error guardando pedido");

  }

}

/* =========================================
   RENDER ORDERS
========================================= */

function renderOrders() {

  if (!ordersList || !ordersEmpty) return;

  ordersEmpty.hidden =
    orders.length > 0;

  ordersList.hidden =
    orders.length === 0;

  ordersList.innerHTML = orders
    .map(
      (order, index) => `
      <article class="order-card">

        <div class="order-card-header">

          <div>

            <strong>
              Pedido #${orders.length - index}
            </strong>

            <span>
              ${formatOrderDate(order.createdAt)}
            </span>

          </div>

          <b>
            $${formatPrice(order.total)}
          </b>

        </div>

        <div class="order-items">

          ${order.items
            .map(
              (item) => `
              <div class="order-item">

                <span>
                  ${escapeHtml(item.name)}
                </span>

                <small>
                  ${item.quantity} x $${formatPrice(item.price)}
                </small>

              </div>
            `
            )
            .join("")}

        </div>

      </article>
    `
    )
    .join("");

}

/* =========================================
   UTILITIES
========================================= */

function formatOrderDate(value) {

  return new Intl.DateTimeFormat(
    "es",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  ).format(new Date(value));

}

function readFileAsDataUrl(file) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.addEventListener("load", () => {

      resolve(reader.result);

    });

    reader.addEventListener(
      "error",
      reject
    );

    reader.readAsDataURL(file);

  });

}

function fallbackImage() {

  return "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80";

}

function formatPrice(value) {

  const number = Number(value || 0);

  return Number.isInteger(number)
    ? String(number)
    : number.toFixed(2);

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

  return escapeHtml(value)
    .replaceAll("`", "&#096;");

}

/* =========================================
   SCREENSAVER
========================================= */

let screensaverTimer = null;

let screensaverInterval = null;

let currentScreensaverIndex = 0;

function showScreensaverProduct() {

  if (!items.length) return;

  const item =
    items[
      currentScreensaverIndex %
        items.length
    ];

  screensaverImage.src = item.image;

  screensaverName.textContent =
    item.name;

  screensaverDescription.textContent =
    item.description;

  screensaverPrice.textContent =
    `$${formatPrice(item.price)}`;

}

function startScreensaver() {

  if (!items.length) return;

  showScreensaverProduct();

  screensaver.classList.add("active");

  clearInterval(screensaverInterval);

  screensaverInterval = setInterval(() => {

    currentScreensaverIndex++;

    showScreensaverProduct();

  }, 5000);

}

function stopScreensaver() {

  screensaver.classList.remove("active");

  clearInterval(screensaverInterval);

  resetScreensaverTimer();

}

function resetScreensaverTimer() {

  clearTimeout(screensaverTimer);

  screensaverTimer = setTimeout(() => {

    startScreensaver();

  }, 60000);

}

[
  "click",
  "touchstart",
  "mousemove",
  "keydown",
  "scroll"
].forEach((eventName) => {

  document.addEventListener(
    eventName,
    () => {

      if (
        screensaver.classList.contains(
          "active"
        )
      ) {

        stopScreensaver();

        return;

      }

      resetScreensaverTimer();

    }
  );

});

window.addEventListener("load", () => {

  resetScreensaverTimer();

});
