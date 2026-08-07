const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const arquivoClassificacao = path.resolve(
  __dirname,
  "..",
  "Google Apps Script",
  "Classificacao.gs.txt",
);

function calcular(participantes, jogos) {
  const contexto = vm.createContext({
    listarParticipantesJSON: () => structuredClone(participantes),
    listarJogosJSON: () => structuredClone(jogos),
    resposta: (objeto) => objeto,
  });

  vm.runInContext(fs.readFileSync(arquivoClassificacao, "utf8"), contexto);

  return JSON.parse(JSON.stringify(contexto.calcularClassificacao()));
}

test("calcula vitória, empate, derrota, gols e saldo", () => {
  const participantes = [
    { id: 1, nome: "Ana", time: "A" },
    { id: 2, nome: "Bruno", time: "B" },
    { id: 3, nome: "Carlos", time: "C" },
  ];
  const jogos = [
    { mandante: 1, visitante: 2, golsMandante: 2, golsVisitante: 0 },
    { mandante: 2, visitante: 3, golsMandante: 1, golsVisitante: 1 },
  ];

  const tabela = calcular(participantes, jogos);
  const ana = tabela.find((item) => item.id === 1);
  const bruno = tabela.find((item) => item.id === 2);

  assert.deepEqual(
    {
      pontos: ana.pontos,
      jogos: ana.jogos,
      vitorias: ana.vitorias,
      gp: ana.gp,
      gc: ana.gc,
      sg: ana.sg,
    },
    { pontos: 3, jogos: 1, vitorias: 1, gp: 2, gc: 0, sg: 2 },
  );
  assert.deepEqual(
    {
      pontos: bruno.pontos,
      jogos: bruno.jogos,
      empates: bruno.empates,
      derrotas: bruno.derrotas,
    },
    { pontos: 1, jogos: 2, empates: 1, derrotas: 1 },
  );
});

test("ordena por pontos, vitórias, saldo, gols pró e nome", () => {
  const participantes = [
    { id: 1, nome: "Zeca", time: "A" },
    { id: 2, nome: "Ana", time: "B" },
    { id: 3, nome: "Bia", time: "C" },
  ];
  const jogos = [
    { mandante: 1, visitante: 3, golsMandante: 1, golsVisitante: 0 },
    { mandante: 2, visitante: 3, golsMandante: 2, golsVisitante: 0 },
  ];

  const tabela = calcular(participantes, jogos);

  assert.deepEqual(
    tabela.map((item) => item.nome),
    ["Ana", "Zeca", "Bia"],
  );
  assert.deepEqual(
    tabela.map((item) => item.posicao),
    [1, 2, 3],
  );
});

test("ignora jogo que referencia participante inexistente", () => {
  const tabela = calcular(
    [{ id: 1, nome: "Ana", time: "A" }],
    [{ mandante: 1, visitante: 99, golsMandante: 5, golsVisitante: 0 }],
  );

  assert.equal(tabela[0].jogos, 0);
  assert.equal(tabela[0].pontos, 0);
});

test("usa confronto direto após empate nos quatro critérios principais", () => {
  const participantes = [
    { id: 1, nome: "Zeca", time: "A" },
    { id: 2, nome: "Ana", time: "B" },
    { id: 3, nome: "Carlos", time: "C" },
    { id: 4, nome: "Davi", time: "D" },
  ];
  const jogos = [
    { mandante: 1, visitante: 2, golsMandante: 2, golsVisitante: 1 },
    { mandante: 1, visitante: 3, golsMandante: 0, golsVisitante: 1 },
    { mandante: 2, visitante: 4, golsMandante: 1, golsVisitante: 0 },
  ];

  const tabela = calcular(participantes, jogos);
  const posicaoZeca = tabela.findIndex((item) => item.id === 1);
  const posicaoAna = tabela.findIndex((item) => item.id === 2);

  assert.ok(posicaoZeca < posicaoAna);
});

test("usa ordem alfabética quando confronto direto múltiplo também empata", () => {
  const participantes = [
    { id: 1, nome: "Carlos", time: "A" },
    { id: 2, nome: "Ana", time: "B" },
    { id: 3, nome: "Bruno", time: "C" },
  ];
  const jogos = [
    { mandante: 1, visitante: 2, golsMandante: 1, golsVisitante: 0 },
    { mandante: 2, visitante: 3, golsMandante: 1, golsVisitante: 0 },
    { mandante: 3, visitante: 1, golsMandante: 1, golsVisitante: 0 },
  ];

  const tabela = calcular(participantes, jogos);

  assert.deepEqual(
    tabela.map((item) => item.nome),
    ["Ana", "Bruno", "Carlos"],
  );
});
