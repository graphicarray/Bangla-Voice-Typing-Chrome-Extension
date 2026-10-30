# Privacy Policy

_Last updated: 30 October 2026 · Applies to Bangla Voice Typing v2.1.0_

Bangla Voice Typing is an open-source Chrome extension. It has no backend server, no analytics, no ads, and no user accounts.

## What data is handled

| Data | Where it goes | Why |
| --- | --- | --- |
| **Voice audio** | Sent to Google's Gemini API (`generativelanguage.googleapis.com`) | To transcribe your speech into Bangla text. Audio is recorded only while you hold `Alt + C` or have the mic button active. |
| **Google AI Studio API key** | Stored in `chrome.storage.local` in your browser. Sent only to Google's API in request headers. | To authenticate your requests to Gemini. |
| **Settings** (model, options) | Stored in `chrome.storage.local` | To remember your preferences. |
| **Last transcript** | Stored in `chrome.storage.local` | To show it in the popup if no text box was focused. |

## What we do not do

- We do not operate any server and do not receive your audio, text, or API key.
- We do not collect analytics, telemetry, or usage statistics.
- We do not read, store, or transmit the content of the web pages you visit. The content script only listens for the shortcut key, shows the mic button, and the extension inserts text into the field you have focused.
- We do not sell or share data.

## Third-party processing

Transcription is performed by Google's Gemini API using **your own API key**. How Google handles audio sent to the API, including retention and whether content may be used to improve their products, depends on your Google AI Studio plan and Google's terms. Please review the [Gemini API Additional Terms of Service](https://ai.google.dev/gemini-api/terms) before dictating sensitive information.

## Permissions explained

| Permission | Reason |
| --- | --- |
| `storage` | Save your API key, model, options, and last transcript locally |
| `scripting` | Insert the transcribed text into the focused field on the current page |
| `offscreen` | Record the microphone in a hidden document (required by Manifest V3) |
| `https://generativelanguage.googleapis.com/*` | Call the Gemini API |
| `<all_urls>` | Show the mic button, detect the shortcut key, and insert text on any site you choose to dictate into |

## Your control

- Remove your API key and settings at any time by removing the extension or clearing its storage.
- Revoke the API key from your [Google AI Studio account](https://aistudio.google.com/apikey).
- Revoke microphone access from Chrome's site settings.

## Contact

Questions or concerns? Open an issue in this repository or contact [Numan Ahmed on LinkedIn](https://www.linkedin.com/in/graphicarray).
