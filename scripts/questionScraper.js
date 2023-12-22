const urlPieces = window.location.href.split("/")
const dataKey = urlPieces[4] + urlPieces[6]

const questionTypes = {
    "matching_question":
    {
        "type": "Matching",
        "handler": matchingHandler,
    },
    "multiple_choice_question":{
        "type": "Multiple Choice",
        "handler": multipleChoiceHandler,
    },
    "true_false_question":{
        "type": "True/False",
        "handler": multipleChoiceHandler,
    },
    "multiple_answers_question":{
        "type": "Select All",
        "handler": multipleChoiceHandler,
    }
}

// save and load element xpaths
function getElementFromXpath(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function getXPathFromElement(element) {
    if (!element) return null
 
    if (element.id) {
      return `//*[@id="${element.id}"]`
    } else if (element.tagName === 'BODY') {
      return '/html/body'
    } else {
      const sameTagSiblings = Array.from(element.parentNode.childNodes)
        .filter(e => e.nodeName === element.nodeName)
      const idx = sameTagSiblings.indexOf(element)
 
      return getXPathFromElement(element.parentNode) +
        '/' +
        element.tagName.toLowerCase() +
        (sameTagSiblings.length > 1 ? `[${idx + 1}]` : '')
    }
}


// gets child following a path
// e.g (parent, [0,2,1])
// returns parent.children[0].children[2].children[1]
function getChildElement(parent,path){
    let currentElement = parent
    for(let i = 0; i < path.length;i++){
        currentElement = currentElement.children[path[i]]
    }
    return currentElement
}



// scrape questions
function scrapeQuestions(){
    let questions = []
    let questionNumber = 0
    const questionContainer = document.querySelector("#questions")
    for(let i = 0; i < questionContainer.children.length;i++){
        let question = questionContainer.children[i]
        if (question.ariaLabel != "Question") continue
        questionNumber++

        let questionType = question.children[2].classList[2]

        // grab question text
        let questionText = getChildElement(question,[2,5,0]).innerText.trim()

        // canvas is stupid and puts html tags inside inner text so this is a fix
        if(questionText.includes("<") && questionText.includes("</")){
            try {
                let textElement = document.createElement('div');
                textElement.innerHTML = questionText.trim();
                questionText = textElement.firstChild.innerText.trim()
            } catch (error) {
                
            }
        }

        // send question to handler
        let answerOptions = questionTypes[questionType]["handler"](question)

        questions.push({
            "questionNumber":questionNumber,
            "questionType": questionTypes[questionType]["type"],
            "questionTypeCode": questionType,
            "questionText":questionText,
            "answerOptions":answerOptions,
            "solved": false,
        })

    }
    return questions
}

// different question type scraping handlers
function multipleChoiceHandler(questionRoot){
    let answerElements = getChildElement(questionRoot,[2,5,2,0]).children

    let answers = []
    for(let i = 1; i < answerElements.length; i++){
        let answerText = answerElements[i].innerText.trim()
        let answerXPath = getXPathFromElement(answerElements[i])
        answers.push({"text":answerText,"xpath":answerXPath})
    }

    return {"answers":answers,"matches":null}
}
function matchingHandler(questionRoot){
    let matchElements = getChildElement(questionRoot,[2,5,2,0]).children
    let matches = []
    for(let i = 1; i < matchElements.length; i++){
        let matchText = matchElements[i].children[0].innerText.trim()
        matches.push({"text":matchText})
    }

    let answerElements = getChildElement(questionRoot,[2,5,2,0,1,1,0]).children
    let answers = []
    for(let i = 1; i < answerElements.length; i++){
        let answerOption = answerElements[i]
        if(!answerOption.value) continue

        let answerText = answerOption.innerText.trim()

        answers.push({"text":answerText})
    }

    return {"answers":answers,"matches":matches}
}


// check if questions are already stored if not scrape them
chrome.runtime.sendMessage({action: "get-scrape-data", key: dataKey}, function(response){
    if(response.value.length) return
    console.log(dataKey)
    let questions = scrapeQuestions()
    chrome.runtime.sendMessage({action: "set-scrape-data", key: dataKey, value: questions}, function(response) {});
})
