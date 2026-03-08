// ============================================
// Background Service Worker
// Handles external messages from admin panel
// and context menu actions.
// ============================================

// Listen for messages from externally connectable sites (admin panel)
chrome.runtime.onMessageExternal.addListener(
  async (request, sender, sendResponse) => {
    if (request.type === "ping") {
      sendResponse({ ok: true, version: chrome.runtime.getManifest().version });
      return true;
    }

    if (request.type === "scrape_active_tab") {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) {
          sendResponse({ success: false, error: "No active tab" });
          return true;
        }

        const [result] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const sel = window.getSelection()?.toString()?.trim();
            const el = document.querySelector("article") || document.querySelector("main") || document.body;
            const content = sel || (el?.innerText || "").substring(0, 8000);
            return {
              url: location.href,
              title: document.title,
              content,
              has_selection: !!sel,
            };
          },
        });

        sendResponse({ success: true, data: result?.result });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
      return true;
    }

    if (request.type === "navigate_and_scrape") {
      try {
        // Open URL in new tab, wait for load, scrape, close
        const tab = await chrome.tabs.create({ url: request.url, active: false });
        
        // Wait for tab to finish loading
        await new Promise((resolve) => {
          const listener = (tabId, info) => {
            if (tabId === tab.id && info.status === "complete") {
              chrome.tabs.onUpdated.removeListener(listener);
              resolve();
            }
          };
          chrome.tabs.onUpdated.addListener(listener);
          // Timeout after 15s
          setTimeout(() => {
            chrome.tabs.onUpdated.removeListener(listener);
            resolve();
          }, 15000);
        });

        // Small extra delay for JS rendering
        await new Promise((r) => setTimeout(r, 1000));

        const [result] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const el = document.querySelector("article") || document.querySelector("main") || document.body;
            return {
              url: location.href,
              title: document.title,
              content: (el?.innerText || "").substring(0, 8000),
            };
          },
        });

        // Close the tab
        await chrome.tabs.remove(tab.id);

        sendResponse({ success: true, data: result?.result });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
      return true;
    }

    sendResponse({ error: "Unknown message type" });
    return true;
  }
);
