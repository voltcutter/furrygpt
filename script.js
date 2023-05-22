function sleep(milliseconds)
{
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

var apiRoot = "https://2019-66-220-192-74.ngrok-free.app";

var furrygptConversationContainer = document.getElementById("mainResponseContainer");
var furrygptResponseContainer = document.getElementById("furrygptResponseContainer");
var promptBox = document.getElementById("promptBox");
var promptInput = document.getElementById("promptInput");
var circle = document.getElementById("pulsatingCircle");
var settingsBackground = document.getElementById("settingsOverlayBackground");
var apikeyInput = document.getElementById("apikey");
var apikey = apikeyInput.value;

var usingPromptBox = false;
var answering = false;
var usingSettings = false;

var messages = [];

async function demo() {
    circle.style.visibility = "hidden";
    promptBox.style.visibility = "hidden";
    settingsBackground.style.visibility = "hidden";

    document.onkeydown = async function(event) {
        event = event || window.event;
        var keyCode = event.keyCode || event.which;
        if (!usingSettings) {
            if (!event.ctrlKey && !event.altKey && keyCode !== 8 && keyCode !== 9 && keyCode !== 13) {
                if (!usingPromptBox){
                    usingPromptBox = true;
                    apikey = apikeyInput.value;
                    promptBox.style.visibility = "visible";
                    // promptBox.classList.add("scaleUpAndAppear");
                    promptInput.focus();
                }
            }
            if (keyCode == 27) { //escape key
                usingPromptBox = false;
                promptBox.style.visibility = "hidden";
                // promptBox.classList.add("scaleDownAndDisappear");
            }
            if (keyCode == 13) { //enter key
                if (!event.shiftKey) {
                    if (!answering)
                    {
                        apikey = apikeyInput.value;
                        usingPromptBox = false;
                        promptBox.style.visibility = "hidden";
                        // promptBox.classList.add("scaleDownAndDisappear");
                        // await clearResponseContainer();
                        
                        await getResponseStreaming(promptInput.value);
                        promptInput.value = "";
                    }
                }
            }
        }
    };

    // await getResponseStreaming("Hello");
}

async function clearResponseContainer() {
    const children = furrygptResponseContainer.children;

    for (let i = 0; i < children.length; i++) {
        children[i].classList.remove("furrygptResponseFadeIn");
        children[i].classList.add("furrygptResponseFadeOut");
    }

    setTimeout(() => {
        furrygptResponseContainer.innerHTML = "";
    }, 749);
    // furrygptResponseContainer.innerHTML = "";
}

async function getResponseStreaming(prompt) {
    scrollToBottom();
    let userPromptContainer = document.createElement("div");
    userPromptContainer.classList.add("responseContainer");
    userPromptContainer.classList.add("responseContainerUser");
    let userPrompt = document.createElement("span");
    userPrompt.classList.add("furrygptResponseFadeIn");
    userPrompt.innerHTML = prompt;
    userPromptContainer.appendChild(userPrompt);
    furrygptConversationContainer.appendChild(userPromptContainer);

    let errorContainer = document.getElementById("errorContainer");

    messages.push({"role": "user", "content": prompt});

    let data = {
        messages: messages,
    }
    let headers = {
        'Content-Type': 'application/json',
        "x-api-key": apikey
    }
    circle.style.visibility = "visible";
    answering = true;
    let response = null;
    try {
        response = await fetch(`${apiRoot}/furrygpt/chatcompletion`, {method: "POST", body: JSON.stringify(data), headers: headers});
    }
    catch(errorMessage) {
        showError(errorMessage);
        circle.style.visibility = "hidden";
        answering = false;
        return;
    }
    circle.style.visibility = "hidden";

    const reader = response.body.getReader();

    currentText = "";
    addResponseContainer();

    while (true) {
        const {value, done} = await reader.read();
        if (done) break;
        
        const decodedValue = new TextDecoder("utf-8").decode(value);
        console.log(decodedValue);

        let newChild = document.createElement("span");
        newChild.innerHTML = decodedValue;
        newChild.classList.add("furrygptResponseFadeIn");
        // newChild.classList.add("scaleUpAndAppear");
        furrygptResponseContainer.appendChild(newChild);
        currentText += decodedValue;
        scrollToBottom();
    }

    messages.push({"role": "assistant", "content": currentText});

    let spans = furrygptResponseContainer.querySelectorAll("span");
    for (let i = 0; i < spans.length; i++) {
        if (i > 0) {
            spans[i].remove();
        }
    }
    let newChild = document.createElement("span");
    newChild.innerHTML = currentText;
    newChild.classList.add("furrygptResponse");
    furrygptResponseContainer.appendChild(newChild);

    answering = false;
}

function addResponseContainer(extraText=null) {
    let newResponseContainer = document.createElement("div");
    newResponseContainer.classList.add("responseContainer");
    newResponseContainer.id = "responseContainer";

    let profilePicture = document.createElement("img");
    profilePicture.style.cssText = "height: 50px; float: left; border-radius: 50%; margin-right: 10px; border-style: solid; border-color: #000000; border-width: 2px;";
    profilePicture.src = "furrygptav.png";

    let name = document.createElement("span");
    name.classList.add("boldtext");
    name.innerHTML = "FurryGPT";

    let lineBreak = document.createElement("br");

    newResponseContainer.appendChild(profilePicture);
    newResponseContainer.appendChild(name);
    newResponseContainer.appendChild(lineBreak);

    if (extraText != null) {
        let extraTextSpan = document.createElement("span");
        extraTextSpan.innerHTML = extraText;
        extraTextSpan.classList.add("furrygptResponse");

        newResponseContainer.appendChild(extraTextSpan);
    }

    furrygptConversationContainer.appendChild(newResponseContainer);
    furrygptResponseContainer.id = "";
    furrygptResponseContainer = document.getElementById("responseContainer");
}

function scrollToBottom() {
    furrygptConversationContainer.scrollTop = furrygptConversationContainer.scrollHeight;
}
function scrollToTop() {
    furrygptConversationContainer.scrollTop = 0;
}

function hideSettings() {
    usingSettings = false;
    settingsBackground.style.visibility = "hidden";
}
function showSettings() {
    usingSettings = true;
    settingsBackground.style.visibility = "visible";
}

function refreshInfo() {
    apikey = apikeyInput.value;
    let apiCredits = document.getElementById("apiCredits");
    fetch("http://localhost:5000/furrygpt/getapikey",  {method: "GET", headers: {"Application-Type": "json", "x-api-key": apikey}}).then(function(response) {
        response.json().then(function(json) {
            console.log(json);
            apiCredits.innerHTML = json.apiCreditLeft;
            document.getElementById("usernameElement").innerHTML = json.username;
        });
    });
}

async function dismissError() {
    let errorContainer = document.getElementById("errorContainer");
    errorContainer.classList.add("scaleDownAndDisappear");
    await new Promise(r => setTimeout(r, 100));
    errorContainer.style.visibility = "hidden";
    errorContainer.classList.remove("scaleDownAndDisappear");
}

async function showError(errorMessage) {
    console.log(errorMessage);
    let errorContainer = document.getElementById("errorContainer");
    document.getElementById("errorText").innerHTML = errorMessage;
    errorContainer.classList.add("scaleUpAndAppear");
    errorContainer.style.visibility = "visible";
    await new Promise(r => setTimeout(r, 250));
    errorContainer.classList.remove("scaleUpAndAppear");
}

async function clearConversation() {
    var messageElements = document.querySelectorAll(".responseContainer", ".responseContainerUser");
    for (let i = 0; i < messageElements.length; i++) {
        scrollToTop();
        // try {
        //     messages[i].classList.remove("responseContainer");
        // }   
        // catch {
        //     messages[i].classList.remove("responseContainerUser");
        // }
        messageElements[i].classList.add("scaleDownAndDisappear");
        setTimeout(function() {
            messageElements[i].remove();
        }, 100)
        await new Promise(r => setTimeout(r, 50));
    }
    messages = [];

    addResponseContainer("Hewwo there! Mwy name is FurryGPT. I'm a warge wanguage modew developed by OpenPaws. Pweasure to make uwu acquaintance! :3");

    scrollToBottom();
}

demo();