chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log(request)
    if (request.action === "set-scrape-data"){
        let object = {}
        object[request.key] = request.value
        chrome.storage.local.set(object)
        sendResponse({action:"set-scrape-data",status:"Success"})
    } else if (request.action === "get-scrape-data"){
        let questions = []
        chrome.storage.local.get(request.dataKey,function(items){
            questions = items[request.dataKey]
        })
        sendResponse({action: "get-scrape-data", value:questions})
    }
});