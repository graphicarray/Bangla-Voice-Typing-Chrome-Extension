const off = (m) => chrome.runtime.sendMessage({ target: 'offscreen', ...m });
const ui = (tabId, state, msg = '') =>
  chrome.tabs.sendMessage(tabId, { type: 'ui', state, msg }, { frameId: 0 }).catch(() => {});

// Actions run one at a time, so a quick press-release can't race.
let q = Promise.resolve();
const queue = (kind, tabId) => (q = q.then(() => act(kind, tabId)).catch(() => {}));

async function ensureOffscreen() {
  if (await chrome.offscreen.hasDocument()) return;
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['USER_MEDIA'],
    justification: 'Record voice for dictation',
  });
}

async function act(kind, tabId) {
  await ensureOffscreen();
  const { recording } = await off({ type: 'status' });
  if ((kind === 'start' && recording) || (kind === 'stop' && !recording)) return;
  return recording ? finish() : begin(tabId);
}

async function begin(tabId) {
  const { apiKey, model } = await chrome.storage.local.get(['apiKey', 'model']);
  if (!apiKey || !model) return ui(tabId, 'idle', 'Open the extension popup and add your API key + model');
  const r = await off({ type: 'start' });
  if (r.error) {
    chrome.tabs.create({ url: chrome.runtime.getURL('permission.html') });
    return ui(tabId, 'idle', 'Allow the microphone in the new tab, then try again');
  }
  await chrome.storage.session.set({ tabId });
  ui(tabId, 'rec');
}

async function finish() {
  const { tabId } = await chrome.storage.session.get('tabId');
  ui(tabId, 'busy');
  const cfg = await chrome.storage.local.get(['apiKey', 'model', 'keepEn', 'bnDigits']);
  const r = await off({ type: 'stop', cfg });
  if (r.error) return ui(tabId, 'idle', r.error);
  await chrome.storage.local.set({ last: r.text });
  const ok = await insert(tabId, r.text + ' ');
  ui(tabId, 'idle', ok ? 'Inserted' : 'No text box focused. Text saved in the popup.');
}

// Runs inside the page (all frames). Must be self-contained.
function injectText(text) {
  let el = document.activeElement;
  while (el && el.shadowRoot && el.shadowRoot.activeElement) el = el.shadowRoot.activeElement;
  if (!el) return false;
  const isField =
    el.tagName === 'TEXTAREA' ||
    (el.tagName === 'INPUT' && /^(text|search|url|email|tel|)$/i.test(el.type));
  if (!isField && !el.isContentEditable) return false;
  el.focus();
  if (document.execCommand('insertText', false, text)) return true;
  if (isField) {
    el.setRangeText(text, el.selectionStart, el.selectionEnd, 'end');
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
    return true;
  }
  return false;
}

async function insert(tabId, text) {
  try {
    const res = await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      func: injectText,
      args: [text],
    });
    return res.some((r) => r.result === true);
  } catch {
    return false; // chrome:// pages, Web Store, etc.
  }
}

chrome.runtime.onMessage.addListener((m, sender) => {
  if (m.target) return; // meant for offscreen
  if (m.type === 'autostop') queue('stop');
  else if (sender.tab && ['start', 'stop', 'toggle'].includes(m.type)) queue(m.type, sender.tab.id);
});
