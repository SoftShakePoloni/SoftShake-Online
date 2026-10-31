const { contextBridge, ipcRenderer } = require('electron');

// Only narrow print IPC is exposed. No filesystem, shell or generic IPC access.
if (location.origin === 'https://softshake.com.br' && (location.pathname === '/admin' || location.pathname.startsWith('/admin/'))) {
  contextBridge.exposeInMainWorld('softshakeDesktop', {
    version: '1.1.1',
    getPrinters: () => ipcRenderer.invoke('softshake:printers'),
    selectPrinter: name => ipcRenderer.invoke('softshake:select-printer', name),
    openWindowsPrinters: () => ipcRenderer.invoke('softshake:windows-printers'),
    print: () => ipcRenderer.invoke('softshake:print'),
  });
  contextBridge.executeInMainWorld({ func: () => {
    try {
      if (localStorage.getItem('softshake-auto-print-device') === null) {
        localStorage.setItem('softshake-auto-print-device', '1');
        window.dispatchEvent(new Event('softshake-auto-print-device-change'));
      }
    } catch { /* The panel shows device storage failures normally. */ }
    // Compatible with the already deployed panel: keeps the receipt mounted until spooler callback.
    window.print = () => {
      window.softshakeDesktop.print().then(() => {
        window.dispatchEvent(new Event('afterprint'));
      }).catch(error => {
        window.dispatchEvent(new CustomEvent('softshake:print-error', { detail: String(error.message || error) }));
        window.dispatchEvent(new Event('afterprint'));
      });
    };
  } });
}
