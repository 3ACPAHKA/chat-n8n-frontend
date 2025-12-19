// chat.js - minimal, robust frontend for n8n webhook
(function () {
  const WEBHOOK_URL = 'https://n8n.mup.me/webhook/chat'; // production webhook
  const storageKey = 'WEBHOOK_SECRET';

  const $ = (el) => document.getElementById(el);
  const messages = $('messages');
  const input = $('input');
  const form = $('composer');
  const sendBtn = $('send');
  const typing = $('typing');
  const setSecretBtn = $('set-secret-btn');
  const secretModal = $('secret-modal');
  const secretInput = $('secret-input');
  const saveSecretBtn = $('save-secret');
  const cancelSecretBtn = $('cancel-secret');

  // DOM elements (already defined above)
  const landingView = document.getElementById('landing-view');
  const chatView = document.getElementById('chat-view');
  const startBtn = document.getElementById('start-chat-btn');

  // --- View Switching ---
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      // Hide landing, show chat
      landingView.classList.remove('active');
      landingView.style.display = 'none';

      chatView.classList.add('active');

      // Auto-focus input
      setTimeout(() => input.focus(), 100);

      // Render greeting if empty
      if (messages.children.length === 0) {
        renderMessage({ role: 'bot', text: 'Чат готов. Напишите что-нибудь.' });
      }
    });
  }

  // --- Secret Management ---
  if (setSecretBtn) {
    setSecretBtn.addEventListener('click', () => {
      secretInput.value = localStorage.getItem('WEBHOOK_SECRET') || '';
      secretModal.setAttribute('aria-hidden', 'false');
      secretInput.focus();
    });
  }

  // helper: create message element
  function renderMessage({ role = 'bot', text = '', ts = new Date() }) {
    const li = document.createElement('li');
    li.className = 'msg ' + (role === 'me' ? 'me' : 'bot');
    const contentHtml = (role === 'me') ? escapeHtml(text) : marked.parse(text);
    li.innerHTML = `
      <div class="text">${contentHtml}</div>
      <div class="meta">${formatTime(ts)}</div>
    `;
    messages.appendChild(li);
    // scroll to bottom smoothly
    li.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  function escapeHtml(s = '') {
    return String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function formatTime(d) {
    const dt = new Date(d);
    return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function showTyping() {
    typing.classList.add('show');
    typing.setAttribute('aria-hidden', 'false');
  }
  function hideTyping() {
    typing.classList.remove('show');
    typing.setAttribute('aria-hidden', 'true');
  }

  function getSecret() {
    return localStorage.getItem(storageKey) || '';
  }

  function openSecretModal() {
    secretModal.setAttribute('aria-hidden', 'false');
    secretInput.value = getSecret();
    secretInput.focus();
  }
  function closeSecretModal() {
    secretModal.setAttribute('aria-hidden', 'true');
  }

  function saveSecret() {
    const v = secretInput.value.trim();
    if (v) localStorage.setItem(storageKey, v);
    else localStorage.removeItem(storageKey);
    closeSecretModal();
  }

  // send to n8n
  async function sendMessage(text) {
    if (!text) return;
    renderMessage({ role: 'me', text, ts: new Date() });
    input.value = '';
    input.disabled = true;
    sendBtn.disabled = true;
    showTyping();

    const payload = { message: text };
    const headers = { 'Content-Type': 'application/json' };
    const secret = getSecret();
    if (secret) headers['Authorization'] = 'Bearer ' + secret;

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      // Check response
      if (!res.ok) {
        // try to parse error body if any
        const txt = await res.text();
        console.error('Server error', res.status, txt);
        renderMessage({ role: 'bot', text: `Ошибка сервера: ${res.status} ` });
        return;
      }
      const text = await res.text();

      // пустой ответ тоже допустим
      renderMessage({
        role: 'bot',
        text: text || '',
        ts: new Date(),
      });
    } catch (err) {
      // network / CORS / other
      console.error('Fetch failed', err);
      renderMessage({ role: 'bot', text: 'Network error: ' + (err.message || err) });
      // If CORS TypeError, instruct user
    } finally {
      hideTyping();
      input.disabled = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  // events
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = input.value.trim();
    if (!v) return;
    sendMessage(v);
  });

  setSecretBtn.addEventListener('click', openSecretModal);
  cancelSecretBtn.addEventListener('click', (e) => {
    e.preventDefault();
    closeSecretModal();
  });
  saveSecretBtn.addEventListener('click', (e) => {
    e.preventDefault();
    saveSecret();
  });

  // keyboard: Enter sends; Shift+Enter newline
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  // initial greeting / state
  // window load listener removed (logic moved to start button)

  // Copy on click
  messages.addEventListener('click', async (e) => {
    const msgEl = e.target.closest('.msg');
    if (!msgEl) return;

    const textEl = msgEl.querySelector('.text');
    if (!textEl) return;

    // Get clean text
    const text = textEl.innerText;
    const role = msgEl.classList.contains('me') ? 'me' : 'bot';

    try {
      await navigator.clipboard.writeText(text);
      showToast(text, role);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  });

  // Dynamic Toast
  function showToast(text, role) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      document.body.appendChild(toast);
    }

    // Truncate long text for the toast preview
    const display = text.length > 60 ? text.substring(0, 60) + '...' : text;

    toast.textContent = display;
    // Apply visibility class AND role class
    toast.className = 'show ' + role;

    // Reset after 2s
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2000);
  }

  // expose for debugging
  window.__chat_debug = { sendMessage, renderMessage, getSecret };
})();
