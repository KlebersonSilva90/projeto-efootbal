const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const codigoTema = fs.readFileSync(
  path.resolve(__dirname, "..", "JS", "tema.js"),
  "utf8",
);

function criarContextoTema({ temaSalvo = null, prefereEscuro = false } = {}) {
  const armazenamento = new Map();

  if (temaSalvo !== null) {
    armazenamento.set("tema-efootball", temaSalvo);
  }

  const documentElement = { dataset: {}, style: {} };
  const contexto = vm.createContext({
    document: {
      documentElement,
      getElementById: () => null,
      addEventListener() {},
    },
    window: {
      matchMedia: () => ({ matches: prefereEscuro }),
    },
    localStorage: {
      getItem: (chave) => armazenamento.get(chave) ?? null,
      setItem: (chave, valor) => armazenamento.set(chave, valor),
    },
    console: { warn() {} },
  });

  vm.runInContext(codigoTema, contexto);

  return { contexto, documentElement, armazenamento };
}

test("usa a preferência salva antes da preferência do sistema", () => {
  const { documentElement } = criarContextoTema({
    temaSalvo: "claro",
    prefereEscuro: true,
  });

  assert.equal(documentElement.dataset.theme, "claro");
  assert.equal(documentElement.style.colorScheme, "light");
});

test("usa o modo escuro do sistema quando não existe preferência salva", () => {
  const { documentElement } = criarContextoTema({ prefereEscuro: true });

  assert.equal(documentElement.dataset.theme, "escuro");
  assert.equal(documentElement.style.colorScheme, "dark");
});

test("alternar tema persiste a nova escolha", () => {
  const { contexto, documentElement, armazenamento } = criarContextoTema({
    temaSalvo: "claro",
  });

  contexto.alternarTema();

  assert.equal(documentElement.dataset.theme, "escuro");
  assert.equal(armazenamento.get("tema-efootball"), "escuro");

  contexto.alternarTema();

  assert.equal(documentElement.dataset.theme, "claro");
  assert.equal(armazenamento.get("tema-efootball"), "claro");
});

test("ignora valores de tema inválidos", () => {
  const { documentElement } = criarContextoTema({
    temaSalvo: "azul",
    prefereEscuro: false,
  });

  assert.equal(documentElement.dataset.theme, "claro");
});
