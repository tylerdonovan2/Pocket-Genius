chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("QUESTION SOLVER:", request)
    if (request.action === "solve-question"){

    } else if (request.action === "solve-all-questions"){
        
    }
});