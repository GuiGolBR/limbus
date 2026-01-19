import { supabase } from "./supabaseClient.js";
import { addToWishlist, removeFromWishlist } from "./wishlist.js";
import { SINNER_ORDER, groupBySinner, SINNER_NAMES } from "./sinners.js";

export async function loadIdentities() {
  const { data, error } = await supabase
    .from("identities")
    .select("*")
    .order("sinner", { ascending: true })
    .order("rarity", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export function renderIdentities(identities, wishlistIds, userId, searchQuery = "") {
  const container = document.getElementById("identityList");
  container.innerHTML = "";


  const filteredIdentities = identities.filter(identity =>
    identity.name.toLowerCase().includes(searchQuery)
  );

  const grouped = groupBySinner(filteredIdentities);

  SINNER_ORDER.forEach(sinnerNumber => {
    const sinnerIdentities = grouped[sinnerNumber];
    if (!sinnerIdentities || sinnerIdentities.length === 0) return;

    const section = document.createElement("section");
    section.className = "sinner-section";

    const title = document.createElement("h3");
    title.className = "sinner-title";
    title.textContent = SINNER_NAMES[sinnerNumber] || `Sinner ${sinnerNumber}`;
    section.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "grid";

    sinnerIdentities.forEach(identity => {
      const card = document.createElement("div");
      card.className = "card";

      const inWishlist = wishlistIds.has(identity.id);

      card.innerHTML = `
        <div class="content">
        <div class="image-wrap rarity-${identity.rarity}">
            <img src="${identity.image_url}" />
            <img class="rarity-overlay" src="./assets/rarity${identity.rarity}.webp" />
        </div>
        <h3>${identity.name}</h3>
        </div>
        <div class="wishlist-modal">
            <button>${inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}</button>
        </div>
      `;

      card.querySelector("button").onclick = async () => {
        if (inWishlist) {
          await removeFromWishlist(identity.id, userId);
          wishlistIds.delete(identity.id);
        } else {
          await addToWishlist(identity.id, userId);
          wishlistIds.add(identity.id);
        }
        renderIdentities(identities, wishlistIds, userId, searchQuery);
        document.dispatchEvent(new Event("wishlist-updated"));
      };

      grid.appendChild(card);
    });

    section.appendChild(grid);
    container.appendChild(section);
  });
}
