
let isHighlighted = false
function getElementByXpath(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

document.addEventListener("keypress",function(event){
    if(event.key !== 'h') return

    chrome.runtime.sendMessage({action:"get-highlight-setting"},function(doHighlight){
        console.log(doHighlight.value)
        if(!doHighlight.value) return
        console.log("HIGHLIGHTING",dataKey)

        isHighlighted = !isHighlighted

        chrome.runtime.sendMessage({action: "get-scrape-data", key: dataKey}, function(response){
            console.log(response)
            for(let i = 0; i < response.value.length; i++){
                let questionData = response.value[i]
                console.log(questionData)

                if (!questionData.solved) continue

                let confidence = questionData.answerConfidence
                let highlightColor = confidence > 0.5 ? "rgb(" + (1 - confidence) * 255 + ",255,0)" : "rgb(255," + (confidence) * 255 + ",0)"
                
 
                getElementByXpath(questionData.answerHighlight).style.backgroundColor = isHighlighted ? highlightColor : ''
            }
        })
    })
})