document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('blockSite').addEventListener('click', blockCurrentSite);
    document.getElementById('reportSite').addEventListener('click', reportPhishingSite);
  });
  
  function blockCurrentSite() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const url = tabs[0].url;
      chrome.storage.local.get('phishingUrls', function(data) {
        const updatedUrls = data.phishingUrls || [];
        if (!updatedUrls.includes(url)) {
          updatedUrls.push(url);
          chrome.storage.local.set({ phishingUrls: updatedUrls }, function() {
            alert('Site blocked successfully.');
          });
        } else {
          alert('Site is already blocked.');
        }
      });
    });
  }
  
  function reportPhishingSite() {
    // Implement reporting functionality
    alert('Site reported as phishing.');
  }
  