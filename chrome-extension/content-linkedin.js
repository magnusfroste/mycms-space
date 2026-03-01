// ============================================
// LinkedIn Content Script
// Injects "Send to CMS" into LinkedIn post overflow menus
// ============================================

const DEFAULT_ENDPOINT =
  "https://jcsjqnjvnqqghiaawhcl.supabase.co/functions/v1/signal-ingest";

// Watch for LinkedIn dropdown menus opening
const observer = new MutationObserver((mutations) => {
  for (const m of mutations) {
    for (const node of m.addedNodes) {
      if (node.nodeType !== 1) continue;
      // LinkedIn renders dropdown menus in a div with class containing "artdeco-dropdown"
      const menus = node.matches?.(".artdeco-dropdown__content")
        ? [node]
        : [...(node.querySelectorAll?.(".artdeco-dropdown__content") || [])];

      for (const menu of menus) {
        injectMenuItem(menu);
      }
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });

function injectMenuItem(menu) {
  // Avoid duplicates
  if (menu.querySelector("[data-cms-signal]")) return;

  // Find the list inside the dropdown
  const list = menu.querySelector("ul, div[role='list'], div[role='menu']") || menu;

  const item = document.createElement("div");
  item.setAttribute("data-cms-signal", "true");
  item.setAttribute("role", "menuitem");
  item.style.cssText = `
    padding: 8px 12px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: #1d1d1f;
    display: flex;
    align-items: center;
    gap: 8px;
    border-top: 1px solid #e0e0e0;
  `;
  item.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0">
      <path d="M3 8L7 12L13 4" stroke="#0a66c2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span>Send to CMS</span>
  `;

  item.addEventListener("mouseenter", () => {
    item.style.background = "#f3f6f8";
  });
  item.addEventListener("mouseleave", () => {
    item.style.background = "transparent";
  });

  item.addEventListener("click", async (e) => {
    e.stopPropagation();
    e.preventDefault();
    await sendPostSignal(menu, item);
  });

  list.appendChild(item);
}

async function sendPostSignal(menu, btnEl) {
  const originalText = btnEl.querySelector("span").textContent;
  btnEl.querySelector("span").textContent = "Sending…";

  try {
    // Walk up to find the post container
    const post = menu.closest(
      ".feed-shared-update-v2, .occludable-update, [data-urn]"
    ) || menu.closest("article") || findPostContainer(menu);

    const postText = post
      ? (post.querySelector(".feed-shared-text, .break-words, .feed-shared-update-v2__description")?.innerText ||
         post.querySelector("[dir='ltr']")?.innerText ||
         post.innerText || "").substring(0, 8000)
      : "";

    const authorEl = post?.querySelector(
      ".update-components-actor__name span, .feed-shared-actor__name span, a[data-tracking-control-name*='actor'] span"
    );
    const author = authorEl?.innerText?.trim() || "";

    const linkEl = post?.querySelector(
      "a[data-tracking-control-name*='update_timestamp'], a[href*='/feed/update/']"
    );
    const postUrl = linkEl?.href || window.location.href;

    const title = author ? `LinkedIn post by ${author}` : "LinkedIn post";

    const stored = await chrome.storage.local.get(["endpoint", "token"]);
    const endpoint = stored.endpoint || DEFAULT_ENDPOINT;
    const token = stored.token;

    if (!token) {
      btnEl.querySelector("span").textContent = "⚠ Set token in extension";
      setTimeout(() => { btnEl.querySelector("span").textContent = originalText; }, 2500);
      return;
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        url: postUrl,
        title,
        content: postText,
        note: "",
        source_type: "linkedin",
      }),
    });

    const data = await res.json();

    if (res.ok && data.ok) {
      btnEl.querySelector("span").textContent = "✓ Sent!";
      btnEl.style.color = "#057642";
    } else {
      btnEl.querySelector("span").textContent = `✗ ${data.error || "Error"}`;
      btnEl.style.color = "#cc0000";
    }
  } catch (err) {
    btnEl.querySelector("span").textContent = "✗ Network error";
    btnEl.style.color = "#cc0000";
  }

  setTimeout(() => {
    btnEl.querySelector("span").textContent = originalText;
    btnEl.style.color = "#1d1d1f";
  }, 2500);
}

// Fallback: walk up from menu to find something that looks like a post
function findPostContainer(el) {
  let node = el;
  for (let i = 0; i < 15 && node; i++) {
    node = node.parentElement;
    if (!node) break;
    // Posts are typically large containers
    if (node.offsetHeight > 200 && node.querySelector("[dir='ltr']")) {
      return node;
    }
  }
  return null;
}
