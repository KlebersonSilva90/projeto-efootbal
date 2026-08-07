// ======================================
// AUDITORIA DO CAMPEONATO
// ======================================

async function verificarInconsistencias() {
  const resultado = document.getElementById("resultadoAuditoria");

  const resumo = document.getElementById("resumoAuditoria");

  const lista = document.getElementById("listaInconsistencias");

  resultado.style.display = "block";

  resumo.textContent = "🔄 Verificando...";
  limparElemento(lista);

  try {
    const dados = await chamarAPI("verificarInconsistencias");

    if (!dados || !Array.isArray(dados.inconsistencias)) {
      resumo.textContent = "❌ Não foi possível realizar a verificação.";

      return;
    }

    const inconsistencias = dados.inconsistencias;

    if (inconsistencias.length === 0) {
      resumo.textContent = "✅ Nenhuma inconsistência encontrada.";

      return;
    }

    const tituloResumo = document.createElement("h3");

    tituloResumo.textContent = `⚠️ ${inconsistencias.length} inconsistência(s) encontrada(s)`;
    resumo.replaceChildren(tituloResumo);

    inconsistencias.forEach((inconsistencia) => {
      const div = document.createElement("div");

      div.className = "inconsistencia";

      const titulo = document.createElement("h4");
      const aviso = document.createElement("p");
      const total = document.createElement("strong");
      const ul = document.createElement("ul");

      titulo.textContent = `Rodada ${inconsistencia.rodada} — ${inconsistencia.participanteNome}`;
      aviso.append("⚠️ Este participante possui ");
      total.textContent = `${inconsistencia.totalJogos} jogos`;
      aviso.append(total, " nesta rodada.");

      const jogos = Array.isArray(inconsistencia.jogos)
        ? inconsistencia.jogos
        : [];

      jogos.forEach((jogo) => {
          const mandante = obterParticipante(jogo.mandante);

          const visitante = obterParticipante(jogo.visitante);

          const nomeMandante = mandante ? mandante.nome : `ID ${jogo.mandante}`;

          const nomeVisitante = visitante
            ? visitante.nome
            : `ID ${jogo.visitante}`;

          const li = document.createElement("li");
          const placar = document.createElement("strong");

          placar.textContent = `${jogo.golsMandante} x ${jogo.golsVisitante}`;
          li.append(
            `Jogo #${jogo.id} — ${nomeMandante} `,
            placar,
            ` ${nomeVisitante}`,
          );
          ul.appendChild(li);
        });

      div.append(titulo, aviso, ul);

      lista.appendChild(div);
    });
  } catch (erro) {
    console.error("Erro na auditoria:", erro);

    resumo.textContent = "❌ Erro ao verificar inconsistências.";
  }
}

// ======================================
// EVENTO DO BOTÃO
// ======================================

document.addEventListener("DOMContentLoaded", () => {
  const botao = document.getElementById("verificarInconsistencias");

  if (!botao) return;

  botao.addEventListener("click", () =>
    executarOperacaoProtegida(botao, "Verificando...", verificarInconsistencias),
  );
});
