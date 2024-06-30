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

// Load the blocked URLs when the popup is opened
document.addEventListener('DOMContentLoaded', loadBlockedUrls);
