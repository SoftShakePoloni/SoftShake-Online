const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { START_URL, ORIGIN, trustedUrl, physicalPrinter, selectPrinter } = require('./policy.cjs');

app.setName('SoftShake Admin');
app.setAppUserModelId('br.com.softshake.admin');
let mainWindow, printing = false;
function readSettings() {
  try { return JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'printer.json'), 'utf8')); } catch { return {}; }
}
function savePrinter(name) {
  fs.writeFileSync(path.join(app.getPath('userData'), 'printer.json'), JSON.stringify({ printerName: name }));
}
async function printerMenu() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const printers = (await mainWindow.webContents.getPrintersAsync()).filter(physicalPrinter);
  const configured = readSettings().printerName || '';
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'SoftShake', submenu: [
      { label: 'Pedidos', click: () => mainWindow.loadURL(START_URL) },
      { label: 'Configurações', click: () => mainWindow.loadURL(ORIGIN + '/admin/configuracoes') },
      { type: 'separator' }, { role: 'quit', label: 'Sair' },
    ] },
    { label: 'Impressora', submenu: [
      { label: 'Usar impressora padrão do Windows', type: 'radio', checked: !configured, click: () => { savePrinter(''); void printerMenu(); } },
      ...printers.map(printer => ({ label: printer.displayName || printer.name, type: 'radio', checked: configured === printer.name, click: () => { savePrinter(printer.name); void printerMenu(); } })),
      { type: 'separator' }, { label: 'Atualizar lista de impressoras', click: () => { void printerMenu(); } },
      { label: 'Como imprimir automaticamente', click: () => dialog.showMessageBox(mainWindow, { type: 'info', title: 'Impressão automática', message: 'Escolha a impressora neste menu e ative “Aceitar e imprimir novos pedidos” nas configurações do painel.', detail: 'O aplicativo envia os dois cupons, cozinha e cliente, sem janela de confirmação. Mantenha o aplicativo aberto e a internet conectada. Papel, orientação e corte seguem o driver da impressora. O envio ao Windows não confirma que o papel saiu da impressora.' }) },
    ] },
    { label: 'Visualizar', submenu: [{ role: 'reload', label: 'Recarregar' }, { role: 'resetZoom', label: 'Tamanho original' }, { role: 'zoomIn', label: 'Aumentar' }, { role: 'zoomOut', label: 'Diminuir' }, { role: 'togglefullscreen', label: 'Tela cheia' }] },
  ]));
}

ipcMain.handle('softshake:print', async event => {
  if (!mainWindow || event.sender !== mainWindow.webContents || event.senderFrame !== mainWindow.webContents.mainFrame || !trustedUrl(event.senderFrame.url)) throw Error('Origem de impressão inválida.');
  if (printing) throw Error('Já existe uma impressão em andamento.');
  printing = true;
  try {
    const ready = await mainWindow.webContents.executeJavaScript("Boolean(document.querySelector('.print-root .print-ticket'))");
    if (!ready) throw Error('A comanda ainda não está pronta para impressão.');
    const printer = selectPrinter(await mainWindow.webContents.getPrintersAsync(), readSettings().printerName);
    if (!printer) throw Error('Escolha uma impressora física no menu Impressora do aplicativo.');
    await new Promise((resolve, reject) => mainWindow.webContents.print({ silent: true, printBackground: true, deviceName: printer.name, usePrinterDefaultPageSize: true }, (success, reason) => success ? resolve() : reject(Error(reason || 'O Windows não aceitou a impressão.'))));
    return { accepted: true };
  } catch (error) {
    await dialog.showMessageBox(mainWindow, { type: 'error', title: 'Não foi possível imprimir', message: error.message, detail: 'Confira a impressora no menu Impressora. O pedido continua no painel e pode ser reimpresso manualmente.' });
    throw error;
  } finally { printing = false; }
});

function createWindow() {
  mainWindow = new BrowserWindow({ width: 1360, height: 900, minWidth: 800, minHeight: 600, title: 'SoftShake Admin', icon: path.join(__dirname, 'assets/icon.png'), backgroundColor: '#F7F8FC', show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true, backgroundThrottling: false, partition: 'persist:softshake-admin' } });
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.webContents.on('page-title-updated', event => { event.preventDefault(); mainWindow.setTitle('SoftShake Admin'); });
  mainWindow.webContents.on('will-navigate', (event, url) => { if (!trustedUrl(url)) event.preventDefault(); });
  mainWindow.webContents.on('will-redirect', (event, url) => { if (!trustedUrl(url)) event.preventDefault(); });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try { const target = new URL(url); if (target.protocol === 'https:') void shell.openExternal(target.href); } catch { /* Ignore malformed URLs. */ }
    return { action: 'deny' };
  });
  mainWindow.webContents.session.setPermissionRequestHandler((contents, permission, callback, details) => {
    callback(permission === 'clipboard-sanitized-write' && contents === mainWindow.webContents && trustedUrl(details.requestingUrl || contents.getURL()));
  });
  mainWindow.webContents.on('did-finish-load', () => { void printerMenu(); });
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
