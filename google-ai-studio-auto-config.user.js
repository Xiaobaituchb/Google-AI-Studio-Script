// ==UserScript==
// @name         Google AI Studio - Ultimate Auto-Configuration (v7.3)
// @namespace    http://tampermonkey.net/
// @version      7.3
// @description  Auto-configures AI Studio settings with robust polling and a persistence double-check using integrated logic.
// @author       Your Name
// @match        https://aistudio.google.com/prompts/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // =================================================================
    //  CENTRALIZED CONFIGURATION & SELECTORS
    // =================================================================
    const CONSTANTS = {
        // --- User Settings ---
        SETTINGS: {
            temperature: "1",
            mediaResolution: "High", // Case sensitive based on UI option text
            thinkingLevel: "High",   // Case sensitive
            toggles: {
                codeExecution: true,
                googleSearch: true, // Grounding
                urlContext: true
            },
            systemInstructions: `## System Profile

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
[6]: https://www.thesaurus.com/e/grammar/whycapitali/`
        },

        // --- UI Identifiers (Selectors & Labels) ---
        SELECTORS: {
            // Main Navigation
            newChatLink: 'a[href="/prompts/new_chat"]',
            runSettingsTrigger: 'button[aria-label*="run setting" i]',
            runSettingsPanel: 'ms-run-settings',

            // System Instructions
            sysInstButton: 'button[data-test-system-instructions-card]',
            sysInstSubtitle: '.system-instructions-card .subtitle',
            sysInstDefaultTextFragment: "style instructions",
            sysInstTextArea: 'textarea[aria-label*="instruction" i]',
            closePanelButton: 'button[aria-label*="Close panel" i]',

            // Inputs
            temperatureInput: 'input.slider-number-input',
            promptInput: 'textarea, [contenteditable="true"]',

            // Dropdowns (Aria Labels)
            dropdownMedia: "Media resolution",
            dropdownThinking: "Thinking Level",

            // Toggles (Aria Labels)
            toggleCode: "Code execution",
            toggleSearch: "Grounding with Google Search",
            toggleUrl: "Browse the url context"
        }
    };

    // =================================================================
    //  WAIT STRATEGIES
    // =================================================================

    async function waitForElement(selector, root = document, maxAttempts = 500, interval = 10) {
        for (let i = 0; i < maxAttempts; i++) {
            const element = root.querySelector(selector);
            if (element) return element;
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        return null;
    }

    async function waitForElementToDisappear(selector, maxAttempts = 500, interval = 10) {
        for (let i = 0; i < maxAttempts; i++) {
            if (!document.querySelector(selector)) return true;
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        console.warn(`[AutoConfig] Element "${selector}" did not disappear.`);
        return false;
    }

    async function waitForTextContent(selector, textFragment, maxAttempts = 500, interval = 20) {
        for (let i = 0; i < maxAttempts; i++) {
            const el = document.querySelector(selector);
            if (el && el.textContent.includes(textFragment)) return true;
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        console.warn(`[AutoConfig] Text "${textFragment}" not found in "${selector}".`);
        return false;
    }

    // =================================================================
    //  ACTION FUNCTIONS
    // =================================================================

    async function ensureSettingsPanelOpen() {
        const closeBtn = document.querySelector(`${CONSTANTS.SELECTORS.runSettingsPanel} button[aria-label*="Close"]`);
        if (closeBtn && closeBtn.offsetParent !== null) return;

        const trigger = await waitForElement(CONSTANTS.SELECTORS.runSettingsTrigger);
        if (trigger) {
            trigger.click();
            await waitForElement(CONSTANTS.SELECTORS.runSettingsPanel);
        }
    }

    async function setNumericInput(selectorClass, value) {
        const input = await waitForElement(selectorClass);
        if (input) {
            if (input.value === value) return;
            input.value = value;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    async function setToggle(ariaLabel, desiredState) {
        const selector = `${CONSTANTS.SELECTORS.runSettingsPanel} button[role="switch"][aria-label*="${ariaLabel}" i]`;
        const toggleBtn = await waitForElement(selector);

        if (!toggleBtn) return;

        const isChecked = toggleBtn.getAttribute('aria-checked') === 'true';
        if (isChecked !== desiredState) {
            toggleBtn.click();
            let attempts = 0;
            while (toggleBtn.getAttribute('aria-checked') === String(isChecked) && attempts < 20) {
                await new Promise(r => setTimeout(r, 50));
                attempts++;
            }
        }
    }

    async function setDropdown(ariaLabel, desiredText) {
        const selector = `mat-select[aria-label*="${ariaLabel}" i]`;
        const selectTrigger = await waitForElement(selector);

        if (!selectTrigger) return;

        const valueText = selectTrigger.querySelector('.mat-mdc-select-value-text');
        if (valueText && valueText.textContent.trim().includes(desiredText)) return;

        selectTrigger.click();

        const optionSelector = 'mat-option';
        const firstOption = await waitForElement(optionSelector);

        if (firstOption) {
            const options = document.querySelectorAll(optionSelector);
            for (const option of options) {
                if (option.textContent.trim() === desiredText) {
                    option.click();
                    await waitForElementToDisappear(optionSelector);
                    return;
                }
            }
            document.body.click(); // Close if not found
            await waitForElementToDisappear(optionSelector);
        }
    }

    async function setSystemInstructions() {
        const sysBtn = await waitForElement(CONSTANTS.SELECTORS.sysInstButton);
        if (!sysBtn) return;

        sysBtn.click();

        const txtArea = await waitForElement(CONSTANTS.SELECTORS.sysInstTextArea);
        if (txtArea) {
            if (txtArea.value !== CONSTANTS.SETTINGS.systemInstructions) {
                txtArea.value = CONSTANTS.SETTINGS.systemInstructions;
                txtArea.dispatchEvent(new Event('input', { bubbles: true }));
                txtArea.dispatchEvent(new Event('change', { bubbles: true }));
            }

            const closeBtn = await waitForElement(CONSTANTS.SELECTORS.closePanelButton);
            if (closeBtn) {
                closeBtn.click();
                await waitForElementToDisappear(CONSTANTS.SELECTORS.sysInstTextArea);
            }
        }
    }

    /**
     * Consolidates the logic for the Right Side "Run Settings" Panel.
     * This function is safe to call repeatedly; checks inside helpers prevent redundant clicks.
     */
    async function enforceRunSettings() {
        await ensureSettingsPanelOpen();
        await setNumericInput(CONSTANTS.SELECTORS.temperatureInput, CONSTANTS.SETTINGS.temperature);
        await setDropdown(CONSTANTS.SELECTORS.dropdownMedia, CONSTANTS.SETTINGS.mediaResolution);
        await setDropdown(CONSTANTS.SELECTORS.dropdownThinking, CONSTANTS.SETTINGS.thinkingLevel);

        if (CONSTANTS.SETTINGS.toggles.codeExecution) await setToggle(CONSTANTS.SELECTORS.toggleCode, true);
        if (CONSTANTS.SETTINGS.toggles.googleSearch) await setToggle(CONSTANTS.SELECTORS.toggleSearch, true);
        if (CONSTANTS.SETTINGS.toggles.urlContext) await setToggle(CONSTANTS.SELECTORS.toggleUrl, true);
    }

    // =================================================================
    //  MAIN APPLICATION LOGIC
    // =================================================================

    async function applyAllSettings() {
        console.log("[AutoConfig] Starting Configuration Sequence...");

        // 1. System Instructions (Done once initially as it involves a modal)
        await setSystemInstructions();

        // 2. Run Settings Loop (Initial pass + Double check)
        const promptInput = await waitForElement(CONSTANTS.SELECTORS.promptInput);
        const doubleCheckDuration = 3000; // 3 seconds
        const endTime = Date.now() + doubleCheckDuration;

        do {
            // A. Apply/Enforce settings
            await enforceRunSettings();

            // B. Ensure focus remains on input
            if (promptInput && document.activeElement !== promptInput) {
                promptInput.focus();
            }

            // C. Wait before next check, unless time is up
            if (Date.now() < endTime) {
                await new Promise(r => setTimeout(r, 500));
            }

        // Loop continues until time expires OR if the prompt input disappears (navigated away)
        } while (Date.now() < endTime && document.querySelector(CONSTANTS.SELECTORS.promptInput));

        console.log("[AutoConfig] Configuration & Double-check finished.");
    }

    // =================================================================
    //  EVENT LISTENERS & INIT
    // =================================================================

    document.addEventListener('keydown', async function(e) {
        if (e.ctrlKey && e.altKey && e.key === 'n') {
            e.preventDefault();
            console.log("[AutoConfig] Hotkey (Ctrl+Alt+N) detected.");

            const chatLink = document.querySelector(CONSTANTS.SELECTORS.newChatLink);
            if (chatLink) {
                chatLink.click();

                console.log("[AutoConfig] Waiting for new chat to initialize...");
                // Wait for the System Instructions subtitle to contain default text
                const resetConfirmed = await waitForTextContent(
                    CONSTANTS.SELECTORS.sysInstSubtitle,
                    CONSTANTS.SELECTORS.sysInstDefaultTextFragment
                );

                if (resetConfirmed) {
                    console.log("[AutoConfig] New chat detected. Configuring...");
                    await applyAllSettings();
                } else {
                    console.error("[AutoConfig] Timeout waiting for chat reset.");
                }
            }
        }
    });

    (async function() {
        const btn = await waitForElement(CONSTANTS.SELECTORS.runSettingsTrigger, document, 500);
        if (btn) {
            console.log("[AutoConfig] Page loaded. Initial configuration.");
            await applyAllSettings();
        }
    })();

})();
