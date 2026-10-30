# Contributing

Thanks for helping improve Bangla Voice Typing! Contributions of all sizes are welcome: bug reports, prompt improvements for better Bangla accuracy, new features, and docs.

## Reporting bugs

Open an issue using the **Bug report** template. Please include your Chrome version, OS, the website where it failed, and the Gemini model you selected. **Never paste your API key** in an issue.

## Suggesting features

Open an issue using the **Feature request** template and describe the problem you want to solve.

## Running the extension locally

There is no build step. The extension is plain JavaScript.

1. Fork and clone the repo.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the `extension/` folder.
4. After editing a file, click the reload icon on the extension card. Reload any open tabs to pick up `content.js` changes.

Debugging tips:

- **Service worker logs:** `chrome://extensions` → *Inspect views: service worker*
- **Offscreen document:** `chrome://extensions` → *Inspect views: offscreen.html*
- **Popup:** right-click the popup → *Inspect*

## Pull requests

1. Create a branch from `main` (`feature/short-name` or `fix/short-name`).
2. Keep changes focused, one topic per PR.
3. Match the existing style: plain JS, no dependencies, 2-space indent, single quotes.
4. Test manually on at least a plain text box and one rich editor (e.g. Gmail). Test Google Docs if you touched text insertion.
5. Update `README.md` and `CHANGELOG.md` if behavior changes.
6. Open the PR and describe what changed and why.

## Guidelines

- Do not add analytics, tracking, or any network request other than the Gemini API.
- Do not add remote code. All code must ship inside the extension.
- Keep permissions minimal and explain any new one in `PRIVACY.md`.

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
