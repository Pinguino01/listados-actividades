import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================
FIREBASE
========================= */

const firebaseConfig = {

  apiKey: "TU_API_KEY",

  authDomain: "TU_AUTH_DOMAIN",

  projectId: "TU_PROJECT_ID",

  storageBucket: "TU_STORAGE_BUCKET",

  messagingSenderId: "TU_SENDER_ID",

  appId: "TU_APP_ID"

};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

/* =========================
CONFIG
========================= */

const ADMIN_USER = "admin";

const ADMIN_PASSWORD = "admin123";

/* =========================
DOM
========================= */

const menuGrid =
  document.querySelector("#menuGrid");

const itemCount =
  document.querySelector("#itemCount");

const emptyState =
  document.querySelector("#emptyState");

const tabsContainer =
  document.querySelector("#tabsContainer");

const cartEntry =
  document.querySelector("#cartEntry");

const cartModal =
  document.querySelector("#cartModal");

const closeCart =
  document.querySelector("#closeCart");

const cartItems =
  document.querySelector("#cartItems");

const cartTotal =
  document.querySelector("#cartTotal");

const cartCount =
  document.querySelector("#cartCount");

const confirmOrder =
  document.querySelector("#confirmOrder");

const cartEmpty =
  document.querySelector("#cartEmpty");

const adminEntry =
  document.querySelector("#adminEntry");

const adminModal =
  document.querySelector("#adminModal");

const closeAdmin =
  document.querySelector("#closeAdmin");

const loginForm =
  document.querySelector("#loginForm");

const adminUser =
  document.querySelector("#adminUser");

const adminPassword =
  document.querySelector("#adminPassword");

const loginError =
  document.querySelector("#loginError");

const adminContent =
  document.querySelector("#adminContent");

const logoutAdmin =
  document.querySelector("#logoutAdmin");

const categoryInput =
  document.querySelector("#foodCategory");

const newCategoryInput =
  document.querySelector("#newCategoryInput");

const addCategoryButton =
  document.querySelector("#addCategoryButton");

const adminForm =
  document.querySelector("#adminForm");

const nameInput =
  document.querySelector("#foodName");

const priceInput =
  document.querySelector("#foodPrice");

const imageUrl =
  document.querySelector("#foodImageUrl");

const descriptionInput =
  document.querySelector("#foodDescription");

const ordersList =
  document.querySelector("#ordersList");

const ordersEmpty =
  document.querySelector("#ordersEmpty");

/* =========================
STATE
========================= */

let items = [];

let categories = [];

let orders = [];

let cart = [];

let activeCategory = "Todos";

/* =========================
FIREBASE LISTENERS
========================= */

onSnapshot(
  collection(db, "products"),
  (snapshot) => {

    items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    renderMenu();
    renderCart();

  }
);

onSnapshot(
  collection(db, "categories"),
  (snapshot) => {

    categories = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    renderCategories();

  }
);

onSnapshot(
  collection(db, "orders"),
  (snapshot) => {

    orders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    renderOrders();

  }
);

/* =========================
RENDER CATEGORIES
========================= */

function renderCategories() {

  categoryInput.innerHTML =
    categories.map((category) => `
      <option>
        ${category.name}
      </option>
    `).join("");

  const allCategories = [
    "Todos",
    ...categories.map(
      (category) => category.name
    )
  ];

  tabsContainer.innerHTML =
    allCategories.map((category) => `
      <button
        class="tab ${activeCategory === category ? "active" : ""}"
        data-category="${category}"
      >
        ${category}
      </button>
    `).join("");

  tabsContainer
    .querySelectorAll(".tab")
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          activeCategory =
            button.dataset.category;

          renderCategories();
          renderMenu();

        }
      );

    });

}

/* =========================
ADD CATEGORY
========================= */

addCategoryButton.addEventListener(
  "click",
  async () => {

    const name =
      newCategoryInput.value.trim();

    if (!name) return;

    await addDoc(
      collection(db, "categories"),
      {
        name
      }
    );

    newCategoryInput.value = "";

  }
);

/* =========================
SAVE PRODUCT
========================= */

adminForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    await addDoc(
      collection(db, "products"),
      {

        name:
          nameInput.value.trim(),

        price:
          Number(priceInput.value),

        category:
          categoryInput.value,

        image:
          imageUrl.value.trim(),

        description:
          descriptionInput.value.trim()

      }
    );

    adminForm.reset();

  }
);

/* =========================
MENU
========================= */

function renderMenu() {

  const visibleItems =
    activeCategory === "Todos"
      ? items
      : items.filter(
          (item) =>
            item.category === activeCategory
        );

  menuGrid.innerHTML =
    visibleItems.map((item) => `
      <article class="menu-card">

        <img src="${item.image}">

        <h3>
          ${item.name}
        </h3>

        <p>
          ${item.description}
        </p>

        <div class="card-footer">

          <strong>
            $${item.price}
          </strong>

          <button
            data-cart="${item.id}"
          >
            Añadir
          </button>

        </div>

      </article>
    `).join("");

  itemCount.textContent =
    `${visibleItems.length} productos`;

  emptyState.hidden =
    visibleItems.length > 0;

}

/* =========================
ADD CART
========================= */

menuGrid.addEventListener(
  "click",
  (event) => {

    const button =
      event.target.closest("[data-cart]");

    if (!button) return;

    const id =
      button.dataset.cart;

    const existing =
      cart.find((item) => item.id === id);

    if (existing) {

      existing.quantity++;

    } else {

      cart.push({
        id,
        quantity: 1
      });

    }

    renderCart();

  }
);

/* =========================
RENDER CART
========================= */

function renderCart() {

  const cartRows = cart.map((entry) => {

    const product =
      items.find(
        (item) => item.id === entry.id
      );

    return {
      ...product,
      quantity: entry.quantity
    };

  });

  cartItems.innerHTML =
    cartRows.map((item) => `
      <div class="cart-row">

        <strong>
          ${item.name}
        </strong>

        <span>
          ${item.quantity} x $${item.price}
        </span>

      </div>
    `).join("");

  cartEmpty.hidden =
    cartRows.length > 0;

  const total =
    cartRows.reduce(
      (sum, item) =>
        sum + item.price * item.quantity,
      0
    );

  cartTotal.textContent =
    `$${total}`;

  cartCount.textContent =
    cartRows.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    );

}

/* =========================
CONFIRM ORDER
========================= */

confirmOrder.addEventListener(
  "click",
  async () => {

    if (!cart.length) return;

    const orderItems = cart.map((entry) => {

      const item =
        items.find(
          (product) =>
            product.id === entry.id
        );

      return {

        id: item.id,

        name: item.name,

        price: item.price,

        quantity: entry.quantity

      };

    });

    const total =
      orderItems.reduce(
        (sum, item) =>
          sum + item.price * item.quantity,
        0
      );

    await addDoc(
      collection(db, "orders"),
      {

        createdAt:
          new Date().toISOString(),

        status: "Pendiente",

        items: orderItems,

        total

      }
    );

    cart = [];

    renderCart();

  }
);

/* =========================
RENDER ORDERS
========================= */

function renderOrders() {

  ordersEmpty.hidden =
    orders.length > 0;

  ordersList.innerHTML =
    orders.map((order) => `
      <div class="order-card">

        <div class="order-top">

          <strong>
            ${order.status}
          </strong>

          <span>
            $${order.total}
          </span>

        </div>

        <div class="order-actions">

          <button
            data-complete="${order.id}"
          >
            Completar
          </button>

          <button
            data-cancel="${order.id}"
          >
            Cancelar
          </button>

        </div>

      </div>
    `).join("");

}

/* =========================
ORDER ACTIONS
========================= */

ordersList.addEventListener(
  "click",
  async (event) => {

    const complete =
      event.target.closest("[data-complete]");

    const cancel =
      event.target.closest("[data-cancel]");

    if (complete) {

      await updateDoc(
        doc(
          db,
          "orders",
          complete.dataset.complete
        ),
        {
          status: "Completado"
        }
      );

    }

    if (cancel) {

      await updateDoc(
        doc(
          db,
          "orders",
          cancel.dataset.cancel
        ),
        {
          status: "Cancelado"
        }
      );

    }

  }
);

/* =========================
MODALS
========================= */

function openDialog(dialog) {

  dialog.showModal();

}

function closeDialog(dialog) {

  dialog.close();

}

/* =========================
CART
========================= */

cartEntry.addEventListener(
  "click",
  () => {

    openDialog(cartModal);

  }
);

closeCart.addEventListener(
  "click",
  () => {

    closeDialog(cartModal);

  }
);

/* =========================
ADMIN
========================= */

adminEntry.addEventListener(
  "click",
  () => {

    openDialog(adminModal);

  }
);

closeAdmin.addEventListener(
  "click",
  () => {

    closeDialog(adminModal);

  }
);

/* =========================
LOGIN
========================= */

loginForm.addEventListener(
  "submit",
  (event) => {

    event.preventDefault();

    if (
      adminUser.value === ADMIN_USER &&
      adminPassword.value === ADMIN_PASSWORD
    ) {

      loginForm.style.display = "none";

      adminContent.hidden = false;

    } else {

      loginError.hidden = false;

    }

  }
);

/* =========================
LOGOUT
========================= */

logoutAdmin.addEventListener(
  "click",
  () => {

    adminContent.hidden = true;

    loginForm.style.display = "grid";

  }
);
