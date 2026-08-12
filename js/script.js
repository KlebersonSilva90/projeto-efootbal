// ======================================
// INICIALIZAÇÃO DO SISTEMA
// ======================================

document.addEventListener("DOMContentLoaded", async () => {
  await executarOperacaoProtegida(
    elementos.salvarResultado,
    "Carregando...",
    iniciarSistema,
  );

  elementos.mandante.addEventListener("change", atualizarVisitantes);
  elementos.rodada.addEventListener("change", () =>
    atualizarMandantesDaRodada(),
  );

  elementos.salvarResultado.addEventListener("click", salvarResultado);

  elementos.filtroRodada.addEventListener("change", atualizarTabelaJogos);
  elementos.filtroParticipante.addEventListener(
    "change",
    atualizarTabelaJogos,
  );
  elementos.filtroStatus.addEventListener("change", atualizarTabelaJogos);
});

// ======================================
// CARREGA DADOS INICIAIS
// ======================================

async function iniciarSistema() {
  try {
    campeonato.participantes = (await buscarParticipantes()) ?? [];

    let confrontos = (await buscarConfrontos()) ?? [];

    if (!confrontosEstaoSincronizadosNoCliente(confrontos)) {
      confrontos = await tentarSincronizarConfrontos(confrontos);
    }

    campeonato.confrontos = Array.isArray(confrontos) ? confrontos : [];

    carregarParticipantes();
    carregarRodadasConfrontos();
    atualizarMandantesDaRodada();

    await atualizarSistema();
  } catch (erro) {
    console.error("Erro ao iniciar o sistema:", erro);
    mostrarNotificacao(
      `Erro ao iniciar o sistema: ${erro?.message || "falha desconhecida."}`,
      "erro",
      6000,
    );
  }
}

function confrontosEstaoSincronizadosNoCliente(confrontos) {
  const idsAtuais = campeonato.participantes
    .map((participante) => Number(participante.id))
    .sort((a, b) => a - b);
  const idsProgramados = [
    ...new Set(
      confrontos.flatMap((confronto) => [
        Number(confronto.mandante),
        Number(confronto.visitante),
      ]),
    ),
  ].sort((a, b) => a - b);

  return idsAtuais.length === idsProgramados.length &&
    idsAtuais.every((id, indice) => id === idsProgramados[indice]);
}

async function tentarSincronizarConfrontos(confrontosAtuais) {
  if (!adminEstaAutenticado()) {
    mostrarNotificacao(
      "A lista de participantes mudou. Entre como administrador para atualizar o calendário.",
      "aviso",
      7000,
    );
    return confrontosAtuais;
  }

  try {
    const confrontosAtualizados = await gerarConfrontosAPI();
    return Array.isArray(confrontosAtualizados)
      ? confrontosAtualizados
      : confrontosAtuais;
  } catch (erro) {
    mostrarNotificacao(
      erro?.message || "Não foi possível atualizar o calendário.",
      "aviso",
      9000,
    );
    return confrontosAtuais;
  }
}

// ======================================
// CARREGA AS RODADAS PROGRAMADAS
// ======================================

function carregarRodadasConfrontos() {
  const valorAtual = elementos.rodada.value;
  const rodadas = [
    ...new Set(campeonato.confrontos.map((confronto) => confronto.rodada)),
  ].sort((a, b) => Number(a) - Number(b));

  elementos.rodada.replaceChildren();

  rodadas.forEach((rodada) => {
    const option = document.createElement("option");

    option.value = rodada;
    option.textContent = `Rodada ${rodada}`;
    elementos.rodada.appendChild(option);
  });

  elementos.rodada.value = rodadas.some(
    (rodada) => String(rodada) === valorAtual,
  )
    ? valorAtual
    : String(rodadas[0] ?? "");
}

function atualizarMandantesDaRodada(idMandanteSelecionado = null) {
  const rodada = Number(elementos.rodada.value);
  const confrontosDaRodada = campeonato.confrontos.filter(
    (confronto) => Number(confronto.rodada) === rodada,
  );

  elementos.mandante.replaceChildren(criarOpcaoSelecione());

  confrontosDaRodada.forEach((confronto) => {
    const jogador = obterParticipante(confronto.mandante);

    if (!jogador) {
      return;
    }

    const option = document.createElement("option");

    option.value = jogador.id;
    option.textContent = `${jogador.nome} (${jogador.time})`;
    elementos.mandante.appendChild(option);
  });

  elementos.mandante.value = idMandanteSelecionado
    ? String(idMandanteSelecionado)
    : "";
  atualizarVisitantes();
}

function atualizarVisitantes() {
  const rodada = Number(elementos.rodada.value);
  const idMandante = Number(elementos.mandante.value);
  const confronto = obterConfrontoProgramado(rodada, idMandante);

  elementos.visitante.replaceChildren(criarOpcaoSelecione());

  if (!confronto) {
    campeonato.jogoEmEdicao = null;
    elementos.golMandante.value = 0;
    elementos.golVisitante.value = 0;
    elementos.salvarResultado.textContent = "Salvar Resultado";
    return;
  }

  const adversario = obterParticipante(confronto.visitante);

  if (!adversario) {
    return;
  }

  const option = document.createElement("option");

  option.value = adversario.id;
  option.textContent = `${adversario.nome} (${adversario.time})`;
  option.selected = true;
  elementos.visitante.appendChild(option);

  const jogoExistente = campeonato.jogos.find(
    (jogo) =>
      Number(jogo.rodada) === rodada &&
      Number(jogo.mandante) === idMandante &&
      Number(jogo.visitante) === Number(confronto.visitante),
  );

  campeonato.jogoEmEdicao = jogoExistente ?? null;
  elementos.golMandante.value = jogoExistente?.golsMandante ?? 0;
  elementos.golVisitante.value = jogoExistente?.golsVisitante ?? 0;
  elementos.salvarResultado.textContent = jogoExistente
    ? "💾 Atualizar Resultado"
    : "Salvar Resultado";
}

// ======================================
// ATUALIZA OS DADOS E A INTERFACE
// ======================================

async function atualizarSistema() {
  try {
    const [jogos, classificacao] = await Promise.all([
      buscarJogos(),
      buscarClassificacao(),
    ]);

    campeonato.jogos = Array.isArray(jogos) ? jogos : [];
    campeonato.classificacao = Array.isArray(classificacao)
      ? classificacao
      : [];

    atualizarTabelaJogos();
    atualizarTabelaClassificacao();
    atualizarResumoCampeonato();
  } catch (erro) {
    console.error("Erro ao atualizar os dados do sistema:", erro);
    throw erro;
  }
}
