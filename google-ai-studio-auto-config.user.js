// ==UserScript==
// @name         Google AI Studio - Auto & Hotkey Settings Configuration (v6.0 - Robust Toggles)
// @namespace    http://tampermonkey.net/
// @version      6.0
// @description  Automatically configure AI Studio settings. Includes robust toggle logic with verification and event simulation to ensure settings actually stick.
// @author       Your Name
// @match        https://aistudio.google.com/prompts/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // --- HELPER FUNCTIONS ---

    async function waitForElement(selector, maxAttempts = 3000, interval = 5) {
        for (let i = 0; i < maxAttempts; i++) {
            const element = document.querySelector(selector);
            if (element) return element;
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        console.error(`[waitForElement] Element "${selector}" not found.`);
        return null;
    }

    async function waitForElementToDisappear(selector, maxAttempts = 3000, interval = 5) {
        for (let i = 0; i < maxAttempts; i++) {
            if (!document.querySelector(selector)) return true;
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        return false;
    }

    function findElementByText(text) {
        const lowerCaseText = text.toLowerCase();
        const xpath = `//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${lowerCaseText}')]`;
        return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }

    function findSliderNearText(text) {
        const textElement = findElementByText(text);
        if (!textElement) return null;
        let container = textElement.parentElement;
        for (let i = 0; i < 5 && container; i++) {
            const sliderInput = container.querySelector('input[type="range"]');
            if (sliderInput) return sliderInput;
            container = container.parentElement;
        }
        return null;
    }

    /**
     * Robustly ensures a toggle is turned ON.
     * Checks state, clicks, waits, verifies, and retries with events if needed.
     */
    async function ensureToggleOn(selector, name) {
        const btn = document.querySelector(selector);
        if (!btn) {
            console.warn(`[${name}] Button not found with selector: ${selector}`);
            return;
        }

        // Check initial state
        // aria-checked can be "true", "false", or "mixed". We want "true".
        let isChecked = btn.getAttribute('aria-checked') === 'true';
        console.log(`[${name}] Initial state: ${isChecked} (Attribute: ${btn.getAttribute('aria-checked')})`);

        if (isChecked) {
            console.log(`[${name}] Already ON. Skipping.`);
            return;
        }

        console.log(`[${name}] Attempting to turn ON...`);

        // Attempt 1: Standard Click
        btn.click();
        await new Promise(r => setTimeout(r, 500)); // Wait for UI update

        // Verify
        let newState = document.querySelector(selector).getAttribute('aria-checked') === 'true';

        if (!newState) {
            console.warn(`[${name}] Standard click failed. Retrying with MouseEvent...`);

            // Attempt 2: Dispatch MouseEvent (often bypasses framework limitations)
            const clickEvent = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
            });
            btn.dispatchEvent(clickEvent);

            await new Promise(r => setTimeout(r, 500)); // Wait again

            // Final Verify
            newState = document.querySelector(selector).getAttribute('aria-checked') === 'true';
            if (newState) {
                console.log(`[${name}] Successfully turned ON via MouseEvent.`);
            } else {
                console.error(`[${name}] FAILED to turn ON after retries.`);
            }
        } else {
            console.log(`[${name}] Successfully turned ON.`);
        }
    }

    async function clickChatLink() {
        const chatLink = document.querySelector('a[href="/prompts/new_chat"]');
        if (chatLink) chatLink.click();
    }

    // --- MAIN CONFIGURATION ---

    async function configureAllSettings(type) {
        try {
            console.log(`Starting configuration (Trigger: ${type === 1 ? 'Page Load' : 'Hotkey'})...`);

            // Step 1: Ensure Panel is Open
            while (true) {
                await new Promise(r => setTimeout(r, 50));
                // Check for specific element inside the panel
                const subtitleXPath = "//span[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'style instructions')]";
                const subtitleElement = document.evaluate(subtitleXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

                if (type === 0 && subtitleElement) break;

                const groundingToggle = document.querySelector('button[aria-label*="Grounding with Google Search" i]');
                if (groundingToggle) {
                    if (type === 1) break;
                    else continue;
                }

                const runSettingsButton = document.querySelector('button[aria-label*="run setting" i]');
                if (runSettingsButton) runSettingsButton.click();
            }

            // Step 2: Configure Settings
            console.log("Configuring settings...");

            // // 1. Thinking Budget Toggle
            // await ensureToggleOn('button[aria-label*="thinking budget" i]', "Thinking Budget");

            // 2. System Instructions
            let sysBtn = document.querySelector('button[aria-label*="instruction" i]');
            if (sysBtn) {
                sysBtn.click();
                const txtArea = await waitForElement('textarea[aria-label*="instruction" i]');
                if (txtArea) {
                    const profile = `## System Profile

I am running on a **ThinkPad T14 Gen 2i** laptop. The following information describes my system setup. Always assume this system environment unless explicitly stated otherwise.

* **Operating System**: Ubuntu 24.04.3 LTS (Noble Numbat)
* **Desktop Environment**: GNOME 46.0
* **Display Server**: Wayland
* **Primary Editors**:
  - Vim in the terminal
  - VSCode with the Vim extension
* **Primary Web Browser**: Firefox
* **Hardware**:
  - **CPU**: 11th Gen Intel(R) Core(TM) i5-1145G7
  - **Graphics**: Intel Iris Xe Graphics
  - **RAM**: 32 GB
* **Custom Scripts Directory**: \`/home/h/script/\`
* **Default Shell**: \`/bin/bash\`

---

## Reply Standard

Your reply must strictly follow the specifications below:

* Double dollar signs used to create block formulas should be placed at the beginning of a line, without space or indentation before. For example, you should write
$$
a^2 + b^2 = c^2
$$
instead of
    $$
    a^2 + b^2 = c^2
    $$
.
* The main body of your reply related to math should satisfy the formatting standard of a well-regarded Mathematics Stack Exchange answer, with inline formulas surrounded by single dollar signs, and block formulas surrounded by double dollar signs.
* Never use single backticks to enclose mathematical formulas.
* The triple backticks that create fenced code blocks should be placed at the beginning of a line.
* Specify the language immediately after the opening triple backticks.
* There shouldn't be any characters after closing triple backticks in the same line.
* Never use four spaces to indent to avoid being rendered as a code block. Use Blockquotes instead.
* Don't fabricate anything that doesn't exist.
* Add clickable numbered reference tags to any statement that could be questioned, citing a source that substantiates it.
* Avoid long lines — break lengthy commands or code into shorter, readable segments.
* Don't use \`<br>\` because it can't be rendered properly sometimes.
* End each reply with a Table of Errors in Your Prompt, strictly following the format below, with the revision part in bold type.

---

### Table of Errors in Your Prompt

| **Before Revision** | **After Revision** | **Analysis** |
|----------------------|--------------------|---------------|
| My **computre** doesn’t **works**. | My **computer** doesn’t **work**. | "Computre" is a misspelling of "computer" [1] [2]. The auxiliary verb "does" agrees with the singular subject "computer", so the main verb "work" must be in its base form [3] [4]. |
| How can **i** solve it? | How can **I** solve it? | The pronoun "I" should always be capitalized [5] [6]. |
| Thanks. | *(No change)* | No errors found. |

[1]: https://en.wikipedia.org/wiki/Computer
[2]: https://www.oxfordlearnersdictionaries.com/us/definition/english/computer?q=computer
[3]: https://www.grammarly.com/blog/grammar/grammar-basics-what-is-subject-verb-agreement/
[4]: https://www.grammarly.com/blog/parts-of-speech/verbs-with-s/
[5]: https://www.grammarly.com/blog/punctuation-capitalization/capitalization-rules/
[6]: https://www.thesaurus.com/e/grammar/whycapitali/`;
                    txtArea.value = profile;
                    txtArea.dispatchEvent(new Event('input', { bubbles: true }));
                    txtArea.dispatchEvent(new Event('change', { bubbles: true }));

                    const closeBtn = document.querySelector('button[aria-label*="Close panel" i]');
                    if (closeBtn) {
                        closeBtn.click();
                        await waitForElementToDisappear('textarea[aria-label*="instruction" i]');
                    }
                }
            }

            // Re-open if closed by system instruction panel logic
            if (!document.querySelector('button[aria-label*="Grounding with Google Search" i]')) {
                 const runBtn = document.querySelector('button[aria-label*="run setting" i]');
                 if (runBtn) {
                     runBtn.click();
                     await waitForElement('button[aria-label*="Grounding with Google Search" i]');
                 }
            }

            // 3. Sliders
            const budgetSlider = findSliderNearText("Set thinking budget");
            if (budgetSlider) {
                budgetSlider.value = budgetSlider.max;
                budgetSlider.dispatchEvent(new Event('input', { bubbles: true }));
                budgetSlider.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            // // 4. URL Context Toggle (Robust)
            // await ensureToggleOn('button[aria-label*="browse the url context" i]', "URL Context");

            // // 5. Grounding Toggle (Robust)
            // await ensureToggleOn('button[aria-label*="Grounding with Google Search" i]', "Grounding");


            const tempSlider = findSliderNearText("Temperature");
            if (tempSlider) {
                tempSlider.value = 0;
                tempSlider.dispatchEvent(new Event('input', { bubbles: true }));
                tempSlider.dispatchEvent(new Event('change', { bubbles: true }));
            }

            console.log("Configuration Complete.");

            // Close Panel
            const runSettingsButton = document.querySelector('button[aria-label*="run setting" i]');
            if (runSettingsButton && document.querySelector('button[aria-label*="instruction" i]')) {
                runSettingsButton.click();
            }

            // Focus Input
            const promptInput = await waitForElement('textarea, [contenteditable="true"]');
            if (promptInput) promptInput.focus();

        } catch (error) {
            console.error("Config Error:", error);
        }
    }

    // --- TRIGGERS ---

    document.addEventListener('keydown', async function(e) {
        if (e.ctrlKey && e.altKey && e.key === 'n') {
            e.preventDefault();
            clickChatLink();
            configureAllSettings(0);
        }
    });

    (async function() {
        const runSettingsButton = await waitForElement('button[aria-label*="run setting" i]', 1500, 10);
        if (runSettingsButton) {
            configureAllSettings(1);
        }
    })();

})();