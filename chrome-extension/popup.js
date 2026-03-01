// Default endpoint
const DEFAULT_ENDPOINT =
  "https://jcsjqnjvnqqghiaawhcl.supabase.co/functions/v1/signal-ingest";

const $ = (id) => document.getElementById(id);

// --- Init ---
document.addEventListener("DOMContentLoaded", async () => {
  // Load saved settings
  const stored = await chrome.storage.local.get(["endpoint", "token"]);
  $("endpoint").value = stored.endpoint || DEFAULT_ENDPOINT;
  $("token").value = stored.token || "";

  // Auto-detect source from current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url) {
    $("pageMeta").textContent = tab.title || tab.url;
    if (tab.url.includes("linkedin.com")) $("sourceType").value = "linkedin";
    else if (tab.url.includes("x.com") || tab.url.includes("twitter.com"))
      $("sourceType").value = "x";
  }

  $("sendBtn").addEventListener("click", handleSend);
  $("saveSettings").addEventListener("click", handleSaveSettings);
  $("settingsToggle").addEventListener("click", () => {
    $("settingsPanel").classList.toggle("open");
  });
});

// --- Save settings ---
async function handleSaveSettings() {
  const endpoint = $("endpoint").value.trim();
  const token = $("token").value.trim();
  await chrome.storage.local.set({ endpoint, token });
  setStatus("Settings saved", "ok");
}

// --- Send signal ---
async function handleSend() {
  const btn = $("sendBtn");
  btn.disabled = true;
  setStatus("Capturing page…", "");

  try {
    const stored = await chrome.storage.local.get(["endpoint", "token"]);
    const endpoint = stored.endpoint || DEFAULT_ENDPOINT;
    const token = stored.token;

    if (!token) {
      setStatus("Set your API token in Settings first.", "err");
      btn.disabled = false;
      return;
    }

    // Get active tab info + extract content via scripting
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    let pageContent = "";
    let pageTitle = tab.title || "";
    let pageUrl = tab.url || "";

    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Grab selected text first, fall back to body text
          const sel = window.getSelection()?.toString()?.trim();
          if (sel) return sel;
          // Clean body text
          const el = document.querySelector("article") || document.body;
          return el.innerText.substring(0, 8000);
        },
      });
      pageContent = result?.result || "";
    } catch {
      // Some pages block scripting (chrome://, extensions, etc.)
      pageContent = "";
    }

    setStatus("Sending…", "");

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        url: pageUrl,
        title: pageTitle,
        content: pageContent,
        note: $("note").value.trim(),
        source_type: $("sourceType").value,
      }),
    });

    const data = await res.json();

    if (res.ok && data.ok) {
      setStatus("✓ Signal sent!", "ok");
      $("note").value = "";
    } else {
      setStatus(data.error || `Error ${res.status}`, "err");
    }
  } catch (err) {
    setStatus(err.message || "Network error", "err");
  } finally {
    btn.disabled = false;
  }
}

function setStatus(msg, type) {
  const el = $("status");
  el.textContent = msg;
  el.className = "status" + (type ? ` ${type}` : "");
}
