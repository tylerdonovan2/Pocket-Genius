let answerHighlight = false
chrome.storage.local.get("answer-highlight",function(items){
    answerHighlight = items["answer-highlight"]
})

let questionDataArrays = {}

chrome.storage.onChanged.addListener(function(changes){
    if(changes["answer-highlight"]){
        answerHighlight = changes["answer-highlight"]["newValue"]
    } else{
        let dataKeys = Object.keys(changes)

        for (let i = 0; i < dataKeys.length; i++){
            questionDataArrays[dataKeys[i]] = changes[dataKeys[i]]["newValue"]
        }
        console.log(questionDataArrays)
    }


})

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log(request)
    if (request.action === "set-scrape-data"){
        let object = {}
        object[request.key] = request.value
        chrome.storage.local.set(object)
        sendResponse({action:"set-scrape-data",status:"Success"})
    } else if (request.action === "get-scrape-data"){
        console.log(questionDataArrays)

        sendResponse({action: "get-scrape-data", value:questionDataArrays[request.key]})
    } else if (request.action === "get-highlight-setting"){
        sendResponse({action: "get-highlight-setting", value:answerHighlight})
    }
    sendResponse('error')
});