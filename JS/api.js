// ======================================
// FUNÇÃO GENÉRICA
// ======================================

async function chamarAPI(acao, parametros = {}, metodo = "GET") {
  try {
    let url = CONFIG.API_URL;
    const opcoes = {};

    if (metodo === "POST") {
      const token = localStorage.getItem("token-admin-efootball");

      opcoes.method = "POST";
      opcoes.headers = {
        "Content-Type": "text/plain;charset=utf-8",
      };
      opcoes.body = JSON.stringify({
        acao,
        ...parametros,
        ...(token ? { token } : {}),
      });
    } else {
      const query = new URLSearchParams({
        acao,
        ...parametros,
      });

      url = `${CONFIG.API_URL}?${query.toString()}`;
    }

    const resposta = await fetch(url, opcoes);

    if (!resposta.ok) {
      throw new Error(
        `A API respondeu com o status ${resposta.status} (${resposta.statusText}).`,
      );
    }

    let json;

    try {
      json = await resposta.json();
    } catch {
      throw new Error("A API retornou uma resposta inválida.");
    }

    if (!json || typeof json !== "object") {
      throw new Error("A API retornou uma resposta vazia ou inválida.");
    }

    if (json.sucesso !== true) {
      throw new Error(json.mensagem || "A operação não foi concluída pela API.");
    }

    return json.dados;
  } catch (erro) {
    console.error(`Erro na ação "${acao}"`, erro);

    throw erro;
  }
}

// ======================================
// PARTICIPANTES
// ======================================

async function buscarParticipantes() {
  return await chamarAPI("participantes");
}

// ======================================
// JOGOS
// ======================================

async function buscarJogos() {
  return await chamarAPI("jogos");
}

async function buscarConfrontos() {
  return await chamarAPI("confrontos");
}

async function gerarConfrontosAPI() {
  return await chamarAPI("gerarConfrontos", {}, "POST");
}

async function salvarResultadoAPI(jogo) {
  return await chamarAPI("salvarJogo", {
    rodada: jogo.rodada,
    mandante: jogo.mandante,
    visitante: jogo.visitante,
    golsMandante: jogo.golsMandante,
    golsVisitante: jogo.golsVisitante,
  }, "POST");
}

// ======================================
// EDITAR JOGO
// ======================================

async function editarJogoAPI(jogo) {
  return await chamarAPI("editarJogo", {
    id: jogo.id,
    rodada: jogo.rodada,
    mandante: jogo.mandante,
    visitante: jogo.visitante,
    golsMandante: jogo.golsMandante,
    golsVisitante: jogo.golsVisitante,
  }, "POST");
}

// ======================================
// EXCLUIR JOGO
// ======================================

async function excluirJogoAPI(id) {
  return await chamarAPI("excluirJogo", {
    id,
  }, "POST");
}

async function loginAdministradorAPI(pin) {
  return await chamarAPI("login", { pin }, "POST");
}

// ======================================
// CLASSIFICAÇÃO
// ======================================

async function buscarClassificacao() {
  return await chamarAPI("classificacao");
}
