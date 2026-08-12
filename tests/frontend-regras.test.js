const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const raiz = path.resolve(__dirname, "..");

test("atributo hidden prevalece sobre os layouts dos controles administrativos", () => {
  const css = fs.readFileSync(path.join(raiz, "css", "style.css"), "utf8");

  assert.match(css, /\[hidden\]\s*\{[^}]*display:\s*none\s*!important;/s);
});

test("formulário administrativo permanece oculto no celular sem login", () => {
  const css = fs.readFileSync(
    path.join(raiz, "css", "responsive.css"),
    "utf8",
  );

  assert.match(
    css,
    /@media\s*\(max-width:\s*449px\)[\s\S]*body:not\(\.admin-autenticado\) \.controle-admin[\s\S]*display:\s*none\s*!important;/,
  );
});

function criarContextoFrontend() {
  const notificacoes = [];
  const elementos = {
    rodada: { value: "1" },
    mandante: { value: "1" },
    visitante: { value: "2" },
    golMandante: { value: "0" },
    golVisitante: { value: "0" },
  };

  const contexto = vm.createContext({
    console,
    elementos,
    notificacoes,
    mostrarNotificacao: (mensagem, tipo) =>
      notificacoes.push({ mensagem, tipo }),
    obterParticipante: (id) => ({ id, nome: `Jogador ${id}` }),
  });

  for (const arquivo of ["JS/campeonato.js", "JS/jogos.js"]) {
    const codigo = fs.readFileSync(path.join(raiz, arquivo), "utf8");
    vm.runInContext(codigo, contexto, { filename: arquivo });
  }

  return { contexto, elementos, notificacoes };
}

function definirJogos(contexto, jogos, jogoEmEdicao = null) {
  contexto.__jogosTeste = jogos;
  contexto.__jogoEmEdicaoTeste = jogoEmEdicao;
  vm.runInContext(
    "campeonato.jogos = __jogosTeste; campeonato.jogoEmEdicao = __jogoEmEdicaoTeste; campeonato.confrontos = [{ rodada: 1, mandante: 1, visitante: 2 }];",
    contexto,
  );
}

test("detecta confronto duplicado independentemente da ordem e do tipo do ID", () => {
  const { contexto } = criarContextoFrontend();

  definirJogos(contexto, [
    { id: "10", rodada: "1", mandante: "1", visitante: "2" },
  ]);

  assert.equal(contexto.confrontoJaExiste(1, 2), true);
  assert.equal(contexto.confrontoJaExiste(2, 1), true);
  assert.equal(contexto.confrontoJaExiste(1, 3), false);
});

test("edição ignora o próprio jogo nas validações", () => {
  const { contexto } = criarContextoFrontend();
  const jogo = { id: 10, rodada: 1, mandante: 1, visitante: 2 };

  definirJogos(contexto, [jogo], jogo);

  assert.equal(contexto.confrontoJaExiste(1, 2, 10), false);
  assert.equal(contexto.participanteJaJogouNaRodada(1, 1, 10), false);
});

test("detecta participante repetido na mesma rodada", () => {
  const { contexto } = criarContextoFrontend();

  definirJogos(contexto, [
    { id: 1, rodada: 2, mandante: 1, visitante: 3 },
  ]);

  assert.equal(contexto.participanteJaJogouNaRodada(1, 2), true);
  assert.equal(contexto.participanteJaJogouNaRodada(3, 2), true);
  assert.equal(contexto.participanteJaJogouNaRodada(1, 3), false);
});

test("rejeita gols negativos e decimais", () => {
  const { contexto, elementos, notificacoes } = criarContextoFrontend();

  definirJogos(contexto, []);

  elementos.golMandante.value = "-1";
  assert.equal(contexto.validarJogo(), false);

  elementos.golMandante.value = "1.5";
  assert.equal(contexto.validarJogo(), false);

  assert.equal(notificacoes.length, 2);
  assert.match(notificacoes[0].mensagem, /gols para o mandante/i);
});

test("aceita um jogo válido", () => {
  const { contexto } = criarContextoFrontend();

  definirJogos(contexto, []);

  assert.equal(contexto.validarJogo(), true);
});

test("rejeita confronto diferente do calendário da rodada", () => {
  const { contexto, elementos, notificacoes } = criarContextoFrontend();

  definirJogos(contexto, []);
  elementos.visitante.value = "3";

  assert.equal(contexto.validarJogo(), false);
  assert.match(notificacoes[0].mensagem, /não pertence à rodada/i);
});

test("filtra jogos por rodada e participante sem alterar a lista original", () => {
  const { contexto } = criarContextoFrontend();
  const jogos = [
    { id: 3, rodada: 2, mandante: 1, visitante: 2 },
    { id: 2, rodada: 1, mandante: 3, visitante: 1 },
    { id: 1, rodada: 1, mandante: 2, visitante: 4 },
  ];

  const resultado = contexto.filtrarEOrdenarJogos(jogos, "1", "1");

  assert.deepEqual(
    JSON.parse(JSON.stringify(resultado.map((jogo) => jogo.id))),
    [2],
  );
  assert.deepEqual(
    jogos.map((jogo) => jogo.id),
    [3, 2, 1],
  );
});

test("ordena os jogos por rodada e depois por ID", () => {
  const { contexto } = criarContextoFrontend();
  const jogos = [
    { id: 4, rodada: 2, mandante: 1, visitante: 2 },
    { id: 3, rodada: 1, mandante: 3, visitante: 4 },
    { id: 1, rodada: 1, mandante: 2, visitante: 3 },
  ];

  const resultado = contexto.filtrarEOrdenarJogos(jogos);

  assert.deepEqual(
    JSON.parse(JSON.stringify(resultado.map((jogo) => jogo.id))),
    [1, 3, 4],
  );
});

test("combina calendário com resultados e mantém confrontos pendentes", () => {
  const { contexto } = criarContextoFrontend();
  const confrontos = [
    { id: 1, rodada: 1, mandante: 1, visitante: 2 },
    { id: 2, rodada: 1, mandante: 3, visitante: 4 },
  ];
  const jogos = [
    {
      id: 10,
      rodada: 1,
      mandante: 1,
      visitante: 2,
      golsMandante: 2,
      golsVisitante: 1,
    },
  ];

  const resultado = contexto.combinarConfrontosEResultados(
    confrontos,
    jogos,
  );
  const simplificado = resultado.map((item) => ({
    id: item.id,
    concluido: item.concluido,
    jogoId: item.jogo?.id ?? null,
  }));

  assert.deepEqual(JSON.parse(JSON.stringify(simplificado)), [
    { id: 1, concluido: true, jogoId: 10 },
    { id: 2, concluido: false, jogoId: null },
  ]);
});

test("filtra confrontos por status, rodada e participante", () => {
  const { contexto } = criarContextoFrontend();
  const confrontos = [
    { id: 1, rodada: 1, mandante: 1, visitante: 2 },
    { id: 2, rodada: 2, mandante: 3, visitante: 1 },
  ];
  const jogos = [
    { id: 10, rodada: 1, mandante: 1, visitante: 2 },
  ];

  const pendentes = contexto.combinarConfrontosEResultados(
    confrontos,
    jogos,
    "2",
    "1",
    "pendente",
  );
  const concluidos = contexto.combinarConfrontosEResultados(
    confrontos,
    jogos,
    "",
    "",
    "concluido",
  );

  assert.deepEqual(
    JSON.parse(JSON.stringify(pendentes.map((item) => item.id))),
    [2],
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(concluidos.map((item) => item.id))),
    [1],
  );
});
