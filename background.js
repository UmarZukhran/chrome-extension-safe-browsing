// Function to normalize URLs by removing the scheme and any trailing slashes
function normalizeUrl(url) {
  try {
      let normalizedUrl = new URL(url);
      return normalizedUrl.hostname + normalizedUrl.pathname.replace(/\/+$/, '');
  } catch (e) {
      return url.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  }
}

// Initialize storage with an empty list if not present
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get({ blockedUrls: [] }, (result) => {
      if (!result.blockedUrls.length) {
          chrome.storage.local.set({ blockedUrls: [] });
      }
  });
});

// Function to update the dynamic rules based on storage
function updateRules() {
  chrome.storage.local.get('blockedUrls', (result) => {
      const blockedUrls = result.blockedUrls;
      const rules = blockedUrls.map((site, index) => ({
          id: index + 1,
          priority: 1,
          action: { type: 'block' },
          condition: { urlFilter: `*://${site}/*`, resourceTypes: ['main_frame'] }
      }));

      // Log current rules for debugging
      console.log('Updating rules:', rules);

      // Remove all existing rules first
      chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
          const existingRuleIds = existingRules.map(rule => rule.id);

          chrome.declarativeNetRequest.updateDynamicRules({
              removeRuleIds: existingRuleIds,
              addRules: rules
          }, () => {
              console.log('Dynamic rules updated successfully');
          });
      });
  });
}

// Listen for messages from the popup to add or remove URLs
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'addUrl') {
      const normalizedUrl = normalizeUrl(message.url);
      chrome.storage.local.get('blockedUrls', (result) => {
          const blockedUrls = result.blockedUrls;
          if (!blockedUrls.includes(normalizedUrl)) {
              blockedUrls.push(normalizedUrl);
              chrome.storage.local.set({ blockedUrls }, () => {
                  updateRules();
                  sendResponse({ success: true });
              });
          } else {
              sendResponse({ success: false, error: 'URL already blocked' });
          }
      });
      return true; // Keeps the message channel open for sendResponse
  } else if (message.type === 'removeUrl') {
      const normalizedUrl = normalizeUrl(message.url);
      chrome.storage.local.get('blockedUrls', (result) => {
          const blockedUrls = result.blockedUrls.filter(url => url !== normalizedUrl);
          chrome.storage.local.set({ blockedUrls }, () => {
              updateRules();
              sendResponse({ success: true });
          });
      });
      return true; // Keeps the message channel open for sendResponse
  } else if (message.type === 'getBlockedUrls') {
      chrome.storage.local.get('blockedUrls', (result) => {
          sendResponse({ blockedUrls: result.blockedUrls });
      });
      return true; // Keeps the message channel open for sendResponse
  }
});

// Initialize rules on startup
updateRules();
