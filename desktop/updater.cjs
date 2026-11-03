// Atualização automática via GitHub Releases (electron-updater).
// O app verifica ao abrir e periodicamente, baixa em segundo plano e instala ao reiniciar.
const CHECK_INTERVAL_MS = 30 * 60 * 1000;

function plainNotes(notes) {
  // electron-updater pode entregar HTML ou uma lista por versão: o painel recebe só texto.
  const raw = Array.isArray(notes) ? notes.map(n => n && n.note).filter(Boolean).join('\n') : notes || '';
  return String(raw).replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|li|h\d)>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\n{3,}/g, '\n\n').trim().slice(0, 4000);
}

function createUpdater({ app, ipcMain, dialog, getWindow, validateSender, loadAutoUpdater, setIntervalFn = setInterval, now = () => new Date() }) {
  const state = { status: 'idle', version: typeof app.getVersion === 'function' ? app.getVersion() : '', available: null, progress: null, notes: '', releaseDate: null, checkedAt: null, error: null };
  let autoUpdater = null, prompted = false;
  const emit = patch => {
    Object.assign(state, patch);
    const win = getWindow();
    if (win && !win.isDestroyed() && typeof win.webContents.send === 'function') win.webContents.send('softshake:update-status', { ...state });
  };

  ipcMain.handle('softshake:update-state', event => { validateSender(event); return { ...state }; });
  ipcMain.handle('softshake:update-check', async event => {
    validateSender(event);
    if (!autoUpdater) return { ...state };
    try { await autoUpdater.checkForUpdates(); } catch (error) { emit({ status: 'error', error: String(error && error.message || error) }); }
    return { ...state };
  });
  ipcMain.handle('softshake:update-install', event => {
    validateSender(event);
    if (!autoUpdater || state.status !== 'downloaded') throw Error('Nenhuma atualização pronta para instalar.');
    setImmediate(() => autoUpdater.quitAndInstall(false, true));
    return { accepted: true };
  });

  function start() {
    // Só o app instalado se atualiza; em desenvolvimento (npm start) fica desligado.
    if (!app.isPackaged) { emit({ status: 'disabled' }); return; }
    autoUpdater = loadAutoUpdater();
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.on('checking-for-update', () => emit({ status: 'checking', error: null }));
    autoUpdater.on('update-available', info => emit({ status: 'downloading', available: info.version, notes: plainNotes(info.releaseNotes), releaseDate: info.releaseDate || null, progress: 0 }));
    autoUpdater.on('update-not-available', () => emit({ status: 'up-to-date', available: null, progress: null, checkedAt: now().toISOString() }));
    autoUpdater.on('download-progress', p => emit({ status: 'downloading', progress: Math.round(p.percent || 0) }));
    autoUpdater.on('update-downloaded', info => {
      emit({ status: 'downloaded', available: info.version, notes: plainNotes(info.releaseNotes) || state.notes, progress: 100, checkedAt: now().toISOString() });
      const win = getWindow();
      if (prompted || !win || win.isDestroyed()) return;
      prompted = true;
      void dialog.showMessageBox(win, { type: 'info', title: 'Atualização pronta', message: `A versão ${info.version} do Softshake foi baixada.`, detail: 'Reinicie agora para instalar ou continue trabalhando: ela será instalada quando o aplicativo for fechado.', buttons: ['Reiniciar agora', 'Depois'], defaultId: 1, cancelId: 1 })
        .then(({ response }) => { if (response === 0) autoUpdater.quitAndInstall(false, true); });
    });
    autoUpdater.on('error', error => emit({ status: 'error', error: String(error && error.message || error), checkedAt: now().toISOString() }));
    const check = () => autoUpdater.checkForUpdates().catch(() => { /* reportado pelo evento 'error' */ });
    check();
    setIntervalFn(check, CHECK_INTERVAL_MS);
  }
  return { start, state };
}
module.exports = { createUpdater, plainNotes, CHECK_INTERVAL_MS };
