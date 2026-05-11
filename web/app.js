const explorerTxBase = 'https://chainscan-galileo.0g.ai/tx/';

const $ = (id) => document.getElementById(id);
const setText = (id, value) => { $(id).textContent = value ?? '—'; };

let gameIndex = [];
let currentGameId = null;

async function loadGameIndex() {
  const response = await fetch('./data/game-index.json', { cache: 'no-store' });
  if (!response.ok) return [];
  return response.json();
}

async function loadManifestByPath(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load manifest ${path}: ${response.status}`);
  return response.json();
}

async function loadLatestDemo() {
  const response = await fetch('./data/latest-demo.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load latest-demo.json: ${response.status}`);
  return response.json();
}

function renderChecklist(items) {
  const list = $('checklist');
  list.innerHTML = '';
  for (const item of items) {
    const li = document.createElement('li');
    li.textContent = item;
    list.appendChild(li);
  }
}

function renderTimeline(items) {
  const list = $('timeline');
  list.innerHTML = '';
  for (const item of items) {
    const li = document.createElement('li');
    li.innerHTML = `<div><strong>${item.title}</strong><span>${item.description}</span></div>`;
    list.appendChild(li);
  }
}

function renderAgentMemories(memories = {}) {
  const root = $('agentMemoryList');
  root.innerHTML = '';
  const entries = Object.values(memories);
  if (entries.length === 0) {
    root.innerHTML = '<p class="muted">No agent memory snapshot attached for this replay.</p>';
    return;
  }

  for (const memory of entries) {
    const card = document.createElement('article');
    card.className = 'memory-card';
    card.innerHTML = `
      <div class="memory-head">
        <strong>${memory.displayName}</strong>
        <span>${memory.personaId || 'unknown persona'} · ${memory.outcome} · ${memory.survived ? 'survived' : 'died'}</span>
      </div>
      <p>${(memory.keyTakeaways || []).join(' ')}</p>
      <small>Suspicion: ${(memory.suspicionTargets || []).join(', ') || '—'}<br/>Trust: ${(memory.trustTargets || []).join(', ') || '—'}</small>
    `;
    root.appendChild(card);
  }
}

function renderJudgeMap(data) {
  const root = $('judgeMap');
  const chainLinked = Boolean(data.chain?.registryAddress);
  root.innerHTML = `
    <article class="judge-card">
      <strong>1. Transcript</strong>
      <p>The public replay transcript is the judge-safe storytelling view. It removes hidden-role leakage so judges can watch the match flow without spoilers.</p>
      <small>Root: ${data.transcript?.root || '—'}</small>
    </article>
    <article class="judge-card">
      <strong>2. Audit Transcript</strong>
      <p>The private audit transcript keeps night actions and private notes. It is the forensic source when someone wants to inspect whether the public replay omitted hidden information correctly.</p>
      <small>Root: ${data.auditTranscript?.root || '—'}</small>
    </article>
    <article class="judge-card">
      <strong>3. Summary</strong>
      <p>The summary compresses the match outcome into winner, highlights, and reputation-style deltas. This is the compact state judges compare against the replay and on-chain result.</p>
      <small>Root: ${data.summary?.root || '—'}</small>
    </article>
    <article class="judge-card">
      <strong>4. Agent Memory</strong>
      <p>The memory artifact records what each agent carries into the next match. That makes post-game adaptation visible and verifiable instead of hidden inside prompts.</p>
      <small>Root: ${data.agentMemories?.root || '—'}</small>
    </article>
    <article class="judge-card wide ${chainLinked ? 'ok' : 'warn'}">
      <strong>5. Chain Record</strong>
      <p>${chainLinked
        ? 'The chain record anchors the raw transcript/summary roots so judges can confirm that the uploaded artifacts and the contract-level record refer to the same completed game.'
        : 'This replay is still useful for local verification, but it is not yet anchored to a live GameRegistry record.'}</p>
      <small>${chainLinked ? `Registry: ${data.chain.registryAddress}` : 'No live registry link attached yet.'}</small>
    </article>
  `;
}

function bindTx(linkId, txHash, txUrl, fallbackText = 'No tx yet') {
  const el = $(linkId);
  if (txHash && typeof txHash === 'string' && txHash.startsWith('0x')) {
    el.href = txUrl || `${explorerTxBase}${txHash}`;
    el.textContent = `View tx ${txHash.slice(0, 10)}…`;
  } else {
    el.removeAttribute('href');
    el.textContent = fallbackText;
  }
}

function renderGameList() {
  const root = $('gameList');
  root.innerHTML = '';
  $('gameCountPill').textContent = `${gameIndex.length} games`;

  for (const item of gameIndex) {
    const button = document.createElement('button');
    button.className = `game-item${item.gameId === currentGameId ? ' active' : ''}`;
    button.dataset.gameId = item.gameId;
    button.innerHTML = `
      <strong>${item.gameId}</strong>
      <span>${item.networkLabel} · ${item.winner} · ${item.eventCount} events</span>
      <small>${item.registry ?? 'No registry'}</small>
    `;
    root.appendChild(button);
  }
}

function render(data) {
  currentGameId = data.gameId;
  renderGameList();

  setText('networkLabel', data.networkLabel);
  setText('storageMode', `Storage: ${data.storageMode}`);
  setText('gameId', data.gameId);
  setText('winner', data.winner);
  setText('eventCount', String(data.eventCount));
  setText('engineLabel', data.engine);
  setText('registryLabel', data.registry);

  setText('transcriptRoot', data.transcript.root);
  setText('transcriptUri', data.transcript.uri);
  bindTx('transcriptTx', data.transcript.txHash, data.transcript.txUrl);

  setText('auditRoot', data.auditTranscript?.root || '—');
  setText('auditUri', data.auditTranscript?.uri || '—');
  bindTx('auditTx', data.auditTranscript?.txHash, data.auditTranscript?.txUrl);

  setText('summaryRoot', data.summary.root);
  setText('summaryUri', data.summary.uri);
  bindTx('summaryTx', data.summary.txHash, data.summary.txUrl);

  setText('agentMemoryRoot', data.agentMemories?.root || '—');
  setText('agentMemoryUri', data.agentMemories?.uri || '—');
  bindTx('agentMemoryTx', data.agentMemories?.txHash, data.agentMemories?.txUrl, 'No memory tx');

  const currentMemory = data.memoryLayers?.currentGameMemory;
  const crossMemory = data.memoryLayers?.crossGameMemory;
  setText('currentMemoryRoot', currentMemory?.root || '—');
  setText('currentMemoryNote', currentMemory?.purpose || 'Current-game memory layer not attached yet.');
  bindTx('currentMemoryTx', currentMemory?.txHash, currentMemory?.txUrl, 'No current-memory tx');
  setText('crossMemoryRoot', crossMemory?.root || '—');
  setText('crossMemoryNote', crossMemory?.purpose || 'Cross-game memory layer not attached yet.');
  bindTx('crossMemoryTx', crossMemory?.txHash, crossMemory?.txUrl, 'No cross-memory tx');

  setText('chainRegistryAddress', data.chain?.registryAddress || 'Not linked');
  setText('chainGameKey', data.chain?.gameKey || '—');
  setText('chainTranscriptRoot', data.chain?.recordedTranscriptRoot || '—');
  setText('chainSummaryRoot', data.chain?.recordedSummaryRoot || '—');
  bindTx('chainTx', data.chain?.txHash, data.chain?.txUrl, 'No finalize tx');
  bindTx('chainCreateTx', data.chain?.createTxHash, data.chain?.createTxUrl, 'No create tx');
  setText('chainNote', data.chain?.registryAddress
    ? '链上记录的是原始 transcript / summary root；公开回放 root 与链上 transcript root 不应直接等同。'
    : '当前是本地或 mock 记录，尚未附着真实链上 registry。');

  setText('verifyPublicNote', data.auditTranscript
    ? '公开回放 transcript 已与私有审计 transcript 分离，适合 judge / 群聊展示。'
    : '未附带私有审计 transcript。');
  setText('verifyAuditNote', data.auditTranscript
    ? '审计 transcript 保留了夜间动作和 private notes，可用于赛后审查。'
    : '审计 transcript 缺失。');
  setText('verifySummaryNote', data.chain?.recordedSummaryRoot
    ? `链上 summary root: ${data.chain.recordedSummaryRoot}`
    : '当前只看到离线 summary artifact。');
  setText('verifyChainNote', data.chain?.registryAddress
    ? '链上 transcript root 对应原始完整 transcript，不是 judge-safe 公共 transcript。'
    : '还没有真实链上 finalize 记录。');

  renderJudgeMap(data);
  renderChecklist(data.verificationChecklist);
  renderTimeline(data.replayPreview);
  renderAgentMemories(data.agentMemoryPreview || {});
}

document.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-copy]');
  if (button) {
    const id = button.dataset.copy;
    await navigator.clipboard.writeText($(id).textContent);
    const old = button.textContent;
    button.textContent = 'Copied';
    setTimeout(() => { button.textContent = old; }, 900);
    return;
  }

  const gameItem = event.target.closest('.game-item');
  if (gameItem) {
    const selected = gameIndex.find((item) => item.gameId === gameItem.dataset.gameId);
    if (!selected) return;
    const manifest = await loadManifestByPath(selected.manifestPath);
    render(manifest);
  }
});

(async function init() {
  try {
    gameIndex = await loadGameIndex();
    if (gameIndex.length > 0) {
      const preferred = new URLSearchParams(window.location.search).get('game');
      const selected = gameIndex.find((item) => item.gameId === preferred) ?? gameIndex[0];
      render(await loadManifestByPath(selected.manifestPath));
      return;
    }
    render(await loadLatestDemo());
  } catch (error) {
    document.body.innerHTML = `<pre style="padding:24px;color:#fff">${error.stack || error.message}</pre>`;
  }
})();
