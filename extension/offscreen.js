'use strict';

const API = 'https://generativelanguage.googleapis.com/v1beta';
const MAX_SEC = 420; // keeps WAV under Gemini's 20MB inline limit
let rec = null, stream = null, chunks = [], t0 = 0, timer = 0;

chrome.runtime.onMessage.addListener((m, _s, reply) => {
  if (m.target !== 'offscreen') return;
  const run = { status, start, stop }[m.type];
  run(m).then(reply);
  return true;
});

const status = async () => ({ recording: !!rec && rec.state === 'recording' });

async function start() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
  } catch {
    return { error: 'mic' };
  }
  chunks = [];
  rec = new MediaRecorder(stream, MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? { mimeType: 'audio/webm;codecs=opus' } : {});
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  rec.start(250);
  t0 = Date.now();
  timer = setTimeout(() => chrome.runtime.sendMessage({ type: 'autostop' }), MAX_SEC * 1000);
  return { ok: true };
}

async function stop({ cfg }) {
  clearTimeout(timer);
  await new Promise((done) => { rec.onstop = done; rec.stop(); });
  stream.getTracks().forEach((t) => t.stop());
  if (Date.now() - t0 < 700) return { error: 'Too short, try again' };
  try {
    const text = await transcribe(await toWav(new Blob(chunks, { type: rec.mimeType })), cfg);
    return text ? { text } : { error: 'No speech heard' };
  } catch (e) {
    return { error: e.message };
  }
}

function buildPrompt(cfg) {
  const digits = cfg.bnDigits !== false
    ? 'Write numbers, dates, prices, times and phone numbers with Bangla digits (০১২৩৪৫৬৭৮৯), e.g. ১২৫ টাকা, ২০২৬ সাল, সকাল ১০টা। Small counting words in ordinary speech (এক, দুই, কয়েক) stay as words.'
    : 'Write numbers, dates, prices, times and phone numbers with ASCII digits (0-9). Small counting words in ordinary speech stay as words.';
  const english = cfg.keepEn
    ? 'If the speaker clearly says an English word, name, brand or technical term, write it in English letters (e.g. Facebook, Gmail, Zoom). All other words stay in Bangla script.'
    : 'Write English words the speaker uses in Bangla script (e.g. ফেসবুক, জিমেইল, মিটিং, ইন্টারনেট). Use Latin letters only for email addresses, URLs and code.';

  return `You are a professional Bangla (Bengali) speech-to-text engine used for typing.
Listen to the attached audio and write exactly what the main speaker said, in Bangla.

RULES
1. Language: output Bangla script (বাংলা) only. Never translate, summarize, explain, or answer the speaker. If the speaker asks a question, just transcribe it.
2. Keep the speaker's own words and style (চলিত or সাধু). Do not rewrite or formalize. Use correct standard Bangla Academy spelling: correct যুক্তাক্ষর, হসন্ত, রেফ, ফলা, ও-কার/ো, ণ/ন, শ/ষ/স, ড়/ঢ়, চন্দ্রবিন্দু. Never output Hindi, Urdu, or Devanagari words or letters.
3. Clean the speech: drop background noise, silence, coughs, breaths, music, and other people's voices. Remove filler sounds used only as hesitation (আ, আঁ, উম, হুম, ইয়ে), stutters, false starts, and accidental repeated words.
4. Punctuation: add natural punctuation. End sentences with দাঁড়ি "।" (never "."). Use , ; : ? ! and "—" where fitting. Use “ ” for quoted speech. No space before punctuation, one space after. Use a blank line only for a clear change of topic.
5. If the speaker dictates a punctuation command, write the symbol instead of the word: দাঁড়ি → ।, কমা → ,, প্রশ্নচিহ্ন → ?, বিস্ময়চিহ্ন → !, নতুন লাইন → line break, নতুন অনুচ্ছেদ → blank line.
6. Numbers: ${digits}
7. English words: ${english}
8. Output ONLY the final text. No title, no label, no note, no markdown, no surrounding quotes. If there is no clear human speech, output exactly: NO_SPEECH`;
}

// Decode → 16 kHz mono WAV, with a gain lift for quiet voices (max x8).
async function toWav(blob) {
  const ac = new AudioContext();
  const audio = await ac.decodeAudioData(await blob.arrayBuffer());
  ac.close();
  const off = new OfflineAudioContext(1, Math.max(1, Math.ceil(audio.duration * 16000)), 16000);
  const src = off.createBufferSource();
  src.buffer = audio;
  src.connect(off.destination);
  src.start();
  const pcm = (await off.startRendering()).getChannelData(0);

  let peak = 0;
  for (let i = 0; i < pcm.length; i++) peak = Math.max(peak, Math.abs(pcm[i]));
  const gain = peak > 0.001 ? Math.min(8, 0.9 / peak) : 1;

  const view = new DataView(new ArrayBuffer(44 + pcm.length * 2));
  const w = (o, s) => [...s].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); view.setUint32(4, 36 + pcm.length * 2, true); w(8, 'WAVE');
  w(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, 16000, true); view.setUint32(28, 32000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  w(36, 'data'); view.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i] * gain));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([view], { type: 'audio/wav' });
}

const toBase64 = (blob) =>
  new Promise((res, rej) => {
    const f = new FileReader();
    f.onload = () => res(String(f.result).split(',')[1]);
    f.onerror = () => rej(f.error);
    f.readAsDataURL(blob);
  });

async function transcribe(wav, cfg) {
  const body = {
    contents: [{
      role: 'user',
      parts: [{ text: buildPrompt(cfg) }, { inlineData: { mimeType: 'audio/wav', data: await toBase64(wav) } }],
    }],
    generationConfig: { temperature: 0 },
  };
  const r = await fetch(`${API}/models/${encodeURIComponent(cfg.model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cfg.apiKey },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error?.message || `HTTP ${r.status}`);
  if (j.promptFeedback?.blockReason) throw new Error('Blocked by Gemini: ' + j.promptFeedback.blockReason);
  const parts = j.candidates?.[0]?.content?.parts || [];
  const text = parts.filter((p) => !p.thought && p.text).map((p) => p.text).join('').trim()
    .replace(/^```[a-z]*\n?|\n?```$/g, '').trim();
  return text === 'NO_SPEECH' ? '' : text;
}
