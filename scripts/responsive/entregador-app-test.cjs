/** App do entregador (mobile/entregador): regras puras e garantias de segurança. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const APP = "mobile/entregador";
function load(file) {
  const mod = { exports: {} };
  const out = ts.transpileModule(fs.readFileSync(path.resolve(file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  new Function("require", "module", "exports", out)(require, mod, mod.exports);
  return mod.exports;
}
const lib = load(`${APP}/src/lib/entregas.ts`);
const read = (f) => fs.readFileSync(path.join(APP, f), "utf8");

test("endereço do cardápio (jsonb ou texto) vira linhas legíveis", () => {
  const e = lib.formatarEndereco({ logradouro: "Rua das Flores", numero: "120", bairro: "Centro", cidade: "Poloni", estado: "SP", cep: "15160-000", complemento: "Apto 3", referencia: "Ao lado da padaria" });
  assert.equal(e.linha1, "Rua das Flores, 120 — Centro");
  assert.equal(e.linha2, "Poloni/SP · CEP 15160-000");
  assert.equal(e.complemento, "Apto 3");
  assert.equal(e.referencia, "Ao lado da padaria");
  assert.equal(lib.formatarEndereco(JSON.stringify({ logradouro: "Rua A", numero: "1" })).linha1, "Rua A, 1");
  assert.equal(lib.formatarEndereco("Rua B, 2").linha1, "Rua B, 2");
  assert.equal(lib.formatarEndereco(null).linha1, "Endereço não informado");
});

test("pagamento: forma e valor sempre; troco só em dinheiro", () => {
  assert.deepEqual(lib.resumoPagamento({ meio_pagamento: "pix", total: 45, troco_para: "50" }), { forma: "Pix", valor: "R$ 45,00", troco: null, levarTroco: false });
  const din = lib.resumoPagamento({ meio_pagamento: "dinheiro", total: 45, troco_para: "100" });
  assert.equal(din.forma, "Dinheiro");
  assert.equal(din.levarTroco, true);
  assert.equal(din.troco, "Levar R$ 55,00 de troco (cliente paga com R$ 100,00)");
  assert.equal(lib.resumoPagamento({ meio_pagamento: "dinheiro", total: 45, troco_para: null }).troco, "Sem troco");
  assert.equal(lib.resumoPagamento({ meio_pagamento: "dinheiro", total: 45, troco_para: "45" }).troco, "Sem troco");
  assert.equal(lib.resumoPagamento({ meio_pagamento: "cartao", total: 10, troco_para: null }).forma, "Cartão");
  assert.equal(lib.parseTroco("R$ 1.234,50"), 1234.5);
  assert.equal(lib.parseTroco("não"), null);
});

test("telefone e horário de saída", () => {
  assert.equal(lib.formatarTelefone("5517991234567"), "(17) 99123-4567");
  assert.equal(lib.formatarTelefone("1733334444"), "(17) 3333-4444");
  assert.equal(lib.linkTelefone("(17) 99123-4567"), "tel:17991234567");
  assert.equal(lib.linkTelefone(""), null);
  const saiu = Date.parse("2026-11-04T17:30:00Z");
  assert.equal(lib.horaSaida("2026-11-04T17:30:00Z", saiu + 12 * 60000), "Saiu às 14:30 · há 12 min");
});

test("erros do banco e do login viram mensagens claras", () => {
  assert.equal(lib.traduzirErro({ message: "NAO_ENTREGADOR" }).tipo, "sem_acesso");
  assert.equal(lib.traduzirErro({ message: "ENTREGADOR_INATIVO" }).tipo, "desativado");
  assert.equal(lib.traduzirErro({ message: "User is banned" }).tipo, "desativado");
  assert.equal(lib.traduzirErro({ message: "PEDIDO_INDISPONIVEL" }).tipo, "indisponivel");
  assert.equal(lib.traduzirErro({ message: "Invalid login credentials" }).mensagem, "E-mail ou senha incorretos.");
  assert.equal(lib.traduzirErro({ message: "TypeError: Network request failed" }).tipo, "conexao");
});

test("lista do banco é normalizada sem quebrar com dados faltando", () => {
  const [e] = lib.normalizarEntregas([{ id: "abc", numero: "ABC12345", cliente_nome: "Ana", itens: [{ qtd: 2, nome: "Açaí", obs: null }], total: "45.50", meio_pagamento: "pix" }]);
  assert.equal(e.total, 45.5);
  assert.deepEqual(e.itens, [{ qtd: 2, nome: "Açaí", obs: null }]);
  assert.deepEqual(lib.normalizarEntregas(null), []);
});

test("app só fala com o banco pelas funções e pelo canal privado da migration 0019", () => {
  const migration = fs.readFileSync("supabase/migrations/0019_entregadores.sql", "utf8");
  const codigo = ["src/hooks/useAuth.ts", "src/hooks/useEntregas.ts", "src/lib/supabase.ts", "App.tsx"].map(read).join("\n");
  for (const rpc of codigo.matchAll(/\.rpc\("(\w+)"/g)) assert.match(migration, new RegExp(`FUNCTION public\\.${rpc[1]}\\(`), rpc[1]);
  assert.doesNotMatch(codigo, /\.from\("pedidos"\)|\.from\('pedidos'\)/, "nada de ler/alterar pedidos direto");
  assert.match(codigo, /channel\(`entregador:\$\{userId\}`, \{ config: \{ private: true \} \}\)/);
  assert.match(migration, /'entregador:' \|\| alvo::text/);
  assert.match(codigo, /event: "entregas_mudaram"/);
  assert.match(migration, /'entregas_mudaram'/);
  assert.match(codigo, /realtime\.setAuth/);
});

test("sem chave secreta, sem cadastro público, sessão no SecureStore", () => {
  const todos = ["App.tsx", "app.json", ".env.example", "src/lib/supabase.ts", "src/lib/secureStorage.ts", "src/hooks/useAuth.ts", "src/screens/LoginScreen.tsx"].map(read).join("\n");
  assert.doesNotMatch(todos, /SERVICE_ROLE_KEY|sb_secret_/i, "nenhuma chave secreta no app");
  assert.doesNotMatch(read("src/lib/supabase.ts") + read("src/hooks/useAuth.ts"), /signUp|signInWithOAuth|signInWithOtp/);
  assert.match(read("src/lib/supabase.ts"), /storage: secureStorage/);
  assert.match(read(".gitignore"), /\.env\*\.local/);
});

test("concluir: botão travado durante o envio e card só sai com a confirmação do servidor", () => {
  const card = read("src/components/EntregaCard.tsx");
  assert.match(card, /if \(enviando\) return;/);
  assert.match(card, /carregando=\{enviando\}/);
  const hook = read("src/hooks/useEntregas.ts");
  const concluir = hook.slice(hook.indexOf("const concluir"));
  assert.ok(concluir.indexOf("if (error)") < concluir.indexOf("setEntregas((lista) => lista.filter"), "remove só depois de conferir o erro");
  assert.match(hook, /state === "background"[\s\S]*desconectar\(\)/, "fecha o canal em segundo plano");
  assert.doesNotMatch(hook, /setInterval/, "sem polling");
});
