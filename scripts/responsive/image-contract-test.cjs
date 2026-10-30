const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), ts = require('typescript');
const { createRequire } = require('node:module');
function load(file, mocks = {}) {
  const absolute = path.resolve(file), native = createRequire(absolute), mod = { exports: {} };
  const req = name => mocks[name] ?? (name === 'server-only' ? {} : name.startsWith('@/') ? load('src/' + name.slice(2) + '.ts', mocks) : name.startsWith('.') ? load(path.resolve(path.dirname(absolute), name) + '.ts', mocks) : native(name));
  new Function('require', 'module', 'exports', ts.transpileModule(fs.readFileSync(absolute, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText)(req, mod, mod.exports);
  return mod.exports;
}
(async () => {
  const { imageProxyUrl } = load('src/lib/image/proxy-url.ts');
  const stable = imageProxyUrl('Produtos/acai.webp');
  assert.equal(imageProxyUrl(stable), stable);
  assert.equal(imageProxyUrl('https://project.supabase.co/storage/v1/object/sign/SoftShake%20Images/Produtos/acai.webp?token=old'), stable);
  assert.equal(imageProxyUrl('https://project.supabase.co/storage/v1/object/sign/SoftShake%20Images/Produtos/acai.webp?token=new'), stable);
  for (const src of ['blob:preview', 'data:image/png;base64,test', '/logo.webp', 'https://images.unsplash.com/test']) assert.equal(imageProxyUrl(src), src);
  assert.equal(imageProxyUrl('/api/imagem?path=Produtos%2Facai.webp'), stable);

  let downloads = 0, options;
  const source = load('src/lib/image/source.server.ts', { '@/integrations/supabase/client.server': { createServerClient: () => ({ storage: { from: () => ({ async download(path, transform, params) { downloads++; options = params; await new Promise(resolve => setTimeout(resolve, 20)); return { data: new Blob(['image-bytes'], { type: 'image/webp' }) }; } }) } }) } });
  const [a, b] = await Promise.all([source.readStorageImage('SoftShake Images', 'Produtos/acai.webp'), source.readStorageImage('SoftShake Images', 'Produtos/acai.webp')]);
  assert.equal(downloads, 1);
  assert.equal(a, b);
  assert.equal(options.cache, 'force-cache');
  assert.equal(options.next.revalidate, 3600);
  await source.readStorageImage('SoftShake Images', 'Produtos/acai-1793350000000.webp');
  assert.equal(options.next.revalidate, 31536000);

  const { processImage } = load('src/lib/image/processor.ts');
  const sharp = require('sharp');
  assert.equal(require.resolve('sharp'), require.resolve('sharp', { paths: [require.resolve('next')] }), 'Next and upload must use one native Sharp version');
  const original = await sharp({ create: { width: 1600, height: 800, channels: 4, background: { r: 120, g: 30, b: 190, alpha: 0.5 } } }).png().toBuffer();
  const processed = await processImage(original, 'Açaí original.png');
  const metadata = await sharp(processed.buffer).metadata();
  assert.equal(metadata.width, 1200); assert.equal(metadata.height, 600); assert.equal(metadata.hasAlpha, true);
  assert.match(processed.filename, /^acai-original-\d{13}\.webp$/);
  assert.equal(await sharp(original).metadata().then(m => m.width), 1600, 'Input was not replaced');
  let uploaded;
  const { uploadImageToStorage } = load('src/lib/image/upload.ts', { '@/integrations/supabase/client.server': { createServiceRoleClient: () => ({ storage: { from: () => ({ upload: async (path, buffer, config) => { uploaded = { path, buffer, config }; return { data: { path } }; }, getPublicUrl: path => ({ data: { publicUrl: path } }) }) } }) } });
  await uploadImageToStorage(processed.buffer, processed.filename);
  assert.equal(uploaded.config.upsert, false);
  assert.equal(uploaded.config.contentType, 'image/webp');
  assert.equal(uploaded.config.cacheControl, '31536000');
  console.log('Image contracts passed: stable URLs, concurrent-source deduplication, version-safe cache, one Sharp version, alpha/aspect preservation and mocked upload without overwrite. No Storage writes.');
})().catch(error => { console.error(error); process.exitCode = 1; });
