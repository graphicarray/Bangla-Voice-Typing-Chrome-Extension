<div align="center">

<img src="extension/brand/logo.svg" width="96" alt="Bangla Voice Typing logo">

# Bangla Voice Typing

**Speak Bangla. Get clean, punctuated Bangla text typed straight into any text box.**

A Chrome extension powered by Google's Gemini API, with automatic punctuation, Bangla digits, and filler-word removal.

[![License: MIT](https://img.shields.io/badge/License-MIT-00CDFF.svg)](LICENSE)
![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-0083FF)
![Version](https://img.shields.io/badge/version-2.1.0-062847)
![Dependencies](https://img.shields.io/badge/dependencies-none-3DD68C)

</div>

---

## Features

- **Voice to Bangla text anywhere.** Works in any text box, textarea, or editable field, including Gmail, social media, and chat apps.
- **Hold-to-talk shortcut.** Hold `Alt + C`, speak, release. The text is typed for you.
- **Floating mic button.** Prefer clicking? Use the round button on the page. Click to start, click again to stop.
- **Clean output, not raw transcripts.** Adds punctuation (including the Bangla দাঁড়ি `।`), removes fillers (আ, উম, হুম), stutters, and false starts.
- **Spoken punctuation commands.** Say *দাঁড়ি*, *কমা*, *প্রশ্নচিহ্ন*, *নতুন লাইন*, or *নতুন অনুচ্ছেদ* to insert the symbol.
- **Bangla digits.** Numbers, dates, prices, and times come out as ১২৫ টাকা, ২০২৬ সাল (can be switched to 0-9).
- **English words your way.** Write them in Bangla script (ফেসবুক, জিমেইল) or keep them in English (Facebook, Gmail).
- **Quiet-voice boost.** Audio is normalized before sending, so softer voices are still understood.
- **Google Docs support.** Types through Docs' hidden input frame.
- **Private by design.** No server of ours, no analytics, no account. See [PRIVACY.md](PRIVACY.md).

## Requirements

- Google Chrome or any Chromium browser that supports Manifest V3 (Edge, Brave, etc.)
- A free [Google AI Studio API key](https://aistudio.google.com/apikey)

## Install

The extension is not on the Chrome Web Store yet, so you load it as an unpacked extension.

1. **Download** this repo: click **Code → Download ZIP** and unzip it, or run:
   ```bash
   git clone https://github.com/YOUR_USERNAME/bangla-voice-typing.git
   ```
2. Open `chrome://extensions` and turn on **Developer mode** (top right).
3. Click **Load unpacked** and select the **`extension/`** folder.
4. Pin the extension and click its icon.
5. Paste your Google AI Studio API key, click **Save & load models**, and pick a model.
6. Click **Grant microphone access** once and choose **Allow**.

## Usage

| Action | How |
| --- | --- |
| Dictate with the keyboard | Click a text box, **hold `Alt + C`**, speak, release |
| Dictate with the mouse | Click a text box, click the round mic button, speak, click again |
| Get text if no box is focused | Open the popup and check **Last transcript**, then click **Copy** |

> **Mac:** `Alt` is the `Option` key.

### Popup options

| Option | What it does |
| --- | --- |
| Bangla digits (১২৩) | Writes numbers in Bangla digits instead of 0-9 |
| Keep English words in English | Leaves English words, names, and brands in Latin letters |
| Show mic button on pages | Shows or hides the floating mic button |

## Notes and limitations

- **Maximum recording length is 7 minutes.** This keeps the audio within Gemini's inline upload limit.
- **Google Docs:** reload the Docs tab once after installing or updating the extension.
- **Restricted pages:** Chrome blocks extensions on `chrome://` pages and the Chrome Web Store, so dictation will not work there.
- **Accuracy depends on the model you choose.** Transcription is done by Gemini, not on-device. Try a different model from the popup if results are not good enough.
- **Internet required.** Audio is sent to Google for transcription.
- **API usage and quotas** are governed by your own Google AI Studio account.

## Customize

**Change the hold-to-talk key.** Edit the `isHold` function at the top of [`extension/content.js`](extension/content.js), then reload the extension from `chrome://extensions`:

```js
const isHold = (e) =>
  e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.code === 'KeyC';
```

**Change how text is written.** The transcription rules (punctuation, spelling, digits, English handling) live in `buildPrompt()` in [`extension/offscreen.js`](extension/offscreen.js).

## How it works

```
 Alt+C / mic button          content.js            (every page and frame)
          │
          ▼
    background.js     service worker: coordinates recording, inserts text
          │
          ▼
    offscreen.js      records the mic, converts to 16 kHz WAV,
          │           sends it to the Gemini API with a Bangla prompt
          ▼
   Gemini API  ──►  clean Bangla text  ──►  typed into the focused field
```

| File | Role |
| --- | --- |
| `manifest.json` | Manifest V3 configuration and permissions |
| `background.js` | Service worker: action queue, offscreen document, text insertion |
| `offscreen.js` / `.html` | Microphone capture, audio conversion, Gemini request |
| `content.js` | Hold-to-talk key handling and the floating mic button |
| `popup.*` | API key, model picker, options, last transcript |
| `permission.*` | One-time microphone permission page |

## Privacy

Your audio is sent to Google's Gemini API for transcription and nowhere else. Your API key is stored locally in your browser. The extension has no analytics and no server of its own. Read the full details in [PRIVACY.md](PRIVACY.md).

## Contributing

Bug reports, ideas, and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Released under the [MIT License](LICENSE).

## Author

Made by **[Numan Ahmed](https://www.linkedin.com/in/graphicarray)** · Graphicarray
