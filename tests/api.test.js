const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const codigoAPI = fs.readFileSync(
  path.resolve(__dirname, "..", "JS", "api.js"),
  "utf8",
);

function criarAPI(fetch) {
  const armazenamento = new Map();
  const contexto = vm.createContext({
    CONFIG: { API_URL: "https://api.exemplo.test/exec" },
    URLSearchParams,
    fetch,
    localStorage: {
      getItem: (chave) => armazenamento.get(chave) ?? null,
      setItem: (chave, valor) => armazenamento.set(chave, String(valor)),
    },
    console: { error() {} },
  });

  vm.runInContext(codigoAPI, contexto);

  contexto.__armazenamento = armazenamento;

  return contexto;
}

test("retorna os dados de uma resposta bem-sucedida", async () => {
  const api = criarAPI(async () => ({
    ok: true,
    json: async () => ({ sucesso: true, dados: [{ id: 1 }] }),
  }));

  const dados = await api.chamarAPI("jogos");

  assert.deepEqual(JSON.parse(JSON.stringify(dados)), [{ id: 1 }]);
});

test("inclui ação e parâmetros na URL", async () => {
  let urlRecebida;
  const api = criarAPI(async (url) => {
    urlRecebida = url;
    return {
      ok: true,
      json: async () => ({ sucesso: true, dados: true }),
    };
  });

  await api.chamarAPI("editarJogo", { id: 7, rodada: 2 });

  const url = new URL(urlRecebida);
  assert.equal(url.searchParams.get("acao"), "editarJogo");
  assert.equal(url.searchParams.get("id"), "7");
  assert.equal(url.searchParams.get("rodada"), "2");
});

test("rejeita erro HTTP", async () => {
  const api = criarAPI(async () => ({
    ok: false,
    status: 503,
    statusText: "Service Unavailable",
  }));

  await assert.rejects(
    api.chamarAPI("jogos"),
    /status 503 \(Service Unavailable\)/,
  );
});

test("rejeita JSON inválido", async () => {
  const api = criarAPI(async () => ({
    ok: true,
    json: async () => {
      throw new SyntaxError("JSON inválido");
    },
  }));

  await assert.rejects(api.chamarAPI("jogos"), /resposta inválida/);
});

test("propaga a mensagem de erro retornada pelo backend", async () => {
  const api = criarAPI(async () => ({
    ok: true,
    json: async () => ({ sucesso: false, mensagem: "Jogo não encontrado." }),
  }));

  await assert.rejects(api.chamarAPI("editarJogo"), /Jogo não encontrado/);
});

test("envia mutações por POST com token administrativo", async () => {
  let requisicao;
  const api = criarAPI(async (url, opcoes) => {
    requisicao = { url, opcoes };
    return {
      ok: true,
      json: async () => ({ sucesso: true, dados: { id: 7 } }),
    };
  });

  api.__armazenamento.set("token-admin-efootball", "token-assinado");
  await api.chamarAPI("editarJogo", { id: 7 }, "POST");

  const corpo = JSON.parse(requisicao.opcoes.body);
  assert.equal(requisicao.opcoes.method, "POST");
  assert.equal(requisicao.opcoes.headers["Content-Type"], "text/plain;charset=utf-8");
  assert.deepEqual(corpo, {
    acao: "editarJogo",
    id: 7,
    token: "token-assinado",
  });
});
