/* ==========================================================
   intro.js — OpenCode TUI-style intro animation
   ========================================================== */

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/* --- Typing effect for the input bar --- */
async function typeInInput(el, text, speed) {
  speed = speed || 45;
  for (let i = 0; i < text.length; i++) {
    el.textContent = text.slice(0, i + 1);
    await sleep(speed);
  }
}

/* --- Add a chat message --- */
function addMessage(container, role, bodyHTML) {
  const msg = document.createElement('div');
  msg.className = 'oc-msg';

  const roleEl = document.createElement('div');
  roleEl.className = 'oc-msg-role oc-msg-role-' + role;
  roleEl.textContent = role === 'user' ? 'You' : 'Assistant';
  msg.appendChild(roleEl);

  const body = document.createElement('div');
  body.className = 'oc-msg-body';
  body.innerHTML = bodyHTML;
  msg.appendChild(body);

  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
  return body;
}

/* --- Add a tool-call block inside a message body --- */
function addToolBlock(parent, header, bodyHTML) {
  const tool = document.createElement('div');
  tool.className = 'oc-tool';

  const h = document.createElement('div');
  h.className = 'oc-tool-header';
  h.innerHTML = header;
  tool.appendChild(h);

  const b = document.createElement('div');
  b.className = 'oc-tool-body';
  b.innerHTML = bodyHTML;
  tool.appendChild(b);

  parent.appendChild(tool);
  parent.closest('.oc-messages').scrollTop = parent.closest('.oc-messages').scrollHeight;
  return tool;
}

/* --- Stream text into an element char by char --- */
async function streamText(el, text, speed) {
  speed = speed || 18;
  for (let i = 0; i < text.length; i++) {
    el.textContent += text[i];
    el.closest('.oc-messages').scrollTop = el.closest('.oc-messages').scrollHeight;
    await sleep(speed);
  }
}

/* --- Update sidebar counters --- */
let tokenCount = 0;
let costVal = 0;
function bumpTokens(n) {
  tokenCount += n;
  costVal = tokenCount * 0.000015;
  const tEl = document.getElementById('oc-tokens');
  const cEl = document.getElementById('oc-cost');
  if (tEl) tEl.textContent = tokenCount.toLocaleString();
  if (cEl) cEl.textContent = '$' + costVal.toFixed(3);
}

let startTime;
let durationInterval;
function startDurationTimer() {
  startTime = Date.now();
  durationInterval = setInterval(() => {
    const el = document.getElementById('oc-duration');
    if (el) el.textContent = ((Date.now() - startTime) / 1000).toFixed(1) + 's';
  }, 100);
}

function stopDurationTimer() {
  clearInterval(durationInterval);
}

/* --- Populate file tree --- */
function populateFileTree() {
  const tree = document.getElementById('oc-file-tree');
  if (!tree) return;
  const files = [
    { name: 'homepage/', cls: 'oc-ft-dir' },
    { name: '  index.html', cls: 'oc-ft-active' },
    { name: '  publications.html', cls: '' },
    { name: '  projects.html', cls: '' },
    { name: '  talks.html', cls: '' },
    { name: '  personal.html', cls: '' },
    { name: '  assets/', cls: 'oc-ft-dir' },
    { name: '    style.css', cls: '' },
    { name: '    render.js', cls: '' },
    { name: '  data/', cls: 'oc-ft-dir' },
    { name: '    profile.json', cls: '' },
  ];
  files.forEach(f => {
    const d = document.createElement('div');
    if (f.cls) d.className = f.cls;
    d.textContent = f.name;
    tree.appendChild(d);
  });
}

/* === Main intro sequence === */
async function runIntro() {
  // Skip on refresh (type === 'reload'), show on fresh navigation (type === 'navigate')
  var navEntry = performance.getEntriesByType('navigation')[0];
  var isReload = navEntry && navEntry.type === 'reload';

  if (isReload || sessionStorage.getItem('intro-seen')) {
    document.getElementById('intro-overlay').remove();
    return;
  }

  const overlay = document.getElementById('intro-overlay');
  const messages = document.getElementById('oc-messages');
  const inputText = document.getElementById('oc-input-text');

  populateFileTree();
  startDurationTimer();

  await sleep(500);

  // User types first message
  await typeInInput(inputText, 'Make me a personal website using C++.', 40);
  await sleep(400);
  inputText.textContent = '';

  // Message appears in chat
  addMessage(messages, 'user', 'Make me a personal website using C++.');
  bumpTokens(312);
  await sleep(600);

  // Assistant responds
  const assistBody = addMessage(messages, 'assistant', '');
  await streamText(assistBody, 'I got this. ', 35);
  bumpTokens(186);
  await sleep(300);

  // Thinking line
  const thinkLine = document.createElement('div');
  thinkLine.innerHTML = '<span class="oc-dim"><span class="oc-spinner"></span> Thinking...</span>';
  assistBody.appendChild(thinkLine);
  messages.scrollTop = messages.scrollHeight;
  await sleep(800);
  thinkLine.remove();

  // Tool calls — Write files
  const writeFiles = [
    { file: 'index.html', desc: 'main page with Zed editor theme' },
    { file: 'assets/style.css', desc: 'One Dark color scheme, line numbers' },
    { file: 'assets/render.js', desc: 'C++ syntax rendering engine' },
    { file: 'data/profile.json', desc: 'bio, education, experience' },
    { file: 'publications.html', desc: 'papers grouped by year' },
    { file: 'projects.html', desc: 'open-source contributions' },
  ];

  for (const f of writeFiles) {
    const tool = addToolBlock(assistBody,
      '<span class="oc-spinner"></span> Write <span class="oc-file">' + f.file + '</span>',
      '<span class="oc-dim">' + f.desc + '</span>'
    );
    bumpTokens(Math.floor(Math.random() * 400) + 200);
    await sleep(350);

    // Mark as done
    tool.querySelector('.oc-tool-header').innerHTML =
      '<span class="oc-green">+</span> Write <span class="oc-file">' + f.file + '</span>';
    const result = document.createElement('div');
    result.className = 'oc-tool-result';
    result.textContent = 'created';
    tool.appendChild(result);
    messages.scrollTop = messages.scrollHeight;
  }

  await sleep(400);
  bumpTokens(284);

  // Final message
  const doneText = document.createElement('div');
  doneText.style.marginTop = '0.4rem';
  assistBody.appendChild(doneText);

  const lines = [
    "Done. Your homepage is styled like a code editor with C++ syntax throughout.",
    "",
    "Every section — bio, education, experience — renders as C++ structs.",
    "Navigation tabs are .hpp files. The status bar shows git info.",
    "",
    "Opening ./homepage ..."
  ];

  for (const l of lines) {
    await streamText(doneText, l + '\n', 14);
    bumpTokens(Math.floor(Math.random() * 50) + 20);
  }

  await sleep(800);
  stopDurationTimer();

  // Fade out
  overlay.classList.add('oc-fadeout');
  await sleep(700);
  overlay.remove();

  sessionStorage.setItem('intro-seen', '1');
}
