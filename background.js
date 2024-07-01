// Function to normalize URLs by removing the scheme and any trailing slashes
function normalizeUrl(url) {
    if (!url) return '';  // Check if the URL is undefined or empty and return an empty string
  
    try {
      let normalizedUrl = new URL(url);
      return normalizedUrl.hostname + normalizedUrl.pathname.replace(/\/+$/, '');
    } catch (e) {
      return url.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    }
  }

const apiKey = "AIzaSyD1WIdP_wfGWPkOww2qL5-y5NLSbUX1kAw";
const apiURL = 'https://safebrowsing.googleapis.com/v4/threatMatches:find?key=' + apiKey;

// Initialize storage with an empty list if not present
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get({ blockedUrls: [] }, (result) => {
      if (!result.blockedUrls.length) {
          chrome.storage.local.set({ blockedUrls: [] });
      }
  });
  checkURLWithGoogleSafeBrowsing();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        console.log('Tab updated:', changeInfo.url);
        checkURLWithGoogleSafeBrowsing(changeInfo.url);
    }
});

function showNotification(url, threatType) {
    chrome.notifications.create(
        {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/alert.png'), // Path to the icon image
            title: 'Security Alert',
            message: `The URL ${url} has been identified as ${threatType}. Please proceed with caution.`,
            priority: 2
        },
        function(notificationId) {
            console.log("Notification shown:", notificationId);
        }
    );
}
chrome.notifications.onClicked.addListener(function(notificationId) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs.length > 0) {
            chrome.tabs.update(tabs[0].id, {url: 'https://www.google.com/'});
        } else {
            chrome.tabs.create({url: 'https://www.google.com/'});
        }
    });
});

// Function to fetch malicious URLs from Google Safe Browsing API
function checkURLWithGoogleSafeBrowsing(url) {
    const request = {
        client: {
            clientId: "obfgldehlifoonaobolcelfhkpjaapnm",
            clientVersion: "1.0"
        },
        threatInfo: {
            threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url: url }]
        }
    };

    fetch(apiURL, {
        method: 'POST',
        body: JSON.stringify(request),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        console.log('Received response:', response);
        return response.json();
    })
    .then(data => {
        console.log('API Response:', data);
        if (data.matches && data.matches.length > 0) {
            const threatType = data.matches[0].threatType;
            showNotification(normalizeUrl(url), threatType);
        }
    })
    .catch(error => {
        console.error('Error checking URL: ', error);
        console.log('Failed URL:', url);
    });
}


// Function to update the dynamic rules based on storage
function updateRules() {
    chrome.storage.local.get('blockedUrls', (result) => {
        const blockedUrls = result.blockedUrls;
        let rules = [];
  
        // Create unique rules for each blocked URL
        blockedUrls.forEach((site, index) => {
            // Block Rule
            rules.push(
                {
                id: index * 2 + 1,  // Ensuring unique ID for block
                priority: 1,
                action: { type: 'block' },
                condition: { urlFilter: `*://${site}/*`, resourceTypes: ['main_frame'] }
                }
        ); 
    });
  
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
