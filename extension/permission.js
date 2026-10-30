const msg = document.getElementById('msg');

navigator.mediaDevices
  .getUserMedia({ audio: true })
  .then((s) => {
    s.getTracks().forEach((t) => t.stop());
    msg.className = 'ok';
    msg.textContent = '✓ Microphone allowed. This tab will close.';
    setTimeout(() => {
      chrome.tabs.getCurrent((t) => t && chrome.tabs.remove(t.id));
    }, 1500);
  })
  .catch(() => {
    msg.className = 'err';
    msg.textContent =
      'Access was blocked. Click the lock icon in the address bar, set Microphone to Allow, then reload this page.';
  });
