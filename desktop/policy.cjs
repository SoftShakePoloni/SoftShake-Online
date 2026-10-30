const ORIGIN = 'https://softshake.com.br';
const START_URL = ORIGIN + '/admin/pedidos';
function trustedUrl(value) {
  try { const url = new URL(value); return url.origin === ORIGIN && (url.pathname === '/admin' || url.pathname.startsWith('/admin/')); } catch { return false; }
}
function physicalPrinter(printer) {
  return !/Microsoft Print to PDF|OneNote|XPS|Fax|Save as PDF/i.test([printer.name, printer.displayName, printer.description].join(' '));
}
function selectPrinter(printers, configuredName) {
  const physical = printers.filter(physicalPrinter);
  if (configuredName) return physical.find(printer => printer.name === configuredName) || null;
  return physical.find(printer => printer.isDefault) || (physical.length === 1 ? physical[0] : null);
}
module.exports = { ORIGIN, START_URL, trustedUrl, physicalPrinter, selectPrinter };
