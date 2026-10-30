const { test } = require('node:test');
const assert = require('node:assert/strict');
const { trustedUrl, selectPrinter } = require('./policy.cjs');
test('remote content is restricted to the exact SoftShake admin origin', () => {
  assert.ok(trustedUrl('https://softshake.com.br/admin/pedidos'));
  assert.ok(trustedUrl('https://softshake.com.br/admin/login'));
  for (const url of ['http://softshake.com.br/admin', 'https://softshake.com.br.evil.test/admin', 'file:///admin', 'https://softshake.com.br/', 'https://softshake.com.br/administrator']) assert.equal(trustedUrl(url), false);
});
test('native print selects a real configured printer and rejects virtual or missing devices', () => {
  const devices = [{ name: 'Microsoft Print to PDF', isDefault: true }, { name: 'HP LaserJet', isDefault: false }];
  assert.equal(selectPrinter(devices, '').name, 'HP LaserJet');
  assert.equal(selectPrinter(devices, 'HP LaserJet').name, 'HP LaserJet');
  assert.equal(selectPrinter(devices, 'Microsoft Print to PDF'), null);
  assert.equal(selectPrinter(devices, 'Missing printer'), null);
  assert.equal(selectPrinter([devices[0]], ''), null);
  assert.equal(selectPrinter([...devices, { name: 'Kitchen printer' }], ''), null);
});
test('the real IPC handler validates the sender and requests silent native printing', async () => {
  const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), { createRequire } = require('node:module');
  let readyCallback, handler, options, receiptReady = true, devices = [{ name: 'HP Test', isDefault: true }];
  const frame = { url: 'https://softshake.com.br/admin/pedidos' };
  const contents = { mainFrame: frame, on() {}, setWindowOpenHandler() {}, session: { setPermissionRequestHandler() {} },
    executeJavaScript: async () => receiptReady, getPrintersAsync: async () => devices,
    print(value, callback) { options = value; callback(true); },
  };
  const electron = {
    app: { setName() {}, setAppUserModelId() {}, requestSingleInstanceLock: () => true, on() {}, whenReady: () => ({ then(callback) { readyCallback = callback; } }), getPath: () => require('node:os').tmpdir() },
    BrowserWindow: class { constructor() { this.webContents = contents; } once() {} loadURL() { return Promise.resolve(); } },
    Menu: {}, ipcMain: { handle(_channel, callback) { handler = callback; } },
    dialog: { showMessageBox: async () => ({ response: 0 }) }, shell: {},
  };
  const native = createRequire(path.join(__dirname, 'main.cjs'));
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'main.cjs'), 'utf8'), { __dirname, require: name => name === 'electron' ? electron : native(name) });
  readyCallback();
  await assert.rejects(() => handler({ sender: {}, senderFrame: frame }), /Origem/);
  await assert.rejects(() => handler({ sender: contents, senderFrame: { url: frame.url } }), /Origem/);
  const result = await handler({ sender: contents, senderFrame: frame });
  assert.equal(result.accepted, true); assert.equal(options.silent, true); assert.equal(options.deviceName, 'HP Test');
  receiptReady = false;
  await assert.rejects(() => handler({ sender: contents, senderFrame: frame }), /comanda/);
  receiptReady = true; devices = [{ name: 'Microsoft Print to PDF', isDefault: true }];
  await assert.rejects(() => handler({ sender: contents, senderFrame: frame }), /impressora física/);
});
