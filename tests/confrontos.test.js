const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const codigo = fs.readFileSync(
  path.resolve(
    __dirname,
    "..",
    "Google Apps Script",
    "Confrontos.gs.txt",
  ),
  "utf8",
);

function gerar(ids) {
  const contexto = vm.createContext({});

  vm.runInContext(codigo, contexto);

  return JSON.parse(JSON.stringify(contexto.montarConfrontos(ids)));
}

test("gera sete rodadas e 28 confrontos para oito participantes", () => {
  const confrontos = gerar([1, 2, 3, 4, 5, 6, 7, 8]);

  assert.equal(confrontos.length, 28);
  assert.equal(new Set(confrontos.map((item) => item.rodada)).size, 7);

  for (let rodada = 1; rodada <= 7; rodada++) {
    assert.equal(
      confrontos.filter((item) => item.rodada === rodada).length,
      4,
    );
  }
});

test("cada dupla se enfrenta uma única vez", () => {
  const confrontos = gerar([1, 2, 3, 4, 5, 6, 7, 8]);
  const duplas = confrontos.map((item) =>
    [item.mandante, item.visitante].sort((a, b) => a - b).join("-"),
  );

  assert.equal(new Set(duplas).size, 28);
});

test("nenhum participante joga duas vezes na mesma rodada", () => {
  const confrontos = gerar([1, 2, 3, 4, 5, 6, 7, 8]);

  for (let rodada = 1; rodada <= 7; rodada++) {
    const participantes = confrontos
      .filter((item) => item.rodada === rodada)
      .flatMap((item) => [item.mandante, item.visitante]);

    assert.equal(new Set(participantes).size, participantes.length);
  }
});

test("preserva os confrontos já cadastrados nas duas primeiras rodadas", () => {
  const confrontos = gerar([1, 2, 3, 4, 5, 6, 7, 8]);
  const rodada1 = confrontos
    .filter((item) => item.rodada === 1)
    .map((item) => `${item.mandante}-${item.visitante}`);
  const rodada2 = confrontos
    .filter((item) => item.rodada === 2)
    .map((item) => `${item.mandante}-${item.visitante}`);

  assert.deepEqual(rodada1, ["1-5", "2-6", "3-7", "4-8"]);
  assert.ok(rodada2.includes("2-8"));
});

test("trata quantidade ímpar com uma folga por rodada", () => {
  const confrontos = gerar([1, 2, 3, 4, 5]);

  assert.equal(confrontos.length, 10);
  assert.equal(new Set(confrontos.map((item) => item.rodada)).size, 5);

  for (let rodada = 1; rodada <= 5; rodada++) {
    assert.equal(
      confrontos.filter((item) => item.rodada === rodada).length,
      2,
    );
  }
});
