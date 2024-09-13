const model = "llama-3.1-sonar-small-128k-online";

chrome.runtime.onInstalled.addListener(() => {
    createContextMenu();
});

function createContextMenu() {
    chrome.contextMenus.remove("generateBibTeX", () => {
        if (chrome.runtime.lastError) {
            console.log("Context menu item does not exist, creating it now.");
        }

        chrome.contextMenus.create(
            {
                id: "generateBibTeX",
                title: "Generate BibTeX citation",
                contexts: ["selection"],
            },
            () => {
                if (chrome.runtime.lastError) {
                    console.error(
                        "Error creating context menu:",
                        chrome.runtime.lastError
                    );
                } else {
                    console.log("Context menu created successfully");
                }
            }
        );
    });
}
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "generateBibTeX") {
        const paperTitle = info.selectionText;
        generateBibTeX(paperTitle)
            .then((bibTeX) => {
                console.log("BibTeX generated:", bibTeX);
            })
            .catch((error) => {
                console.error("Error generating BibTeX:", error);
            });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "generateBibTeX") {
        generateBibTeX(request.paperTitle)
            .then((bibTeX) => sendResponse({ success: true, bibTeX: bibTeX }))
            .catch((error) =>
                sendResponse({ success: false, error: error.message })
            );
        return true; // Indicates we will send a response asynchronously
    }
});

async function generateBibTeX(paperTitle) {
    const apiKey = await getAPIKey();
    if (!apiKey) {
        throw new Error(
            "Please set your Perplexity AI API key in the extension popup."
        );
    }

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: model,
            messages: [
                {
                    role: "system",
                    content:
                        "You will generate a bibtex citation for a paper. Only include the bibtex citation and no other text in your response.",
                    role: "user",
                    content: `[You will generate a bibtex citation for a paper. Only include the bibtex citation and no other text in your response.] Generate a bibtex citation for the paper: "${paperTitle}"`,
                },
            ],
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            `API request failed with status ${response.status}. Error: ${errorText}`
        );
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

async function getAPIKey() {
    return new Promise((resolve) => {
        chrome.storage.local.get("apiKey", (result) => {
            console.log(
                "Fetched API key:",
                result.apiKey ? "API key exists" : "No API key found"
            );
            resolve(result.apiKey);
        });
    });
}