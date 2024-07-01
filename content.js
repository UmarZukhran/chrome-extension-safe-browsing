chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "redirect") {
        location.replace(request.url);
    }
});
