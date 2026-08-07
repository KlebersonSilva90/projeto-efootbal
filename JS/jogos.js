// ======================================
// VERIFICA SE O CONFRONTO JÁ EXISTE
// ======================================

function confrontoJaExiste(idMandante, idVisitante, idJogoIgnorado = null) {
  return campeonato.jogos.some((jogo) => {
    if (
      idJogoIgnorado !== null &&
      Number(jogo.id) === Number(idJogoIgnorado)
    ) {
      return false;
    }

    return (
      (Number(jogo.mandante) === Number(idMandante) &&
        Number(jogo.visitante) === Number(idVisitante)) ||
      (Number(jogo.mandante) === Number(idVisitante) &&
        Number(jogo.visitante) === Number(idMandante))
    );
  });
}

// ======================================
// VERIFICA SE PARTICIPANTE JÁ JOGOU
// NA MESMA RODADA
// ======================================

function participanteJaJogouNaRodada(
  idParticipante,
  rodada,
  idJogoIgnorado = null,
) {
  return campeonato.jogos.some((jogo) => {
    if (
      idJogoIgnorado !== null &&
      Number(jogo.id) === Number(idJogoIgnorado)
    ) {
      return false;
    }

    return (
      Number(jogo.rodada) === Number(rodada) &&
      (Number(jogo.mandante) === Number(idParticipante) ||
        Number(jogo.visitante) === Number(idParticipante))
    );
  });
}

function filtrarEOrdenarJogos(jogos, rodada = "", participante = "") {
  return jogos
    .filter((jogo) => {
      const correspondeRodada =
        rodada === "" || Number(jogo.rodada) === Number(rodada);
      const correspondeParticipante =
        participante === "" ||
        Number(jogo.mandante) === Number(participante) ||
        Number(jogo.visitante) === Number(participante);

      return correspondeRodada && correspondeParticipante;
    })
    .sort(
      (a, b) =>
        Number(a.rodada) - Number(b.rodada) || Number(a.id) - Number(b.id),
    );
}

function combinarConfrontosEResultados(
  confrontos,
  jogos,
  rodada = "",
  participante = "",
  status = "",
) {
  return confrontos
    .map((confronto) => {
      const jogo = jogos.find(
        (item) =>
          Number(item.rodada) === Number(confronto.rodada) &&
          Number(item.mandante) === Number(confronto.mandante) &&
          Number(item.visitante) === Number(confronto.visitante),
      );

      return {
        ...confronto,
        jogo: jogo ?? null,
        concluido: Boolean(jogo),
      };
    })
    .filter((confronto) => {
      const correspondeRodada =
        rodada === "" || Number(confronto.rodada) === Number(rodada);
      const correspondeParticipante =
        participante === "" ||
        Number(confronto.mandante) === Number(participante) ||
        Number(confronto.visitante) === Number(participante);
      const correspondeStatus =
        status === "" ||
        (status === "concluido" && confronto.concluido) ||
        (status === "pendente" && !confronto.concluido);

      return (
        correspondeRodada && correspondeParticipante && correspondeStatus
      );
    })
    .sort(
      (a, b) =>
        Number(a.rodada) - Number(b.rodada) || Number(a.id) - Number(b.id),
    );
}

function obterConfrontoProgramado(rodada, mandante) {
  return campeonato.confrontos.find(
    (confronto) =>
      Number(confronto.rodada) === Number(rodada) &&
      Number(confronto.mandante) === Number(mandante),
  );
}

// ======================================
// VALIDA O JOGO
// ======================================

function validarJogo() {
  const rodada = elementos.rodada.value;
  const mandante = elementos.mandante.value;
  const visitante = elementos.visitante.value;
  const golsMandante = elementos.golMandante.value;
  const golsVisitante = elementos.golVisitante.value;

  const idJogoIgnorado = campeonato.jogoEmEdicao?.id ?? null;

  if (!rodada || Number(rodada) < 1) {
    mostrarNotificacao("Selecione uma rodada válida.", "aviso");
    return false;
  }

  if (!mandante) {
    mostrarNotificacao("Selecione o participante mandante.", "aviso");
    return false;
  }

  if (!visitante) {
    mostrarNotificacao("Selecione o participante visitante.", "aviso");
    return false;
  }

  if (mandante === visitante) {
    mostrarNotificacao(
      "O mandante e o visitante precisam ser participantes diferentes.",
      "aviso",
    );
    return false;
  }

  const confrontoProgramado = obterConfrontoProgramado(rodada, mandante);

  if (
    !confrontoProgramado ||
    Number(confrontoProgramado.visitante) !== Number(visitante)
  ) {
    mostrarNotificacao(
      "Este confronto não pertence à rodada selecionada.",
      "aviso",
    );
    return false;
  }

  if (
    golsMandante === "" ||
    !Number.isInteger(Number(golsMandante)) ||
    Number(golsMandante) < 0
  ) {
    mostrarNotificacao(
      "Informe uma quantidade válida de gols para o mandante.",
      "aviso",
    );
    return false;
  }

  if (
    golsVisitante === "" ||
    !Number.isInteger(Number(golsVisitante)) ||
    Number(golsVisitante) < 0
  ) {
    mostrarNotificacao(
      "Informe uma quantidade válida de gols para o visitante.",
      "aviso",
    );
    return false;
  }

  if (confrontoJaExiste(Number(mandante), Number(visitante), idJogoIgnorado)) {
    mostrarNotificacao("Esse confronto já foi cadastrado.", "aviso");
    return false;
  }

  if (
    participanteJaJogouNaRodada(
      Number(mandante),
      Number(rodada),
      idJogoIgnorado,
    )
  ) {
    const jogador = obterParticipante(Number(mandante));

    mostrarNotificacao(
      `${jogador?.nome ?? "O mandante"} já possui outro jogo cadastrado na rodada ${rodada}.`,
      "aviso",
    );

    return false;
  }

  if (
    participanteJaJogouNaRodada(
      Number(visitante),
      Number(rodada),
      idJogoIgnorado,
    )
  ) {
    const jogador = obterParticipante(Number(visitante));

    mostrarNotificacao(
      `${jogador?.nome ?? "O visitante"} já possui outro jogo cadastrado na rodada ${rodada}.`,
      "aviso",
    );

    return false;
  }

  return true;
}

// ======================================
// SALVA OU ATUALIZA O RESULTADO
// ======================================

async function salvarResultado() {
  if (!validarJogo()) {
    return;
  }

  const rodada = Number(elementos.rodada.value);
  const idMandante = Number(elementos.mandante.value);
  const idVisitante = Number(elementos.visitante.value);
  const golsMandante = Number(elementos.golMandante.value);
  const golsVisitante = Number(elementos.golVisitante.value);

  const jogo = {
    rodada,
    mandante: idMandante,
    visitante: idVisitante,
    golsMandante,
    golsVisitante,
  };

  const estaEditando = Boolean(campeonato.jogoEmEdicao);

  await executarOperacaoProtegida(
    elementos.salvarResultado,
    estaEditando ? "Atualizando..." : "Salvando...",
    async () => {
      try {
        if (estaEditando) {
          jogo.id = campeonato.jogoEmEdicao.id;
          await editarJogoAPI(jogo);
        } else {
          await salvarResultadoAPI(jogo);
        }

        await atualizarSistema();

        limparFormulario();
        mostrarNotificacao(
          estaEditando
            ? "Resultado atualizado com sucesso."
            : "Resultado salvo com sucesso.",
          "sucesso",
        );
      } catch (erro) {
        console.error("Erro ao salvar o resultado:", erro);
        mostrarNotificacao(
          `${
            estaEditando
              ? "Erro ao atualizar resultado"
              : "Erro ao salvar resultado"
          }: ${erro?.message || "falha desconhecida."}`,
          "erro",
          6000,
        );
      }
    },
  );
}

// ======================================
// ATUALIZA A TABELA DE JOGOS
// ======================================

function atualizarTabelaJogos() {
  const tbody = elementos.listaJogos;
  const confrontosFiltrados = combinarConfrontosEResultados(
    campeonato.confrontos ?? [],
    campeonato.jogos ?? [],
    elementos.filtroRodada?.value ?? "",
    elementos.filtroParticipante?.value ?? "",
    elementos.filtroStatus?.value ?? "",
  );

  limparElemento(tbody);

  if (!campeonato.confrontos || campeonato.confrontos.length === 0) {
    elementos.contadorJogos.textContent = "0 confrontos encontrados.";
    exibirMensagemTabela(tbody, "Nenhum confronto disponível.", 6);
    return;
  }

  const concluidos = confrontosFiltrados.filter(
    (confronto) => confronto.concluido,
  ).length;
  const pendentes = confrontosFiltrados.length - concluidos;

  elementos.contadorJogos.textContent = `${confrontosFiltrados.length} ${
    confrontosFiltrados.length === 1
      ? "confronto encontrado"
      : "confrontos encontrados"
  } — ${concluidos} concluído(s) e ${pendentes} pendente(s).`;

  if (confrontosFiltrados.length === 0) {
    exibirMensagemTabela(
      tbody,
      "Nenhum confronto encontrado para os filtros selecionados.",
      6,
    );
    return;
  }

  confrontosFiltrados.forEach((confronto) => {
    const mandante = obterParticipante(confronto.mandante);
    const visitante = obterParticipante(confronto.visitante);

    if (!mandante || !visitante) {
      return;
    }

    const tr = document.createElement("tr");
    const placar = confronto.concluido
      ? `${confronto.jogo.golsMandante} x ${confronto.jogo.golsVisitante}`
      : "— x —";

    adicionarCelula(tr, confronto.rodada);
    adicionarCelula(tr, mandante.nome);
    adicionarCelula(tr, placar, true);
    adicionarCelula(tr, visitante.nome);

    const tdStatus = document.createElement("td");
    const status = document.createElement("span");

    status.className = `status-confronto status-${
      confronto.concluido ? "concluido" : "pendente"
    }`;
    status.textContent = confronto.concluido ? "Concluído" : "Pendente";
    tdStatus.appendChild(status);
    tr.appendChild(tdStatus);

    const tdAcoes = document.createElement("td");

    if (!adminEstaAutenticado()) {
      tdAcoes.textContent = "—";
    } else if (confronto.concluido) {
      const botaoEditar = document.createElement("button");
      const botaoExcluir = document.createElement("button");

      botaoEditar.type = "button";
      botaoEditar.className = "btn-editar";
      botaoEditar.setAttribute(
        "aria-label",
        `Editar jogo ${confronto.jogo.id}`,
      );
      botaoEditar.title = "Editar jogo";
      botaoEditar.textContent = "✏️";
      botaoEditar.addEventListener("click", () =>
        editarJogo(confronto.jogo.id),
      );

      botaoExcluir.type = "button";
      botaoExcluir.className = "btn-excluir";
      botaoExcluir.setAttribute(
        "aria-label",
        `Excluir jogo ${confronto.jogo.id}`,
      );
      botaoExcluir.title = "Excluir jogo";
      botaoExcluir.textContent = "🗑️";
      botaoExcluir.addEventListener("click", () =>
        excluirJogo(confronto.jogo.id, botaoExcluir),
      );

      tdAcoes.append(botaoEditar, " ", botaoExcluir);
    } else {
      const botaoLancar = document.createElement("button");

      botaoLancar.type = "button";
      botaoLancar.className = "btn-editar";
      botaoLancar.setAttribute(
        "aria-label",
        `Lançar resultado do confronto ${confronto.id}`,
      );
      botaoLancar.title = "Lançar resultado";
      botaoLancar.textContent = "➕";
      botaoLancar.addEventListener("click", () =>
        selecionarConfronto(confronto),
      );

      tdAcoes.appendChild(botaoLancar);
    }

    tr.appendChild(tdAcoes);
    tbody.appendChild(tr);
  });
}

function selecionarConfronto(confronto) {
  elementos.rodada.value = String(confronto.rodada);
  atualizarMandantesDaRodada(confronto.mandante);

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// ======================================
// LIMPA O FORMULÁRIO
// ======================================

function limparFormulario() {
  elementos.rodada.value = "1";
  campeonato.jogoEmEdicao = null;
  elementos.salvarResultado.textContent = "Salvar Resultado";
  atualizarMandantesDaRodada();
}

// ======================================
// PREENCHE O FORMULÁRIO PARA EDIÇÃO
// ======================================

function editarJogo(id) {
  const jogo = campeonato.jogos.find((item) => item.id === Number(id));

  if (!jogo) {
    mostrarNotificacao("Jogo não encontrado.", "erro");
    return;
  }

  campeonato.jogoEmEdicao = jogo;

  elementos.rodada.value = String(jogo.rodada);
  atualizarMandantesDaRodada(jogo.mandante);

  elementos.golMandante.value = jogo.golsMandante;

  elementos.golVisitante.value = jogo.golsVisitante;

  elementos.salvarResultado.textContent = "💾 Atualizar Resultado";

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// ======================================
// EXCLUIR JOGO
// ======================================

async function excluirJogo(id, botao = null) {
  const jogo = campeonato.jogos.find((j) => Number(j.id) === Number(id));

  if (!jogo) {
    mostrarNotificacao("Jogo não encontrado.", "erro");
    return;
  }

  const mandante = obterParticipante(jogo.mandante);
  const visitante = obterParticipante(jogo.visitante);

  const confirmado = await solicitarConfirmacao({
    titulo: "Excluir jogo",
    mensagem: `Deseja realmente excluir este jogo?

Rodada ${jogo.rodada}

${mandante?.nome ?? "Mandante não encontrado"}
${jogo.golsMandante} x ${jogo.golsVisitante}
${visitante?.nome ?? "Visitante não encontrado"}`,
    textoConfirmar: "Excluir",
  });

  if (!confirmado) {
    return;
  }

  await executarOperacaoProtegida(botao, "Excluindo...", async () => {
    try {
      await excluirJogoAPI(id);
      await atualizarSistema();

      mostrarNotificacao("Jogo excluído com sucesso.", "sucesso");
    } catch (erro) {
      console.error("Erro ao excluir o jogo:", erro);
      mostrarNotificacao(
        `Erro ao excluir jogo: ${erro?.message || "falha desconhecida."}`,
        "erro",
        6000,
      );
    }
  });
}
