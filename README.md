# Google AI Studio - Ultimate Auto-Configuration

A userscript for [Google AI Studio](https://aistudio.google.com/) that automates the setup of system instructions, model parameters, and tool settings. It ensures your preferred environment is ready immediately upon loading the page or creating a new chat.

## 🚀 Features

*   **Auto-Injected System Instructions**: Automatically fills the "System Instructions" field with your predefined profile (OS, Hardware, Shell) and formatting standards (MathJax, Code blocks).
*   **Run Settings Automation**:
    *   **Temperature**: Sets to `1`.
    *   **Thinking Level**: Sets to `High`.
    *   **Media Resolution**: Sets to `High`.
*   **Tool Toggles**: Automatically enables:
    *   Code Execution
    *   Grounding with Google Search
    *   URL Context Browsing
*   **Robust Persistence**: Uses a "double-check" polling logic to ensure settings stick even if the UI lags during load.
*   **Quick Reset Hotkey**: Press **`Ctrl + Alt + N`** to start a new chat and immediately re-apply all configurations.

## 🛠️ Installation

1.  Install a userscript manager like **[Tampermonkey](https://www.tampermonkey.net/)** or **Violentmonkey**.
2.  Create a new script.
3.  Copy and paste the code from `script.js` into the editor.
4.  Save the script.
5.  Navigate to [Google AI Studio](https://aistudio.google.com/prompts/new_chat) to see it in action.

## ⚙️ Configuration

You can customize the default settings by editing the `CONSTANTS` object at the top of the script:

```javascript
const CONSTANTS = {
    SETTINGS: {
        temperature: "1",       // Value between 0 and 2
        mediaResolution: "High",
        thinkingLevel: "High",
        toggles: {
            codeExecution: true,
            googleSearch: true,
            urlContext: true
        },
        // Edit your system prompt here
        systemInstructions: `## System Profile...`
    }
    // ...
};
