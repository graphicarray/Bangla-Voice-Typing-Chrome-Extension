'use strict';

const API = 'https://generativelanguage.googleapis.com/v1beta';
const $ = (id) => document.getElementById(id);
const DEFAULTS = { apiKey: '', model: '', keepEn: false, bnDigits: true, showBtn: true, last: '' };
let cfg = { ...DEFAULTS };

function setStatus(text, cls = '') {
  $('status').textContent = text;
  $('status').className = cls;
}
const save = (patch) => { Object.assign(cfg, patch); return chrome.storage.local.set(patch); };

// Prefer a stable (non-preview) full-size flash model.
function pickDefault(ids) {
  const bad = /lite|image|tts|live|audio|embed|robot|computer|8b|thinking|learnlm|gemma|aqa|imagen|veo/i;
  const pre = (id) => (/preview|exp/i.test(id) ? 1 : 0);
  const flash = ids
    .filter((id) => /gemini/i.test(id) && /flash/i.test(id) && !bad.test(id))
    .sort((a, b) => pre(a) - pre(b) || b.localeCompare(a, 'en', { numeric: true }));
  return flash[0] || ids.find((id) => /gemini/i.test(id)) || ids[0] || '';
}

async function loadModels() {
  if (!cfg.apiKey) return setStatus('Add your API key first', 'err');
  setStatus('Loading models…');
  try {
    let all = [], token = '';
    do {
      const url = `${API}/models?pageSize=1000${token ? '&pageToken=' + encodeURIComponent(token) : ''}`;
      const r = await fetch(url, { headers: { 'x-goog-api-key': cfg.apiKey } });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error?.message || r.statusText);
      all = all.concat(j.models || []);
      token = j.nextPageToken || '';
    } while (token);

    const list = all
      .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map((m) => ({ id: m.name.replace(/^models\//, ''), label: m.displayName || m.name }))
      .sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
    if (!list.length) throw new Error('No models found for this key');

    const sel = $('model');
    sel.textContent = '';
    for (const m of list) sel.add(new Option(`${m.label} (${m.id})`, m.id));
    const ids = list.map((m) => m.id);
    sel.value = ids.includes(cfg.model) ? cfg.model : pickDefault(ids);
    await save({ model: sel.value });
    setStatus(`${list.length} models loaded`, 'ok');
  } catch (e) {
    setStatus('Could not load models: ' + e.message, 'err');
  }
}

$('saveKey').addEventListener('click', async () => {
  await save({ apiKey: $('apiKey').value.trim() });
  loadModels();
});
$('model').addEventListener('change', (e) => save({ model: e.target.value }));
for (const k of ['keepEn', 'bnDigits', 'showBtn']) {
  $(k).addEventListener('change', (e) => save({ [k]: e.target.checked }));
}
$('grant').addEventListener('click', () => chrome.tabs.create({ url: chrome.runtime.getURL('permission.html') }));
$('copy').addEventListener('click', async () => {
  await navigator.clipboard.writeText($('last').value);
  setStatus('Copied', 'ok');
});

(async () => {
  cfg = { ...DEFAULTS, ...(await chrome.storage.local.get(Object.keys(DEFAULTS))) };
  $('apiKey').value = cfg.apiKey;
  $('keepEn').checked = cfg.keepEn;
  $('bnDigits').checked = cfg.bnDigits;
  $('showBtn').checked = cfg.showBtn;
  $('last').value = cfg.last;
  if (cfg.model) $('model').add(new Option(cfg.model, cfg.model));
  if (cfg.apiKey) loadModels();
})();
