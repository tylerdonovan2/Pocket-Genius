// get pointer to question data
let dataKey = ""
chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    const urlPieces = tabs[0].url.split("/")
    dataKey = urlPieces[4] + urlPieces[6]
});

// home screen
// handles switching between screens
const screenSelector = document.querySelector("#screen-selector")
const screenSelectorButtons = screenSelector.children

for (let i = 0; i < screenSelectorButtons.length; i++){
    screenSelectorButtons[i].addEventListener('click',() => {
        selectScreen(screenSelectorButtons[i].value)
    })
}

const screens = document.querySelector("#screen-container").children
function selectScreen(screenId){
    for(let i = 0; i < screens.length; i++){
        screens[i].className = screens[i].id == screenId ? "screen" : "screen hidden" 
    }
    for(let i = 0; i < screenSelectorButtons.length; i++){
        screenSelectorButtons[i].id = screenId == screenSelectorButtons[i].value ? "selected-screen" : ""
    }
}


// question section
let questions = []
chrome.storage.local.get(null,function(items){
    questions = items[dataKey] ? items[dataKey] : []

    chrome.storage.local.get('selected-question',function(items){
        updateQuestionSelector()
        questionSelector.selectedIndex = items["selected-question"]
        updateOutputDisplays()
    })

    
})
chrome.storage.onChanged.addListener(function(changes){
    console.log(changes,dataKey)
    if(!changes[dataKey]) return
    questions = changes[dataKey]["newValue"]

    updateOutputDisplays()
})


// question selector
const questionSelector = document.querySelector("#question-selector")
function resetQuestionSelector(){
    for(let i = 0; i < questionSelector.children.length;i++){
        questionSelector.children[i].remove()
    }
    let option = document.createElement("option")
    option.innerText = "Select Question"
    questionSelector.appendChild(option)
}

function updateQuestionSelector(){
    resetQuestionSelector()

    for(let i = 0; i < questions.length; i++){
        let questionData = questions[i]
        let option = document.createElement("option")
        option.value = i
        option.innerText = "Question #" + questionData.questionNumber
        questionSelector.appendChild(option)
    }
}


// ui outputs
const questionTextOutput = document.querySelector("#question-view")
const questionTypeOutput = document.querySelector("#question-type")
const apiResponseOutput = document.querySelector("#question-response")
const answerOptionOutput = document.querySelector("#answer-options")
const matchingOptionOutput = document.querySelector("#matching-options")

function resetOutputDisplays(){
    questionTextOutput.innerText = "Question"
    questionTypeOutput.innerText = "Question Type"
    apiResponseOutput.innerText = "API Response"
    answerOptionOutput.innerText = "Answer Choices"
    matchingOptionOutput.innerText = "Matching Choices"

    matchingOptionOutput.className = "output hidden"
}

function eraseOutputDisplays(){
    questionTextOutput.innerText = ""
    questionTypeOutput.innerText = ""
    apiResponseOutput.innerText = ""
    answerOptionOutput.innerText = ""
    matchingOptionOutput.innerText = ""

    matchingOptionOutput.className = "output hidden"
}

function updateOutputDisplays(){

    eraseOutputDisplays()
    chrome.storage.local.set({"selected-question":questionSelector.selectedIndex})
    if(!questionSelector.value) return
    if(questionSelector.value == "Select Question") return


    let questionData = questions[questionSelector.value]

    console.log(questionData,questionSelector.value,questions)

    questionTextOutput.innerText = questionData.questionText
    questionTypeOutput.innerText = questionData.questionType
    
    let answerOptions = questionData.answerOptions.answers
    for(let i = 0; i < answerOptions.length; i++){
        answerOptionOutput.innerText = answerOptionOutput.innerText + answerOptions[i].text

        if(i !== answerOptions.length - 1) answerOptionOutput.innerText = answerOptionOutput.innerText + "\n• "
    }


    if(questionData.questionTypeCode === "matching_question"){

        matchingOptionOutput.className = "output"
        
        let matchingOptions = questionData.answerOptions.matches
        for(let i = 0; i < matchingOptions.length; i++){
            matchingOptionOutput.innerText = matchingOptionOutput.innerText + matchingOptions[i].text

            console.log(i,i < matchingOptions.length,matchingOptions.length)
            if(i !== matchingOptions.length - 1) matchingOptionOutput.innerText = matchingOptionOutput.innerText + "\n\n"
        }
    }

    if (!questionData.solved) return

    apiResponseOutput.innerText = questionData.apiResponse
}

questionSelector.addEventListener('change', updateOutputDisplays)

// action buttons
const solveQuestionButton = document.querySelector("#selected-solve-button")
const solveAllQuestionsButton = document.querySelector("#all-solve-button")

solveQuestionButton.addEventListener('click', function (){
    chrome.runtime.sendMessage({action: "solve-question", key:dataKey, questionNumber:questionSelector.value});
})

solveAllQuestionsButton.addEventListener('click', function(){
    chrome.runtime.sendMessage({action: "solve-all-questions", key:dataKey});
})


// options screen
// api key input
const apiKeyInput = document.querySelector("#api-key-input")

chrome.storage.local.get("api-key",function(items){
    apiKeyInput.value = items["api-key"] ? items["api-key"] : ""
})

apiKeyInput.addEventListener('change',() => {
    chrome.storage.local.set({"api-key": apiKeyInput.value})
})



// handle toggle options
// default off
const toggleOptionsOff = ["answer-highlight","ghost-mode","auto-input"]

for (let i = 0; i < toggleOptionsOff.length; i++){
    let toggle = document.querySelector("#" + toggleOptionsOff[i])

    chrome.storage.local.get(toggleOptionsOff[i],function(items){
        toggle.checked = items[toggleOptionsOff[i]] == undefined ? false : items[toggleOptionsOff[i]]
    })

    toggle.addEventListener('change',() => {
        let option = {}
        option[toggleOptionsOff[i]] = toggle.checked
        chrome.storage.local.set(option)
    })
}

// user interface options

const userInterfaceOptions = ["type-output","choices-output"]


for (let i = 0; i < userInterfaceOptions.length; i++){
    function setVisibility(){
        let section = document.querySelector("#" + userInterfaceOptions[i] + "-section")
        chrome.storage.local.get(userInterfaceOptions[i],function(items){
            let value = items[userInterfaceOptions[i]] == undefined ? true : items[userInterfaceOptions[i]]
            section.className = value ? "output-section" : "output-section hidden"
        })
        // updateOutputDisplays()
    }

    let toggle = document.querySelector("#" + userInterfaceOptions[i])

    chrome.storage.local.get(userInterfaceOptions[i],function(items){
        toggle.checked = items[userInterfaceOptions[i]] == undefined ? true : items[userInterfaceOptions[i]]
    })

    toggle.addEventListener('change',() => {
        let option = {}
        option[userInterfaceOptions[i]] = toggle.checked
        chrome.storage.local.set(option)

        setVisibility()
    })
    setVisibility()
}

