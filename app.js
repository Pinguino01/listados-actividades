// ===============================
// FIREBASE IMPORTS
// ===============================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===============================
// FIREBASE CONFIG
// ===============================

const firebaseConfig = {
  apiKey: "AIzaSyCAHJvADlZAXkB5OTywm_Hn9t1sGo9acn0",
  authDomain: "menu-interactivo-913fa.firebaseapp.com",
  projectId: "menu-interactivo-913fa",
  storageBucket: "menu-interactivo-913fa.appspot.com",
  messagingSenderId: "173342971594",
  appId: "1:173342971594:web:dd275dbb131e3f5d98c633"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===============================
// CONFIG
// ===============================

const CART_KEY = "burger-house-cart";

const ADMIN_USER = "admin";
const ADMIN_PASSWORD = "admin123";

const PAYMENT_LINK =
  "https://apps.apple.com/do/app/coopesa-personal/id6760831661";

// ===============================
// DOM
// ===============================

const menuGrid = document.querySelector("#menuGrid");
const itemCount = document.querySelector("#itemCount");
const emptyState = document.querySelector("#emptyState");

const tabsContainer = document.querySelector("#tabsContainer");

const cartEntry = document.querySelector("#cartEntry");
const cartModal = document.querySelector("#cartModal");
const closeCart = document.querySelector("#closeCart");

const cartCount = document.querySelector("#cartCount");
const cartItems = document.querySelector("#cartItems");
const cartTotal = document.querySelector("#cartTotal");
const cartEmpty = document.querySelector("#cartEmpty");
const cartWarning = document.querySelector("#cartWarning");

const confirmOrder = document.querySelector("#confirmOrder");

const qrModal = document.querySelector("#qrModal");
const closeQr = document.querySelector("#closeQr");
const paymentQr = document.querySelector("#paymentQr");
const paymentLink = document.querySelector("#paymentLink");

const adminEntry = document.querySelector("#adminEntry");
const adminModal = document.querySelector("#adminModal");
const closeAdmin = document.querySelector("#closeAdmin");

const loginForm = document.querySelector("#loginForm");
const loginError = document.querySelector("#loginError");
const adminUser = document.querySelector("#adminUser");
const adminPassword = document.querySelector("#adminPassword");
const adminContent = document.querySelector("#adminContent");

const logoutAdmin = document.querySelector("#logoutAdmin");

const adminForm = document.querySelector("#adminForm");

const nameInput = document.querySelector("#foodName");
const priceInput = document.querySelector("#foodPrice");
const descriptionInput = document.querySelector("#foodDescription");
const imageUrl = document.querySelector("#foodImageUrl");

const categoryInput = document.querySelector("#foodCategory");

const newCategoryInput = document.querySelector("#newCategoryInput");
const addCategoryButton = document.querySelector("#addCategoryButton");

const ordersList = document.querySelector("#ordersList");
const ordersEmpty = document.querySelector("#ordersEmpty");

const productModal = document.querySelector("#productModal");
const closeProduct = document.querySelector("#closeProduct");

const detailImage = document.querySelector("#detailImage");
const detailCategory = document.querySelector("#detailCategory");
const detailName = document.querySelector("#detailName");
const detailDescription = document.querySelector("#detailDescription");
const detailPrice = document.querySelector("#detailPrice");
const detailAddCart = document.querySelector("#detailAddCart");

// ===============================
// STATE
// ===============================

let activeCategory = "Todos";

let items = [];
let orders = [];
let categories = [];

let selectedProductId = null;

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

addCategoryButton?.addEventListener("click", async () => {

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

  await addDoc(collection(db, "categories"), {
    name: categoryName
  });

  newCategoryInput.value = "";

});

// ===============================
// SAVE PRODUCT
// ===============================

adminForm?.addEventListener("submit", async (event) => {

  event.preventDefault();

  const product = {
    name: nameInput.value.trim(),
    price: Number(priceInput.value),
    category: categoryInput.value,
    description: descriptionInput.value.trim(),
    image: imageUrl.value.trim()
  };

  await addDoc(collection(db, "products"), product);

  adminForm.reset();

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

        </div>

        <div class="card-actions">

          <button
            data-view-product="${item.id}"
          >
            Ver
          </button>

          <button
            data-add-cart="${item.id}"
          >
            Añadir
          </button>

        </div>

      </article>

    `)
    .join("");

  itemCount.textContent =
    `${visibleItems.length} productos`;

  emptyState.hidden =
    visibleItems.length > 0;

}

// ===============================
// PRODUCT MODAL
// ===============================

function showProduct(id) {

  const item = items.find(
    (food) => food.id === id
  );

  if (!item) return;

  selectedProductId = id;

  detailImage.src = item.image;

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

// ===============================
// MENU ACTIONS
// ===============================

menuGrid.addEventListener("click", (event) => {

  const addButton =
    event.target.closest("[data-add-cart]");

  const viewButton =
    event.target.closest("[data-view-product]");

  if (addButton) {

    addToCart(addButton.dataset.addCart);

    return;

  }

  if (viewButton) {

    showProduct(viewButton.dataset.viewProduct);

  }

});

// ===============================
// CART
// ===============================

function addToCart(id) {

  const existing = cart.find(
    (item) => item.id === id
  );

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

  cartEmpty.hidden =
    cartRows.length > 0;

  cartCount.textContent = cartRows.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const total = cartRows.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0
  );

  cartTotal.textContent =
    `$${formatPrice(total)}`;

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
    (sum, item) =>
      sum + item.price * item.quantity,
    0
  );

  await addDoc(collection(db, "orders"), {
    createdAt: new Date().toISOString(),
    items: orderItems,
    total,
    status: "Pendiente"
  });

  cart = [];

  saveCart();
  renderCart();

}

// ===============================
// ORDERS
// ===============================

function renderOrders() {

  ordersEmpty.hidden =
    orders.length > 0;

  ordersList.innerHTML = orders
    .map((order, index) => `

      <article
        class="order-card status-${order.status.toLowerCase()}"
      >

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
            .map((item) => `

              <div class="order-item">

                <span>
                  ${escapeHtml(item.name)}
                </span>

                <small>
                  ${item.quantity}
                  x
                  $${formatPrice(item.price)}
                </small>

              </div>

            `)
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

ordersList?.addEventListener("click", async (event) => {

  const completeButton =
    event.target.closest("[data-complete-order]");

  const cancelButton =
    event.target.closest("[data-cancel-order]");

  if (completeButton) {

    await updateDoc(
      doc(db, "orders", completeButton.dataset.completeOrder),
      {
        status: "Completado"
      }
    );

  }

  if (cancelButton) {

    await updateDoc(
      doc(db, "orders", cancelButton.dataset.cancelOrder),
      {
        status: "Cancelado"
      }
    );

  }

});

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

// ===============================
// MODALS
// ===============================

adminEntry?.addEventListener("click", () => {

  openDialog(adminModal);

});

closeAdmin?.addEventListener("click", () => {

  closeDialog(adminModal);

});

cartEntry?.addEventListener("click", () => {

  renderCart();

  openDialog(cartModal);

});

closeCart?.addEventListener("click", () => {

  closeDialog(cartModal);

});

closeProduct?.addEventListener("click", () => {

  closeDialog(productModal);

});

closeQr?.addEventListener("click", () => {

  closeDialog(qrModal);

});

// ===============================
// LOGIN
// ===============================

loginForm?.addEventListener("submit", (event) => {

  event.preventDefault();

  const username =
    adminUser.value.trim();

  const password =
    adminPassword.value.trim();

  if (
    username === ADMIN_USER &&
    password === ADMIN_PASSWORD
  ) {

    loginError.hidden = true;

    loginForm.hidden = true;

    adminContent.hidden = false;

  } else {

    loginError.hidden = false;

  }

});

// ===============================
// LOGOUT
// ===============================

logoutAdmin?.addEventListener("click", () => {

  adminContent.hidden = true;

  loginForm.hidden = false;

  loginForm.reset();

});

// ===============================
// PRODUCT DETAIL CART
// ===============================

detailAddCart?.addEventListener("click", () => {

  if (!selectedProductId) return;

  addToCart(selectedProductId);

  closeDialog(productModal);

});

// ===============================
// CONFIRM ORDER
// ===============================

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
