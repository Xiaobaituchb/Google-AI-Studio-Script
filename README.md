# Google AI Studio - Auto & Hotkey Settings Configuration

A robust Userscript (Tampermonkey/Violentmonkey) designed to automate the setup of the **Google AI Studio** environment. It automatically configures system instructions, model parameters, and UI states to ensure a consistent and efficient prompting workflow.

## 🚀 Features

*   **Automated System Instructions**: Automatically injects a detailed "System Profile" into the instructions panel.
    *   *Current Default:* Includes specific hardware details (ThinkPad T14, Ubuntu), strict mathematical formatting rules (LaTeX), and a mandatory "Table of Errors" for grammar checking.
*   **Model Parameter Tuning**:
    *   **Temperature**: Sets to `0` for deterministic outputs.
    *   **Thinking Budget**: Maximizes the slider for complex reasoning tasks.
*   **Workflow Automation**:
    *   Automatically opens and closes the "Run Settings" panel.
    *   Focuses the prompt input area immediately after configuration.
*   **Robust Toggles**: Uses advanced event simulation (MouseEvents) to ensure settings stick, bypassing UI framework limitations.
*   **Keyboard Shortcut**:
    *   `Ctrl` + `Alt` + `n`: Starts a **New Chat** and immediately applies all configuration settings.

## 🛠️ Installation

1.  Install a Userscript manager extension for your browser:
    *   [Tampermonkey](https://www.tampermonkey.net/) (Recommended)
    *   [Violentmonkey](https://violentmonkey.github.io/)
2.  Create a new script in your manager.
3.  Copy and paste the contents of `google-ai-studio-auto-config.user.js` into the editor.
4.  Save the script (`Ctrl` + `S`).
5.  Navigate to [Google AI Studio](https://aistudio.google.com/prompts/new_chat) to see it in action.

## ⚙️ Customization

The script comes pre-configured with a specific **System Profile** (lines 130-185). You will likely want to change this to suit your needs.

1.  Open the script in your Userscript manager editor.
2.  Locate the `const profile` variable inside the `configureAllSettings` function.
3.  Replace the text between the backticks (\`) with your preferred system instructions.

```javascript
// Example:
const profile = `You are a helpful coding assistant. Always use Python 3.10+.`;
```

### Enabling Optional Features
The script includes code for **Grounding (Google Search)** and **URL Context**, but they are currently commented out. To enable them:

1.  Search for `// await ensureToggleOn` in the code.
2.  Remove the `//` at the start of the line to uncomment the function call.

## ⌨️ Shortcuts

| Hotkey | Action |
| :--- | :--- |
| **Ctrl + Alt + n** | Navigates to a new chat (`/prompts/new_chat`) and triggers the auto-configuration sequence. |

## 🐛 Troubleshooting

*   **Element Not Found**: Google frequently updates the AI Studio DOM. If the script stops working, the `aria-label` or XPath selectors may need updating.
*   **Timing Issues**: If your internet connection is slow, you may need to increase the `maxAttempts` or `interval` in the `waitForElement` helper function.

## 📜 License

This project is licensed under the **MIT License**.
