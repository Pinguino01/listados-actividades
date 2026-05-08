# app.js

```javascript
// ===============================
// FIREBASE IMPORTS
// ===============================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===============================
// FIREBASE CONFIG
// ===============================

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

// ===============================
// CONFIG
// ===============================

const CART_KEY = "burger-house-cart";
const AUTH_KEY = "burger-house-admin-auth";

const ADMIN_USER = "admin";
const ADMIN_PASSWORD = "admin123";

// ===============================
// DOM
// ===============================

const menuGrid = document.querySelector("#menuGrid");
const itemCount = document.querySelector("#itemCount");
const emptyState = document.querySelector("#emptyState");

const tabsContainer = document.querySelector("#tabsContainer");

const cartCount = document.querySelector("#cartCount");
const cartItems = document.querySelector("#cartItems");
const cartTotal = document.querySelector("#cartTotal");
const cartEmpty = document.querySelector("#cartEmpty");

const ordersList = document.querySelector("#ordersList");
const ordersEmpty = document.querySelector("#ordersEmpty");

const categoryInput = document.querySelector("#foodCategory");
const newCategoryInput = document.querySelector("#newCategoryInput");
const addCategoryButton = document.querySelector("#addCategoryButton");

const adminForm = document.querySelector("#adminForm");

const nameInput = document.querySelector("#foodName");
const priceInput = document.querySelector("#foodPrice");
const descriptionInput = document.querySelector("#foodDescription");
const imageUrl = document.querySelector("#foodImageUrl");

// ===============================
// STATE
// ===============================

let activeCategory = "Todos";

let items = [];
let orders = [];
let categories = [];

let cart = loadCart();

// ===============================
// FIREBASE LISTENERS
// ===============================

function listenProducts() {

  onSnapshot(collection(db, "products"), (snapshot) => {

    items = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data()
    }));

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

function listenCategories() {

  onSnapshot(collection(db, "categories"), (snapshot) => {

    categories = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data()
    }));

    renderCategories();

  });

}

// ===============================
// INIT
// ===============================

listenProducts();
listenOrders();
listenCategories();

renderCart();

// ===============================
// CATEGORIES
// ===============================

function renderCategories() {

  categoryInput.innerHTML = categories
    .map((category) => `
      <option value="${escapeAttribute(category.name)}">
        ${escapeHtml(category.name)}
      </option>
    `)
    .join("");

  renderCategoryTabs();

}

function renderCategoryTabs() {

  const allCategories = [
    "Todos",
    ...categories.map((category) => category.name)
  ];

  tabsContainer.innerHTML = allCategories
    .map((category) => `

      <button
        class="tab ${activeCategory === category ? "is-active" : ""}"
        data-category="${escapeAttribute(category)}"
      >
        ${escapeHtml(category)}
      </button>

    `)
    .join("");

  tabsContainer
    .querySelectorAll(".tab")
    .forEach((tab) => {

      tab.addEventListener("click", () => {

        activeCategory = tab.dataset.category;

        renderCategoryTabs();
        renderMenu();

      });

    });

}

addCategoryButton.addEventListener("click", async () => {

  const categoryName = newCategoryInput.value.trim();

  if (!categoryName) return;

  const exists = categories.some(
    (category) =>
      category.name.toLowerCase() ===
      categoryName.toLowerCase()
  );

  if (exists) {

    alert("La categoria ya existe");

    return;

  }

  try {

    await addDoc(collection(db, "categories"), {
      name: categoryName
    });

    newCategoryInput.value = "";

  } catch (error) {

    console.error(error);

    alert("Error agregando categoria");

  }

});

// ===============================
// SAVE PRODUCT
// ===============================

adminForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  const product = {
    name: nameInput.value.trim(),
    price: Number(priceInput.value),
    category: categoryInput.value,
    description: descriptionInput.value.trim(),
    image: imageUrl.value.trim()
  };

  try {

    await addDoc(collection(db, "products"), product);

    adminForm.reset();

  } catch (error) {

    console.error(error);

    alert("Error agregando producto");

  }

});

// ===============================
// MENU
// ===============================

function renderMenu() {

  const visibleItems = activeCategory === "Todos"
    ? items
    : items.filter(
        (item) => item.category === activeCategory
      );

  menuGrid.innerHTML = visibleItems
    .map((item) => `

      <article class="menu-card">

        <img
          src="${escapeAttribute(item.image)}"
          alt="${escapeAttribute(item.name)}"
        >

        <h3>
          ${escapeHtml(item.name)}
        </h3>

        <p>
          ${escapeHtml(item.description)}
        </p>

        <div class="card-footer">

          <span>
            $${formatPrice(item.price)}
          </span>

          <button
            data-add-cart="${item.id}"
          >
            Añadir
          </button>

        </div>

      </article>

    `)
    .join("");

  itemCount.textContent = `${visibleItems.length} productos`;

  emptyState.hidden = visibleItems.length > 0;

}

// ===============================
// ADD TO CART
// ===============================

menuGrid.addEventListener("click", (event) => {

  const button = event.target.closest("[data-add-cart]");

  if (!button) return;

  addToCart(button.dataset.addCart);

});

function addToCart(id) {

  const existing = cart.find((item) => item.id === id);

  if (existing) {

    existing.quantity += 1;

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

  cartItems.innerHTML = cartRows
    .map((item) => `

      <div class="cart-row">

        <strong>
          ${escapeHtml(item.name)}
        </strong>

        <span>
          ${item.quantity} x $${formatPrice(item.price)}
        </span>

      </div>

    `)
    .join("");

  cartEmpty.hidden = cartRows.length > 0;

  cartCount.textContent = cartRows.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const total = cartRows.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  cartTotal.textContent = `$${formatPrice(total)}`;

}

// ===============================
// SAVE ORDER
// ===============================

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
        quantity: entry.quantity
      };

    })
    .filter(Boolean);

  if (!orderItems.length) return;

  const total = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const order = {
    createdAt: new Date().toISOString(),
    items: orderItems,
    total,
    status: "Pendiente"
  };

  try {

    await addDoc(collection(db, "orders"), order);

    cart = [];

    saveCart();
    renderCart();

  } catch (error) {

    console.error(error);

    alert("Error guardando pedido");

  }

}

// ===============================
// ORDERS
// ===============================

function renderOrders() {

  ordersEmpty.hidden = orders.length > 0;

  ordersList.innerHTML = orders
    .map((order, index) => `

      <article class="order-card status-${order.status.toLowerCase()}">

        <div class="order-card-header">

          <div>

            <strong>
              Pedido #${orders.length - index}
            </strong>

            <span>
              ${formatOrderDate(order.createdAt)}
            </span>

          </div>

          <div>

            <b>
              $${formatPrice(order.total)}
            </b>

            <span class="order-status">
              ${escapeHtml(order.status)}
            </span>

          </div>

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

        <div class="order-actions">

          <button
            class="complete-order"
            data-complete-order="${order.id}"
          >
            Completar
          </button>

          <button
            class="cancel-order"
            data-cancel-order="${order.id}"
          >
            Cancelar
          </button>

        </div>

      </article>

    `)
    .join("");

}

ordersList.addEventListener("click", async (event) => {

  const completeButton =
    event.target.closest("[data-complete-order]");

  const cancelButton =
    event.target.closest("[data-cancel-order]");

  if (completeButton) {

    await completeOrder(
      completeButton.dataset.completeOrder
    );

    return;

  }

  if (cancelButton) {

    await cancelOrder(
      cancelButton.dataset.cancelOrder
    );

  }

});

async function completeOrder(id) {

  await updateDoc(doc(db, "orders", id), {
    status: "Completado"
  });

}

async function cancelOrder(id) {

  await updateDoc(doc(db, "orders", id), {
    status: "Cancelado"
  });

}

// ===============================
// STORAGE
// ===============================

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

// ===============================
// HELPERS
// ===============================

function formatPrice(value) {

  const number = Number(value || 0);

  return Number.isInteger(number)
    ? String(number)
    : number.toFixed(2);

}

function formatOrderDate(value) {

  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));

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
```

---

# index.html

```html
<script type="module" src="app.js"></script>
```

---

# HTML PANEL ADMIN

```html
<div class="category-manager">

  <input
    type="text"
    id="newCategoryInput"
    placeholder="Nueva categoria"
  >

  <button
    type="button"
    id="addCategoryButton"
  >
    Agregar categoria
  </button>

</div>
```

---

# HTML TABS

```html
<div id="tabsContainer"></div>
```

---

# CSS

```css
.category-manager {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.order-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.status-pendiente .order-status {
  background: #fff3cd;
  color: #856404;
}

.status-completado .order-status {
  background: #d1e7dd;
  color: #0f5132;
}

.status-cancelado .order-status {
  background: #f8d7da;
  color: #842029;
}

.order-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.complete-order {
  background: #198754;
  color: white;
  border: none;
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
}

.cancel-order {
  background: #dc3545;
  color: white;
  border: none;
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
}
```

---

# FIRESTORE RULES

```js
rules_version = '2';

service cloud.firestore {

  match /databases/{database}/documents {

    match /{document=**} {

      allow read, write: if true;

    }

  }

}
```

---

# FIREBASE COLLECTIONS

```txt
products
orders
categories
```

---

# CATEGORY DOCUMENT

```js
{
  name: "Hamburguesas"
}
```

---

# ORDER DOCUMENT

```js
{
  createdAt: "2026-05-08T20:00:00.000Z",
  total: 1000,
  status: "Pendiente",
  items: []
}
```

// =========================
// MODALES
// =========================

function openDialog(dialog) {

  if (!dialog) return;

  if (typeof dialog.showModal === "function") {

    dialog.showModal();

  } else {

    dialog.setAttribute("open", "");

  }

}

function closeDialog(dialog) {

  if (!dialog) return;

  dialog.close();

}

// =========================
// ADMIN
// =========================

adminEntry?.addEventListener("click", () => {

  openDialog(adminModal);

});

closeAdmin?.addEventListener("click", () => {

  closeDialog(adminModal);

});

adminModal?.addEventListener("click", (event) => {

  if (event.target === adminModal) {

    closeDialog(adminModal);

  }

});

// =========================
// CARRITO
// =========================

cartEntry?.addEventListener("click", () => {

  renderCart();

  openDialog(cartModal);

});

closeCart?.addEventListener("click", () => {

  closeDialog(cartModal);

});

cartModal?.addEventListener("click", (event) => {

  if (event.target === cartModal) {

    closeDialog(cartModal);

  }

});

// =========================
// PRODUCTO
// =========================

closeProduct?.addEventListener("click", () => {

  closeDialog(productModal);

});

productModal?.addEventListener("click", (event) => {

  if (event.target === productModal) {

    closeDialog(productModal);

  }

});

// =========================
// QR
// =========================

closeQr?.addEventListener("click", () => {

  closeDialog(qrModal);

});

qrModal?.addEventListener("click", (event) => {

  if (event.target === qrModal) {

    closeDialog(qrModal);

  }

});

// =========================
// LOGIN ADMIN
// =========================

loginForm?.addEventListener("submit", (event) => {

  event.preventDefault();

  const username = adminUser.value.trim();

  const password = adminPassword.value.trim();

  if (
    username === "admin" &&
    password === "admin123"
  ) {

    loginError.hidden = true;

    loginForm.hidden = true;

    adminContent.hidden = false;

  } else {

    loginError.hidden = false;

  }

});

// =========================
// LOGOUT
// =========================

logoutAdmin?.addEventListener("click", () => {

  adminContent.hidden = true;

  loginForm.hidden = false;

  loginForm.reset();

});

// =========================
// BOTON AÑADIR CARRITO
// =========================

detailAddCart?.addEventListener("click", () => {

  if (!selectedProductId) return;

  addToCart(selectedProductId);

  closeDialog(productModal);

});

// =========================
// CONFIRMAR PEDIDO
// =========================

confirmOrder?.addEventListener("click", async () => {

  if (!cart.length) {

    cartWarning.hidden = false;

    return;

  }

  cartWarning.hidden = true;

  await saveConfirmedOrder();

  paymentQr.src =
    "https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=" +
    encodeURIComponent(PAYMENT_LINK);

  paymentLink.href = PAYMENT_LINK;

  openDialog(qrModal);

});
