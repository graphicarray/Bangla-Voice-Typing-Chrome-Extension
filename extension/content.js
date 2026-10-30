(() => {
  // Hold Alt+C to record, release to type. Change here to use another combo.
  const isHold = (e) =>
    e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.code === 'KeyC';

  const send = (type) => {
    try { chrome.runtime.sendMessage({ type }).catch(() => {}); } catch { /* extension reloaded */ }
  };

  // Runs in every frame, including blank iframes (Google Docs types through one).
  let holding = false;
  let swallowAltUp = false; // stop Docs/Chrome from grabbing focus when Alt is let go
  const release = () => {
    if (holding) { holding = false; send('stop'); }
  };
  addEventListener('keydown', (e) => {
    if (!isHold(e)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    swallowAltUp = true;
    if (!holding) { holding = true; send('start'); }
  }, true);
  addEventListener('keyup', (e) => {
    const isKey = e.code === 'KeyC' || e.key === 'Alt';
    if (e.key === 'Alt' && swallowAltUp) {
      swallowAltUp = false;
      e.preventDefault();
      e.stopImmediatePropagation();
      release();
      return;
    }
    if (!holding || !isKey) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    release();
  }, true);
  addEventListener('blur', release);

  // Remember the last editable thing focused in this frame (Docs' hidden box lives here).
  let lastEditable = null;
  const editableOf = (n) => {
    while (n && n.shadowRoot && n.shadowRoot.activeElement) n = n.shadowRoot.activeElement;
    if (!n) return null;
    const field = n.tagName === 'TEXTAREA' ||
      (n.tagName === 'INPUT' && /^(text|search|url|email|tel|)$/i.test(n.type));
    return field || n.isContentEditable ? n : null;
  };
  addEventListener('focusin', (e) => {
    const t = editableOf(e.composedPath()[0]);
    if (t) lastEditable = t;
  }, true);

  function insertHere(text) {
    let el = editableOf(document.activeElement);
    if (!el && lastEditable && lastEditable.isConnected && document.hasFocus()) el = lastEditable;
    if (!el) return false;
    el.focus();
    const field = el.tagName === 'TEXTAREA' || el.tagName === 'INPUT';
    if (document.execCommand('insertText', false, text)) return true;
    if (field) {
      el.setRangeText(text, el.selectionStart, el.selectionEnd, 'end');
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
      return true;
    }
    try { // last try for editors that only listen to paste
      const dt = new DataTransfer();
      dt.setData('text/plain', text);
      const ev = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
      el.dispatchEvent(ev);
      return ev.defaultPrevented;
    } catch { return false; }
  }

  chrome.runtime.onMessage.addListener((m, _s, reply) => {
    if (m.type !== 'insert') return;
    reply(insertHere(m.text));
  });

  if (window !== top) return; // floating button lives in the top frame only

  // Built with DOM calls only: pages with Trusted Types (Google Docs) reject innerHTML.
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, props = {}, kids = []) => {
    const n = document.createElement(tag);
    Object.assign(n, props);
    n.append(...kids);
    return n;
  };
  const svg = (tag, attrs) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  };

  const CSS = `
    button{all:initial;box-sizing:border-box;width:48px;height:48px;border-radius:999px;cursor:pointer;
      display:grid;place-items:center;background:#062847;border:1px solid #0F4A7A;color:#00CDFF;
      transition:box-shadow .15s,background .15s}
    button:hover{box-shadow:0 0 18px #00CDFFAA}
    button:focus-visible{outline:1px solid #00CDFF;outline-offset:3px}
    svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
    button.rec{background:linear-gradient(135deg,#00CDFF,#0083FF);border-color:#00CDFF;color:#001E36;
      box-shadow:0 0 18px #00CDFFAA;animation:halo 1.1s infinite}
    button.rec rect{fill:currentColor}
    button.busy{border-color:#00CDFF;color:#8FA7BF;cursor:wait;animation:fade 1s infinite}
    @keyframes halo{0%{box-shadow:0 0 0 0 #00A9FF55,0 0 18px #00CDFFAA}100%{box-shadow:0 0 0 14px #00A9FF00,0 0 18px #00CDFFAA}}
    @keyframes fade{50%{opacity:.5}}
    .t{position:absolute;right:58px;bottom:8px;width:max-content;max-width:260px;display:none;
      font:600 13px/1.4 Inter,"Segoe UI",system-ui,Verdana,sans-serif;color:#00CDFF;background:#062847;
      border:1px solid #00CDFF;border-radius:999px;padding:6px 14px}`;

  const host = el('div');
  const root = host.attachShadow({ mode: 'closed' });
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(CSS);
    root.adoptedStyleSheets = [sheet];
  } catch {
    root.append(el('style', { textContent: CSS }));
  }
  for (const [k, v] of Object.entries({ all: 'initial', position: 'fixed', right: '20px', bottom: '20px', 'z-index': '2147483647' })) {
    host.style.setProperty(k, v, 'important');
  }

  const icon = svg('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' });
  icon.append(
    svg('rect', { x: 9, y: 3, width: 6, height: 11, rx: 3 }),
    svg('path', { d: 'M5 11a7 7 0 0 0 14 0M12 18v3' }),
  );
  const btn = el('button', { title: 'Bangla Voice Typing · or hold Alt + C', ariaLabel: 'Record' }, [icon]);
  const tip = el('div', { className: 't' });
  root.append(btn, tip);

  btn.addEventListener('mousedown', (e) => e.preventDefault()); // keep focus in the text box
  btn.addEventListener('click', () => send('toggle'));

  // Hidden by default. Shows only while recording / typing (then fades away),
  // unless the "always show click button" option is on.
  let always = false;
  const attach = () => {
    if (!host.isConnected) (document.body || document.documentElement).appendChild(host);
  };
  const detach = () => { if (!always) host.remove(); };

  let hide;
  chrome.runtime.onMessage.addListener((m) => {
    if (m.type !== 'ui') return;
    btn.className = m.state === 'idle' ? '' : m.state;
    const text = m.state === 'rec' ? 'Listening… release to type' : m.state === 'busy' ? 'Typing…' : m.msg;
    clearTimeout(hide);
    tip.style.display = text ? 'block' : 'none';
    tip.textContent = text;
    if (m.state !== 'idle') return attach();
    if (text) {
      attach();
      hide = setTimeout(() => { tip.style.display = 'none'; detach(); }, 3500);
    } else detach();
  });

  // Optional always-visible click button. Off by default.
  const apply = (v) => { always = !!v; always ? attach() : (btn.className === '' && tip.style.display !== 'block' && host.remove()); };
  chrome.storage.local.get({ clickBtn: false }).then((c) => apply(c.clickBtn));
  chrome.storage.onChanged.addListener((c) => { if (c.clickBtn) apply(c.clickBtn.newValue); });
  // Some pages (Docs) rebuild their DOM; re-attach if our button gets dropped.
  setInterval(() => { if (always) attach(); }, 2000);
})();
