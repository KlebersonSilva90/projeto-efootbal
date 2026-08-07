const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const codigoResumo = fs.readFileSync(
  path.resolve(__dirname, "..", "JS", "resumo.js"),
  "utf8",
);

function calcularResumo(participantes, jogos, classificacao = []) {
  const contexto = vm.createContext({});

  vm.runInContext(codigoResumo, contexto);

  return JSON.parse(
    JSON.stringify(
      contexto.calcularResumoCampeonato(participantes, jogos, classificacao),
    ),
  );
}

test("calcula confrontos de turno único e jogos restantes", () => {
  const participantes = Array.from({ length: 8 }, (_, indice) => ({
    id: indice + 1,
  }));
  const jogos = Array.from({ length: 5 }, (_, indice) => ({
    id: indice + 1,
    rodada: indice < 4 ? 1 : 2,
    golsMandante: 2,
    golsVisitante: 1,
  }));

  const resumo = calcularResumo(participantes, jogos, [{ nome: "Guiga" }]);

  assert.equal(resumo.totalParticipantes, 8);
  assert.equal(resumo.jogosRealizados, 5);
  assert.equal(resumo.jogosRestantes, 23);
  assert.equal(resumo.rodadaAtual, 2);
  assert.equal(resumo.totalGols, 15);
  assert.equal(resumo.mediaGols, 3);
  assert.equal(resumo.lider, "Guiga");
  assert.equal(resumo.progresso, 18);
});

test("retorna valores neutros quando o campeonato está vazio", () => {
  const resumo = calcularResumo([], []);

  assert.deepEqual(resumo, {
    totalParticipantes: 0,
    jogosRealizados: 0,
    jogosRestantes: 0,
    rodadaAtual: null,
    totalGols: 0,
    mediaGols: 0,
    lider: null,
    progresso: 0,
  });
});

test("limita o progresso a cem por cento", () => {
  const participantes = [{ id: 1 }, { id: 2 }];
  const jogos = [
    { rodada: 1, golsMandante: 1, golsVisitante: 0 },
    { rodada: 2, golsMandante: 0, golsVisitante: 1 },
  ];

  const resumo = calcularResumo(participantes, jogos);

  assert.equal(resumo.jogosRestantes, 0);
  assert.equal(resumo.progresso, 100);
});
