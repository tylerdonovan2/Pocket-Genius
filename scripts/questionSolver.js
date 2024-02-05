let API_KEY = ""
chrome.storage.local.get("api-key",function(items){
    API_KEY = items["api-key"]
})

let questions = []

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "solve-question"){
        chrome.storage.local.get(request.key,function(items){
            console.log(items)
            questions = items[parseInt(request.key)]
            console.log(questions)
            questionNumber = parseInt(request.questionNumber)

            solveQuestion(questions[questionNumber],request.key)
        })


    } else if (request.action === "solve-all-questions"){
        chrome.storage.local.get(request.key,function(items){
            console.log(items)
            questions = items[parseInt(request.key)]
            console.log(questions)
            questionNumber = parseInt(request.questionNumber)

            for(let i = 0; i < questions.length; i++){
                solveQuestion(questions[i], request.key)
            }
        })
    }
});

function maxIndex(arr,key) {
    let maxValue = Number.MIN_VALUE;
    let index = 0
    for (let i = 0; i < arr.length; i++) {
        if (arr[i][key] > maxValue) {
            maxValue = arr[i][key];
            index = i
        }
    }
    return index;
}

function solveQuestion(question, key){
    if (question.solved) return

    function updateDataCallback(apiResponse){
        if (question.questionTypeCode === "multiple_choice_question"){
            for(let i = 0; i < question.answerOptions.answers.length; i++){
                question.answerOptions.answers[i].similarityScore = similarity(question.answerOptions.answers[i].text,apiResponse)
            }
        }
        let answerIndex = maxIndex(question.answerOptions.answers,"similarityScore")
        question.answerHighlight = question.answerOptions.answers[answerIndex].xpath
        question.answerConfidence = question.answerOptions.answers[answerIndex].similarityScore

        question.apiResponse = apiResponse
        question.solved = true


        let object = {}
        object[key] = questions
        chrome.storage.local.set(object)
    }


    sendAPIRequest(question,updateDataCallback)

}


async function sendAPIRequest(questionData,updateDataCallback){
    let content = questionData.questionText + "\nAnswer Choices:\n"
    content = content + questionData.answerOptions.answers.map(i => i.text).join('\n')
    content = questionData.answerOptions.matches ? content + "\nMatching Options:\n" + questionData.answerOptions.matches.map(i => i.text).join('\n') : content

    console.log(content)

    fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + API_KEY
        },
        body: JSON.stringify({
            'model': 'gpt-3.5-turbo',
            'messages': [
                {
                    'role':'system',
                    'content': 'The question is a ' + questionData.questionType + ' question'
                },
                {
                    'role': 'user',
                    'content': content
                }
            ]
        })
    }).then(response => response.json()).then(data => {
        console.log(data)
        console.log(data['choices'][0]['message']['content'])
        updateDataCallback(data['choices'][0]['message']['content'])
    });
}


// String similarity score
// David: https://stackoverflow.com/users/1940394/david
// Overlord: https://stackoverflow.com/users/6145207/overlord1234
// Post: https://stackoverflow.com/questions/10473745/compare-strings-javascript-return-of-likely

function similarity(s1, s2) {
    var longer = s1;
    var shorter = s2;
    if (s1.length < s2.length) {
      longer = s2;
      shorter = s1;
    }
    var longerLength = longer.length;
    if (longerLength == 0) {
      return 1.0;
    }
    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
  }

function editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
  
    var costs = new Array();
    for (var i = 0; i <= s1.length; i++) {
      var lastValue = i;
      for (var j = 0; j <= s2.length; j++) {
        if (i == 0)
          costs[j] = j;
        else {
          if (j > 0) {
            var newValue = costs[j - 1];
            if (s1.charAt(i - 1) != s2.charAt(j - 1))
              newValue = Math.min(Math.min(newValue, lastValue),
                costs[j]) + 1;
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
      }
      if (i > 0)
        costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }