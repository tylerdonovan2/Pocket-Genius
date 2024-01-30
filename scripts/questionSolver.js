

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "solve-question"){
        chrome.storage.local.get(request.key,function(items){
            console.log(items)
            questions = items[parseInt(request.key)]
            console.log(questions)
            questionNumber = parseInt(request.questionNumber)

            if (questions[questionNumber].solved) {sendResponse("Already Solved")}

            function updateCallback(apiResponse){
                questions[questionNumber].apiResponse = apiResponse
                questions[questionNumber].solved = true
                console.log(questions)
    
                let object = {}
                object[request.key] = questions
                chrome.storage.local.set(object)
            }


            sendAPIRequest(questions[questionNumber],updateCallback)
        })


    } else if (request.action === "solve-all-questions"){
        
    }
});




async function sendAPIRequest(questionData,updateCallback){
    let content = questionData.questionText + "\nAnswer Choices:\n"
    content = content + questionData.answerOptions.answers.map(i => i.text).join('\n')
    content = questionData.answerOptions.matches ? content + "\nMatching Options:\n" + questionData.answerOptions.matches.map(i => i.text).join('\n') : content

    console.log(content)

    fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + "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"
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
        updateCallback(data['choices'][0]['message']['content'])
    });
}