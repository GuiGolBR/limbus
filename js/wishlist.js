import { supabase } from "./supabaseClient.js";
import { SINNER_ORDER, groupBySinner, SINNER_NAMES } from "./sinners.js";

export async function loadWishlist(userId) {
  const { data, error } = await supabase
    .from("wishlists")
    .select("identity_id")
    .eq("user_id", userId);

  if (error) throw error;
  return new Set(data.map(w => w.identity_id));
}

export async function addToWishlist(identityId, userId) {
  return await supabase.from("wishlists").insert({
    user_id: userId,
    identity_id: identityId
  });
}

export async function removeFromWishlist(identityId, userId) {
  return await supabase
    .from("wishlists")
    .delete()
    .eq("user_id", userId)
    .eq("identity_id", identityId);
}

export function renderWishlist(identities, wishlistIds, userId, searchQuery = "") {
  const container = document.getElementById("wishlistList");
  container.innerHTML = "";

  const filteredWishlist = identities.filter(
    i => wishlistIds.has(i.id) && i.name.toLowerCase().includes(searchQuery)
  );

  const grouped = groupBySinner(filteredWishlist);

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
        <div class="image-wrap rarity-${identity.rarity}">
          <img src="${identity.image_url}" />
          <img class="rarity-overlay" src="./assets/rarity${identity.rarity}.webp" />
        </div>
        <h3>${identity.name}</h3>
        <div class="wishlist-modal">
          <button>${inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}</button>
        </div>
      `;

      card.querySelector(".wishlist-modal button").onclick = async () => {
        if (inWishlist) {
          await removeFromWishlist(identity.id, userId);
          wishlistIds.delete(identity.id);
        } else {
          await addToWishlist(identity.id, userId);
          wishlistIds.add(identity.id);
        }
        renderWishlist(identities, wishlistIds, userId, searchQuery);
        document.dispatchEvent(new Event("wishlist-updated"));
      };

      grid.appendChild(card);
    });

    section.appendChild(grid);
    container.appendChild(section);
  });
}
