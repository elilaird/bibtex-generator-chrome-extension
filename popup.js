document.addEventListener("DOMContentLoaded", function () {
    const apiKeyInput = document.getElementById("apiKey");
    const paperTitleInput = document.getElementById("paperTitle");
    const saveButton = document.getElementById("saveButton");
    const generateButton = document.getElementById("generateButton");
    const changeApiKeyButton = document.getElementById("changeApiKeyButton");
    const apiKeySection = document.getElementById("apiKeySection");
    const generatorSection = document.getElementById("generatorSection");
    const statusDiv = document.getElementById("status");
    const resultDiv = document.getElementById("result");
    const instructionsDiv = document.getElementById("instructions");

    function updateStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = type;
    }

    function showInstructions() {
        instructionsDiv.style.display = "block";
    }

    function showApiKeySection() {
        apiKeySection.style.display = "block";
        generatorSection.style.display = "none";
    }

    function showGeneratorSection() {
        apiKeySection.style.display = "none";
        generatorSection.style.display = "block";
    }

    // Load existing API key
    chrome.storage.local.get("apiKey", (result) => {
        if (result.apiKey) {
            showGeneratorSection();
            updateStatus(
                "API key loaded. You can generate BibTeX citations.",
                "info"
            );
            showInstructions();
        } else {
            showApiKeySection();
        }
    });

    saveButton.addEventListener("click", () => {
        const apiKey = apiKeyInput.value.trim();

        if (!apiKey) {
            updateStatus("Please enter an API key", "error");
            return;
        }

        chrome.storage.local.set({ apiKey: apiKey }, () => {
            if (chrome.runtime.lastError) {
                console.error(
                    "Error saving API key:",
                    chrome.runtime.lastError
                );
                updateStatus(
                    "Error saving API key: " + chrome.runtime.lastError.message,
                    "error"
                );
            } else {
                console.log("API key saved successfully");
                updateStatus("API key saved successfully!", "success");
                showGeneratorSection();
                showInstructions();
            }
        });
    });

    generateButton.addEventListener("click", () => {
        const paperTitle = paperTitleInput.value.trim();
        if (!paperTitle) {
            updateStatus("Please enter a paper title", "error");
            return;
        }

        updateStatus("Generating BibTeX...", "info");

        chrome.runtime.sendMessage(
            { action: "generateBibTeX", paperTitle: paperTitle },
            (response) => {
                if (response.success) {
                    resultDiv.textContent = response.bibTeX;
                    updateStatus("BibTeX generated successfully!", "success");
                    navigator.clipboard
                        .writeText(response.bibTeX)
                        .then(() =>
                            updateStatus(
                                "BibTeX copied to clipboard!",
                                "success"
                            )
                        )
                        .catch((err) =>
                            console.error("Failed to copy to clipboard:", err)
                        );
                } else {
                    updateStatus(
                        "Error generating BibTeX: " + response.error,
                        "error"
                    );
                }
            }
        );
    });

    changeApiKeyButton.addEventListener("click", () => {
        apiKeyInput.value = "";
        showApiKeySection();
    });
});
