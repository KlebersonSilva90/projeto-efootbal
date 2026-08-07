// ======================================
// CARREGA A CLASSIFICAÇÃO
// ======================================

async function carregarClassificacao() {
  campeonato.classificacao = await buscarClassificacao();

  atualizarTabelaClassificacao();
}

// ======================================
// ATUALIZA A TABELA
// ======================================

function atualizarTabelaClassificacao() {
  const tbody = document.getElementById("listaClassificacao");

  limparElemento(tbody);

  if (!campeonato.classificacao || campeonato.classificacao.length === 0) {
    exibirMensagemTabela(tbody, "Nenhuma classificação disponível.", 10);

    return;
  }

  campeonato.classificacao.forEach((participante) => {
    const tr = document.createElement("tr");

    adicionarCelula(tr, participante.posicao);
    adicionarCelula(tr, participante.nome);
    adicionarCelula(tr, participante.pontos);
    adicionarCelula(tr, participante.jogos);
    adicionarCelula(tr, participante.vitorias);
    adicionarCelula(tr, participante.empates);
    adicionarCelula(tr, participante.derrotas);
    adicionarCelula(tr, participante.gp);
    adicionarCelula(tr, participante.gc);
    adicionarCelula(tr, participante.sg);

    tbody.appendChild(tr);
  });
}
