// handle live option changes
let ghostMode = false
chrome.storage.local.get("ghost-mode",function(items){
    ghostMode = items["ghost-mode"] ? items["ghost-mode"] : false
})
chrome.storage.onChanged.addListener(function(changes){
    ghostMode = changes["ghost-mode"] ? changes["ghost-mode"]["newValue"] : ghostMode
    console.log(ghostMode)
})


// listen and intercept requests
let modifiedPayloads = {}
let submittedEvents = []

const urlQuery = "*://*/api/v1/courses/*/quizzes/*/submissions/*/events"
chrome.webRequest.onBeforeRequest.addListener(
    interceptRequestBody,
    {urls:[urlQuery]},
    ["blocking","requestBody"],
)
chrome.webRequest.onBeforeSendHeaders.addListener(
    interceptRequestHeaders,
    {urls:[urlQuery]},
    ["blocking","requestHeaders"],
)

function interceptRequestBody(details){
    // Feature is disabled
    if(!ghostMode) return {cancel: false}

    // decode request body
    let decodedRequestBody = JSON.parse(decodeURIComponent(String.fromCharCode.apply(null,
        new Uint8Array(details.requestBody.raw[0].bytes))))
        
    // check if request has been sent by the extension
    if(details.initiator.includes("chrome-extension")) return {cancel: false}
        
    // get list of quiz events
    let quizSubmissionEvents = decodedRequestBody["quiz_submission_events"]

    // filter events
    let filteredSubmissionEvents = []
    const negativeEventTypes = ["page_blurred","page_focused"]
    for(let i = 0; i < quizSubmissionEvents.length; i++){
        if (!((negativeEventTypes.includes(quizSubmissionEvents[i]["event_type"])) || (isSubmitted(quizSubmissionEvents[i])))){
            filteredSubmissionEvents.push(quizSubmissionEvents[i])
        }
    }


    // modify request body
    let modifiedPayload = {quiz_submission_events: filteredSubmissionEvents}
    modifiedPayloads[details.requestId] = modifiedPayload

    return {cancel:false}
}

function interceptRequestHeaders(details){
    // Feature is disabled
    if(!ghostMode) return {cancel: false}

    // check if request has been sent by the extension
    if(details.initiator.includes("chrome-extension")) return {cancel: false}

    // format headers for fetch 
    let requestHeaders = details.requestHeaders
    
    let reformattedHeaders = {}
    for(let i = 0; i < requestHeaders.length; i++){
        reformattedHeaders[requestHeaders[i].name] = requestHeaders[i].value
    }

    // send modified request
    let payload = modifiedPayloads[details.requestId]

    let modifiedRequest = new Request(details.url, {
        "headers": reformattedHeaders,
        "body": JSON.stringify(payload),
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
        })
    fetch(modifiedRequest);

    delete modifiedPayloads[details.requestId]

    // track submitted events
    submittedEvents.push.apply(submittedEvents,payload["quiz_submission_events"])


    return {cancel:true}
}


// submitted event filter
function isSubmitted(event){
    for(let i = 0; i < submittedEvents.length; i++){
        if (isEqual(event,submittedEvents[i])){
            return true
        }
    }
    return false
}
function isEqual(obj1,obj2){
    return JSON.stringify(obj1) === JSON.stringify(obj2)
}


// communicate between scripts
function sendActionMessage(action){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, {action: action}, function(response) {});  
    });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "remove-events"){
        submittedEvents = submittedEvents.filter((element) => !request.events.includes(element));
    }
});