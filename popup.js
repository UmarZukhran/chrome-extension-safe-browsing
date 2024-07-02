document.getElementById('blockButton').addEventListener('click', () => {
  const url = document.getElementById('url').value.trim();
  const statusElement = document.getElementById('status');
  if (url) {
      chrome.runtime.sendMessage({ type: 'addUrl', url }, (response) => {
          if (response.success) {
              statusElement.innerText = 'URL blocked successfully!';
              statusElement.className = 'text-success';
              document.getElementById('url').value = '';
              loadBlockedUrls();
          } else {
              statusElement.innerText = response.error || 'Failed to block URL.';
              statusElement.className = 'text-danger';
          }
      });
  } else {
      statusElement.innerText = 'Please enter a valid URL.';
      statusElement.className = 'text-danger';
  }
});

document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get('maliciousUrls', function(result) {
        if (chrome.runtime.lastError) {
            console.error('Error fetching malicious URLs:', chrome.runtime.lastError);
            return;
        }

        const maliciousUrls = result.maliciousUrls || [];
        const listContainer = document.getElementById('malicious-urls-list');
        listContainer.innerHTML = ''; // Clear existing entries

        maliciousUrls.forEach(urlInfo => {
            const listItem = document.createElement('li');
            listItem.textContent = `${urlInfo.url} - Threat Type: ${urlInfo.threatType}`;
            listContainer.appendChild(listItem);
        });
    });
});


function loadBlockedUrls() {
  chrome.runtime.sendMessage({ type: 'getBlockedUrls' }, (response) => {
      const blockedUrls = response.blockedUrls;
      const blockedUrlsContainer = document.getElementById('blockedUrls');
      blockedUrlsContainer.innerHTML = '';

      blockedUrls.forEach(url => {
          const urlItem = document.createElement('div');
          urlItem.className = 'url-item list-group-item d-flex justify-content-between align-items-center';
          urlItem.textContent = url;

          const deleteButton = document.createElement('button');
          deleteButton.className = 'btn btn-danger btn-sm';
          deleteButton.textContent = 'Delete';
          deleteButton.addEventListener('click', () => {
              chrome.runtime.sendMessage({ type: 'removeUrl', url }, (response) => {
                  if (response.success) {
                      loadBlockedUrls();
                  }
              });
          });

          urlItem.appendChild(deleteButton);
          blockedUrlsContainer.appendChild(urlItem);
      });
  });
}

// Event listener to clear blocked URLs
document.getElementById('clearBlockedUrlsButton').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'clearBlockedUrls' }, (response) => {
        if (response.success) {
            loadBlockedUrls();
        }
    });
});

// Event listener to clear malicious URLs
document.getElementById('clearMaliciousUrlsButton').addEventListener('click', () => {
    chrome.storage.local.remove('maliciousUrls', () => {
        if (chrome.runtime.lastError) {
            console.error('Error clearing malicious URLs:', chrome.runtime.lastError);
        } else {
            const listContainer = document.getElementById('malicious-urls-list');
            listContainer.innerHTML = ''; // Clear the list in the popup
            console.log('Malicious URLs cleared successfully');
        }
    });
});

// Load the blocked URLs when the popup is opened
document.addEventListener('DOMContentLoaded', loadBlockedUrls);
