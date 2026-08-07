function calcularResumoCampeonato(participantes, jogos, classificacao) {
  const totalParticipantes = participantes.length;
  const jogosRealizados = jogos.length;
  const totalJogos = (totalParticipantes * (totalParticipantes - 1)) / 2;
  const jogosRestantes = Math.max(0, totalJogos - jogosRealizados);
  const totalGols = jogos.reduce(
    (total, jogo) =>
      total + Number(jogo.golsMandante || 0) + Number(jogo.golsVisitante || 0),
    0,
  );
  const mediaGols = jogosRealizados > 0 ? totalGols / jogosRealizados : 0;
  const rodadaAtual = jogos.reduce(
    (maior, jogo) => Math.max(maior, Number(jogo.rodada) || 0),
    0,
  );
  const progresso =
    totalJogos > 0
      ? Math.min(100, Math.round((jogosRealizados / totalJogos) * 100))
      : 0;

  return {
    totalParticipantes,
    jogosRealizados,
    jogosRestantes,
    rodadaAtual: rodadaAtual || null,
    totalGols,
    mediaGols,
    lider: classificacao[0]?.nome ?? null,
    progresso,
  };
}

function atualizarResumoCampeonato() {
  const resumo = calcularResumoCampeonato(
    campeonato.participantes ?? [],
    campeonato.jogos ?? [],
    campeonato.classificacao ?? [],
  );

  elementos.resumoParticipantes.textContent = resumo.totalParticipantes;
  elementos.resumoJogosRealizados.textContent = resumo.jogosRealizados;
  elementos.resumoJogosRestantes.textContent = resumo.jogosRestantes;
  elementos.resumoRodadaAtual.textContent = resumo.rodadaAtual ?? "—";
  elementos.resumoTotalGols.textContent = resumo.totalGols;
  elementos.resumoMediaGols.textContent = resumo.mediaGols.toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );
  elementos.resumoLider.textContent = resumo.lider ?? "—";
  elementos.resumoProgressoTexto.textContent = `${resumo.progresso}%`;
  elementos.resumoProgresso.value = resumo.progresso;
}
