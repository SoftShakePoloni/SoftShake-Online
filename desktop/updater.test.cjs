const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { createUpdater, plainNotes, CHECK_INTERVAL_MS } = require('./updater.cjs');

function harness({ packaged = true, dialogResponse = 1 } = {}) {
  const handlers = {}, sent = [], intervals = [], dialogs = [];
  const auto = Object.assign(new EventEmitter(), { checks: 0, installs: 0, checkForUpdates: async () => { auto.checks++; }, quitAndInstall() { auto.installs++; } });
  const win = { isDestroyed: () => false, webContents: { send: (channel, state) => sent.push([channel, state]) } };
  const trusted = { sender: 'main' };
  const updater = createUpdater({
    app: { isPackaged: packaged, getVersion: () => '1.2.0' },
    ipcMain: { handle: (channel, fn) => { handlers[channel] = fn; } },
    dialog: { showMessageBox: async (_w, options) => { dialogs.push(options); return { response: dialogResponse }; } },
    getWindow: () => win,
    validateSender: event => { if (event !== trusted) throw Error('Origem inválida'); },
    loadAutoUpdater: () => auto,
    setIntervalFn: (fn, ms) => intervals.push([fn, ms]),
    now: () => new Date('2026-11-03T12:00:00Z'),
  });
  return { updater, handlers, sent, intervals, dialogs, auto, trusted };
}

test('development builds never load or run the updater', async () => {
  const h = harness({ packaged: false });
  h.updater.start();
  assert.equal(h.auto.checks, 0);
  assert.equal((await h.handlers['softshake:update-state'](h.trusted)).status, 'disabled');
});

test('installed app checks on start and every 30 minutes, downloading in background', () => {
  const h = harness();
  h.updater.start();
  assert.equal(h.auto.checks, 1);
  assert.equal(h.auto.autoDownload, true);
  assert.equal(h.auto.autoInstallOnAppQuit, true);
  assert.deepEqual(h.intervals.map(([, ms]) => ms), [CHECK_INTERVAL_MS]);
  h.intervals[0][0]();
  assert.equal(h.auto.checks, 2);
});

test('status flows to the panel and install only works after download', async () => {
  const h = harness();
  h.updater.start();
  await assert.rejects(() => Promise.resolve().then(() => h.handlers['softshake:update-install'](h.trusted)), /Nenhuma atualização/);
  h.auto.emit('update-available', { version: '1.3.0', releaseNotes: '<p>Novo <b>catálogo</b></p>' });
  h.auto.emit('download-progress', { percent: 42.4 });
  assert.deepEqual([h.updater.state.status, h.updater.state.progress, h.updater.state.notes], ['downloading', 42, 'Novo catálogo']);
  h.auto.emit('update-downloaded', { version: '1.3.0' });
  assert.equal(h.updater.state.status, 'downloaded');
  assert.equal(h.sent.at(-1)[0], 'softshake:update-status');
  assert.equal(h.dialogs.length, 1, 'asks once to restart');
  h.auto.emit('update-downloaded', { version: '1.3.0' });
  assert.equal(h.dialogs.length, 1);
  await h.handlers['softshake:update-install'](h.trusted);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.auto.installs, 1);
});

test('errors are reported, and IPC rejects untrusted senders', async () => {
  const h = harness();
  h.updater.start();
  h.auto.emit('error', Error('offline'));
  assert.deepEqual([h.updater.state.status, h.updater.state.error], ['error', 'offline']);
  assert.throws(() => h.handlers['softshake:update-state']({ sender: 'other' }), /Origem inválida/);
});

test('release notes become plain text', () => {
  assert.equal(plainNotes('<h2>1.3.0</h2><ul><li>Atualizações &amp; correções</li></ul><script>x</script>'), '1.3.0\nAtualizações & correções\nx');
  assert.equal(plainNotes([{ note: 'A' }, { note: 'B' }]), 'A\nB');
  assert.equal(plainNotes(null), '');
});
