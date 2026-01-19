import { supabase } from "./supabaseClient.js";
import { getSession, signOut, getUserRole } from "./auth.js";
import { SINNER_ORDER, groupBySinner } from "./sinners.js";

const app = document.getElementById("adminApp");
const warning = document.getElementById("notAuthorized");

const { data: sessionData } = await getSession();
if (!sessionData?.session) {
  window.location.href = "./limbus/login.html";
  throw new Error("Not logged in");
}

const user = sessionData.session.user;
const role = await getUserRole(user.id);

if (role !== "admin") {
  app.style.display = "none";
  warning.style.display = "block";
  setTimeout(() => {
    window.location.href = "./limbus/index.html";
  }, 1500);
  throw new Error("Not authorized");
}

app.style.display = "block";
warning.style.display = "none";

document.getElementById("logoutBtn").onclick = async () => {
  await signOut();
  window.location.href = "./limbus/login.html";
};

document.getElementById("backBtn").onclick = () => {
  window.location.href = ".`/limbus/index.html";
};

let editingId = null;

// Form elements
const nameInput = document.getElementById("nameInput");
const sinnerInput = document.getElementById("sinnerInput");
const rarityInput = document.getElementById("rarityInput");
const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const saveBtn = document.getElementById("saveBtn");
const formTitle = document.getElementById("formTitle");
const toast = document.getElementById("toast");

// Store loaded identities for search
let adminIdentities = [];

// Image preview handling
imageInput.addEventListener("input", () => {
  const url = imageInput.value.trim();
  if (!url) {
    imagePreview.style.display = "none";
    return;
  }
  imagePreview.src = url;
  imagePreview.style.display = "block";
  imagePreview.onerror = () => {
    imagePreview.style.display = "none";
  };
});

// Toast messages
function showToast(message, type = "success") {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 2500);
}

// Form validation
function validateForm() {
  if (!nameInput.value.trim()) return showToast("Name is required", "error"), false;
  if (!sinnerInput.value.trim()) return showToast("Sinner is required", "error"), false;
  if (!rarityInput.value.trim()) return showToast("Rarity is required", "error"), false;
  if (!imageInput.value.trim()) return showToast("Image URL is required", "error"), false;
  return true;
}

// Save / Update identity
saveBtn.onclick = async () => {
  if (!validateForm()) return;

  const identity = {
    name: nameInput.value.trim(),
    sinner: sinnerInput.value.trim(),
    rarity: rarityInput.value.trim(),
    image_url: imageInput.value.trim()
  };

  let result;
  if (editingId) {
    result = await supabase.from("identities").update(identity).eq("id", editingId);
  } else {
    result = await supabase.from("identities").insert(identity);
  }

  if (result.error) {
    showToast("Failed to save identity", "error");
    return;
  }

  showToast("Identity saved successfully", "success");
  resetForm();
  loadAdminIdentities();
};

// Reset form
function resetForm() {
  editingId = null;
  formTitle.textContent = "Add New Identity";
  nameInput.value = "";
  sinnerInput.value = "";
  rarityInput.value = "";
  imageInput.value = "";
  imagePreview.style.display = "none";
}

// Load identities from Supabase
async function loadAdminIdentities() {
  const { data, error } = await supabase
    .from("identities")
    .select("*")
    .order("sinner", { ascending: true })
    .order("rarity", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    showToast("Failed to load identities", "error");
    return;
  }

  adminIdentities = data; // store for search
  renderAdminIdentities(data);
}

// Render identities to DOM
function renderAdminIdentities(data) {
  const list = document.getElementById("adminIdentityList");
  list.innerHTML = "";

  data.forEach(identity => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="image-wrap rarity-${identity.rarity}">
        <img src="${identity.image_url}" />
        <img class="rarity-overlay" src="./assets/rarity${identity.rarity}.webp" />
      </div>
      <h3>${identity.name}</h3>
      <div class="actions">
        <button class="edit">Edit</button>
      </div>
    `;

    // Edit button
    card.querySelector(".edit").onclick = () => {
      editingId = identity.id;
      formTitle.textContent = "Edit Identity";
      nameInput.value = identity.name;
      sinnerInput.value = identity.sinner;
      rarityInput.value = identity.rarity;
      imageInput.value = identity.image_url;
      imagePreview.src = identity.image_url;
      imagePreview.style.display = "block";
    };

    list.appendChild(card);
  });
}

// Initial load
loadAdminIdentities();

// Search functionality
const adminSearchInput = document.getElementById("adminSearch");
adminSearchInput.addEventListener("input", () => {
  const query = adminSearchInput.value.toLowerCase();
  const filtered = adminIdentities.filter(identity =>
    identity.name.toLowerCase().includes(query)
  );
  renderAdminIdentities(filtered);
});
