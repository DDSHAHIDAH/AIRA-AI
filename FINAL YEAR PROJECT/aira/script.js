document.addEventListener("DOMContentLoaded", () => {
    const typingForm = document.querySelector(".typing-form");
    const chatList = document.querySelector(".chat-list");
    const toggleThemeButton = document.querySelector("#toggle-theme-button");
    const suggestionElements = document.querySelectorAll(".suggestion-list .suggestion");
    const deleteChatButton = document.querySelector("#delete-chat-button");

    const API_KEY = "AIzaSyCtSR9U59zZNoYBYASztsniJxOk4jeg6FU";
    const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

    let introductionMade = false;

    const loadLocalstorageData = () => {
        const savedChats = localStorage.getItem("savedChats");
        const isLightMode = (localStorage.getItem("themeColor") === "light_mode");
        document.body.classList.toggle("light_mode", isLightMode);
        toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

        chatList.innerHTML = savedChats || "";
        document.body.classList.toggle("hide-header", savedChats);
        chatList.scrollTo(0, chatList.scrollHeight);
    };

    loadLocalstorageData();

    const createMessageElement = (content, ...classes) => {
        const div = document.createElement("div");
        div.classList.add("message", ...classes);
        div.innerHTML = content;
        return div;
    };

    // Show typing effect by displaying words one by one
    const showTypingEffect = (text, textElement) => {
        const words = text.split(' ');
        let currentWordIndex = 0;

        const typingInterval = setInterval(() => {
            // Append each word to the text element with a space
            textElement.innerText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++];

            // If all words are displayed
            if (currentWordIndex === words.length) {
                clearInterval(typingInterval);
                localStorage.setItem("savedChats", chatList.innerHTML)
            }
            chatList.scrollTo(0, chatList.scrollHeight);
        }, 100);
    };

    const generateAPIResponse = async (userMessage, incomingMessageDiv) => {
        const textElement = incomingMessageDiv.querySelector(".text");

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        role: "user",
                        parts: [{ text: userMessage }]
                    }]
                })
            });

            const data = await response.json();

            if(!response.ok) throw new Error(data.error.message);

            const apiResponse = data?.candidates[0]?.content?.parts[0]?.text.replace(/\*\*(.*?)\*\*/g, '$1');
            let fullResponse;
            if (!introductionMade) {
                fullResponse = "I am AIRA, your AI assistant. " + (apiResponse || "No response from API");
                introductionMade = true;
            } else {
                fullResponse = apiResponse || "No response from API";
            }

            fullResponse = (fullResponse);
            showTypingEffect(fullResponse, textElement);
        } catch (error) {
            console.log(error);
            textElement.innerText = "Error in fetching response";
        } finally {
            incomingMessageDiv.classList.remove("loading");
        }
    };

    const showLoadAnimation = (userMessage) => {
        const html = `
            <div class="message-content">
                <img src="assets/aira.jpg" alt="Gemini Image" class="avatar">
                <p class="text"></p>
                <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                </div>
            </div>
            <span onclick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;

        const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
        chatList.appendChild(incomingMessageDiv);
        chatList.scrollTo(0, chatList.scrollHeight);

        if (userMessage.toLowerCase() === "who is your developer?") {
            // Direct response for the specific question
            const developerResponse = "Dinesh A/L Ravindra Singh";
            showTypingEffect(developerResponse, incomingMessageDiv.querySelector(".text"));
            incomingMessageDiv.classList.remove("loading");
        } else {
            generateAPIResponse(userMessage, incomingMessageDiv);
        }
    };

    window.copyMessage = (copyIcon) => {
        const messageText = copyIcon.parentElement.querySelector(".text").innerText;
        navigator.clipboard.writeText(messageText).then(() => {
            copyIcon.innerText = "done";
            setTimeout(() => {
                copyIcon.innerText = "content_copy";
            }, 1000);
        }).catch((err) => {
            console.error('Could not copy text: ', err);
        });
    };

    if (typingForm) {
        const handleOutgoingChat = (userMessage) => {
            if (!userMessage) return; // exit if there is no message from user

            const html = `
                <div class="message-content">
                    <img src="assets/user.jpg" alt="User Image" class="avatar">
                    <p class="text"></p>
                </div>`;

            const outgoingMessageDiv = createMessageElement(html, "outgoing");
            outgoingMessageDiv.querySelector(".text").innerText = userMessage;
            chatList.appendChild(outgoingMessageDiv); // Append the new message to the chat list

            // Clear the input field after sending the message
            typingForm.querySelector(".typing-input").value = "";
            chatList.scrollTo(0, chatList.scrollHeight);
            document.body.classList.add("hide-header");
            setTimeout(() => showLoadAnimation(userMessage), 500);
        };

        suggestionElements.forEach(suggestion => {
            suggestion.addEventListener("click", () => {
                const userMessage = suggestion.querySelector(".text").innerText;
                handleOutgoingChat(userMessage);
            });
        });

        toggleThemeButton.addEventListener("click", () => {
            const isLightMode = document.body.classList.toggle("light_mode");
            localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
            toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
        });

        deleteChatButton.addEventListener("click", () => {
            if (confirm("Are you sure you want to delete all messages?")) {
                localStorage.removeItem("savedChats");
                loadLocalstorageData();
            }
        });

        typingForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const userMessage = typingForm.querySelector(".typing-input").value.trim();
            handleOutgoingChat(userMessage);
        });
    }
});
