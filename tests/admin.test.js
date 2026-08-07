const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const codigoAdmin = fs.readFileSync(
  path.resolve(__dirname, "..", "JS", "admin.js"),
  "utf8",
);

function criarContextoAdmin(valores = {}) {
  const armazenamento = new Map(Object.entries(valores));
  const contexto = vm.createContext({
    Date,
    localStorage: {
      getItem: (chave) => armazenamento.get(chave) ?? null,
      setItem: (chave, valor) => armazenamento.set(chave, String(valor)),
      removeItem: (chave) => armazenamento.delete(chave),
    },
    document: {
      addEventListener() {},
    },
  });

  vm.runInContext(codigoAdmin, contexto);

  return { contexto, armazenamento };
}

test("reconhece sessão administrativa válida", () => {
  const { contexto } = criarContextoAdmin({
    "token-admin-efootball": "token",
    "expira-admin-efootball": String(Date.now() + 60000),
  });

  assert.equal(contexto.adminEstaAutenticado(), true);
});

test("remove sessão administrativa expirada", () => {
  const { contexto, armazenamento } = criarContextoAdmin({
    "token-admin-efootball": "token",
    "expira-admin-efootball": String(Date.now() - 1),
  });

  assert.equal(contexto.adminEstaAutenticado(), false);
  assert.equal(armazenamento.has("token-admin-efootball"), false);
  assert.equal(armazenamento.has("expira-admin-efootball"), false);
});

test("rejeita sessão sem token", () => {
  const { contexto } = criarContextoAdmin({
    "expira-admin-efootball": String(Date.now() + 60000),
  });

  assert.equal(contexto.adminEstaAutenticado(), false);
});
