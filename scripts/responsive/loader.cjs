const ts = require('typescript');
module.exports = function(source) {
  if (/[/\\]actions[/\\]admin[/\\]/.test(this.resourcePath)) {
    const names = [...source.matchAll(/export\s+async\s+function\s+(\w+)/g)].map(m => m[1]);
    return names.map(name => `export async function ${name}(...args) { return window.__fixtureAction(${JSON.stringify(name)}, args); }`).join('\n');
  }
  if (this.resourcePath.endsWith('.css')) return '';
  return ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, esModuleInterop: true } }).outputText;
};
