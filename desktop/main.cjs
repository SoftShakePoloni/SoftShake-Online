const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { START_URL, trustedUrl, physicalPrinter, selectPrinter } = require('./policy.cjs');

app.setName('Softshake');
// Preserve the existing login and printer preferences when upgrading the renamed app.
app.setPath('userData', path.join(app.getPath('appData'), 'SoftShake Admin'));
app.setAppUserModelId('br.com.softshake.admin');
let mainWindow, printing = false;
function readSettings() {
  try { return JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'printer.json'), 'utf8')); } catch { return {}; }
}
function savePrinter(name) {
  fs.writeFileSync(path.join(app.getPath('userData'), 'printer.json'), JSON.stringify({ printerName: name }));
}
function validateSender(event) {
  if (!mainWindow || event.sender !== mainWindow.webContents || event.senderFrame !== mainWindow.webContents.mainFrame || !trustedUrl(event.senderFrame.url)) throw Error('Origem de impressão inválida.');
}
ipcMain.handle('softshake:printers', async event => {
  validateSender(event);
  return { selected: readSettings().printerName || '', printers: (await mainWindow.webContents.getPrintersAsync()).filter(physicalPrinter).map(p => ({ name: p.name, label: p.displayName || p.name, isDefault: p.isDefault })) };
});
ipcMain.handle('softshake:select-printer', async (event, name) => {
  validateSender(event);
  if (typeof name !== 'string' || (name !== '' && !(await mainWindow.webContents.getPrintersAsync()).some(p => physicalPrinter(p) && p.name === name))) throw Error('Impressora indisponível. Atualize a lista e tente novamente.');
  savePrinter(name);
});
ipcMain.handle('softshake:windows-printers', async event => {
  validateSender(event);
  await shell.openExternal('ms-settings:printers');
});

ipcMain.handle('softshake:print', async event => {
  if (!mainWindow || event.sender !== mainWindow.webContents || event.senderFrame !== mainWindow.webContents.mainFrame || !trustedUrl(event.senderFrame.url)) throw Error('Origem de impressão inválida.');
  if (printing) throw Error('Já existe uma impressão em andamento.');
  printing = true;
  try {
    const ready = await mainWindow.webContents.executeJavaScript("Boolean(document.querySelector('.print-root .print-ticket'))");
    if (!ready) throw Error('A comanda ainda não está pronta para impressão.');
    const printer = selectPrinter(await mainWindow.webContents.getPrintersAsync(), readSettings().printerName);
    if (!printer) throw Error('Escolha uma impressora física nas configurações de impressão do painel.');
    await new Promise((resolve, reject) => mainWindow.webContents.print({ silent: true, printBackground: true, deviceName: printer.name, usePrinterDefaultPageSize: true }, (success, reason) => success ? resolve() : reject(Error(reason || 'O Windows não aceitou a impressão.'))));
    return { accepted: true };
  } catch (error) {
    await dialog.showMessageBox(mainWindow, { type: 'error', title: 'Não foi possível imprimir', message: error.message, detail: 'Confira a impressora nas configurações de impressão. O pedido continua no painel e pode ser reimpresso manualmente.' });
    throw error;
  } finally { printing = false; }
});

function createWindow() {
  mainWindow = new BrowserWindow({ width: 1360, height: 900, minWidth: 800, minHeight: 600, title: 'Softshake', icon: path.join(__dirname, 'assets/icon.png'), backgroundColor: '#F7F8FC', show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true, backgroundThrottling: false, partition: 'persist:softshake-admin' } });
  Menu.setApplicationMenu(null);
  mainWindow.setMenuBarVisibility(false);
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.webContents.on('page-title-updated', event => { event.preventDefault(); mainWindow.setTitle('Softshake'); });
  mainWindow.webContents.on('will-navigate', (event, url) => { if (!trustedUrl(url)) event.preventDefault(); });
  mainWindow.webContents.on('will-redirect', (event, url) => { if (!trustedUrl(url)) event.preventDefault(); });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try { const target = new URL(url); if (target.protocol === 'https:') void shell.openExternal(target.href); } catch { /* Ignore malformed URLs. */ }
    return { action: 'deny' };
  });
  mainWindow.webContents.session.setPermissionRequestHandler((contents, permission, callback, details) => {
    callback(permission === 'clipboard-sanitized-write' && contents === mainWindow.webContents && trustedUrl(details.requestingUrl || contents.getURL()));
  });
  mainWindow.webContents.on('did-fail-load', (_event, code, _description, _url, isMainFrame) => {
    if (!isMainFrame || code === -3) return;
    mainWindow.show();
    void dialog.showMessageBox(mainWindow, { type: 'warning', title: 'Conexão com o SoftShake', message: 'Não foi possível abrir o painel. Confira a internet.', buttons: ['Tentar novamente', 'Fechar'] }).then(({ response }) => response === 0 ? mainWindow.loadURL(START_URL) : mainWindow.close());
  });
  void mainWindow.loadURL(START_URL).catch(() => {});
}
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.show(); mainWindow.focus(); } });
  app.whenReady().then(createWindow);
  app.on('window-all-closed', () => app.quit());
}
