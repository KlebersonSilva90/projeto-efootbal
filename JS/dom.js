// ======================================
// ELEMENTOS DO DOM
// ======================================

const elementos = {
  rodada: document.getElementById("rodada"),

  mandante: document.getElementById("mandante"),

  visitante: document.getElementById("visitante"),

  golMandante: document.getElementById("golMandante"),

  golVisitante: document.getElementById("golVisitante"),

  listaJogos: document.getElementById("listaJogos"),

  salvarResultado: document.getElementById("salvarResultado"),

  filtroRodada: document.getElementById("filtroRodada"),

  filtroParticipante: document.getElementById("filtroParticipante"),

  filtroStatus: document.getElementById("filtroStatus"),

  contadorJogos: document.getElementById("contadorJogos"),

  resumoParticipantes: document.getElementById("resumoParticipantes"),

  resumoJogosRealizados: document.getElementById("resumoJogosRealizados"),

  resumoJogosRestantes: document.getElementById("resumoJogosRestantes"),

  resumoRodadaAtual: document.getElementById("resumoRodadaAtual"),

  resumoTotalGols: document.getElementById("resumoTotalGols"),

  resumoMediaGols: document.getElementById("resumoMediaGols"),

  resumoLider: document.getElementById("resumoLider"),

  resumoProgressoTexto: document.getElementById("resumoProgressoTexto"),

  resumoProgresso: document.getElementById("resumoProgresso"),

  notificacoes: document.getElementById("notificacoes"),

  modalConfirmacao: document.getElementById("modalConfirmacao"),

  tituloConfirmacao: document.getElementById("tituloConfirmacao"),

  mensagemConfirmacao: document.getElementById("mensagemConfirmacao"),
};

function mostrarNotificacao(mensagem, tipo = "info", duracao = 4000) {
  if (!elementos.notificacoes) {
    alert(mensagem);
    return;
  }

  const notificacao = document.createElement("div");
  const texto = document.createElement("span");
  const botaoFechar = document.createElement("button");

  notificacao.className = `notificacao notificacao-${tipo}`;
  notificacao.setAttribute("role", tipo === "erro" ? "alert" : "status");

  texto.textContent = mensagem;

  botaoFechar.type = "button";
  botaoFechar.className = "notificacao-fechar";
  botaoFechar.textContent = "×";
  botaoFechar.title = "Fechar notificação";
  botaoFechar.setAttribute("aria-label", "Fechar notificação");

  const fechar = () => notificacao.remove();

  botaoFechar.addEventListener("click", fechar);
  notificacao.append(texto, botaoFechar);
  elementos.notificacoes.appendChild(notificacao);

  window.setTimeout(fechar, duracao);
}

function solicitarConfirmacao({ titulo, mensagem, textoConfirmar = "Confirmar" }) {
  const modal = elementos.modalConfirmacao;

  if (!modal || typeof modal.showModal !== "function") {
    return Promise.resolve(confirm(mensagem));
  }

  elementos.tituloConfirmacao.textContent = titulo;
  elementos.mensagemConfirmacao.textContent = mensagem;

  const botaoConfirmar = modal.querySelector('.btn-confirmar');
  botaoConfirmar.textContent = textoConfirmar;
  modal.returnValue = "";

  return new Promise((resolve) => {
    modal.addEventListener(
      "close",
      () => resolve(modal.returnValue === "confirmar"),
      { once: true },
    );

    modal.showModal();
  });
}

function limparElemento(elemento) {
  elemento.replaceChildren();
}

function criarOpcaoSelecione() {
  const option = document.createElement("option");

  option.value = "";
  option.textContent = "Selecione...";

  return option;
}

function exibirMensagemTabela(tbody, mensagem, totalColunas) {
  const tr = document.createElement("tr");
  const td = document.createElement("td");

  td.colSpan = totalColunas;
  td.textContent = mensagem;
  tr.appendChild(td);

  tbody.replaceChildren(tr);
}

function adicionarCelula(tr, conteudo, destacar = false) {
  const td = document.createElement("td");
  const elementoConteudo = destacar ? document.createElement("strong") : td;

  elementoConteudo.textContent = String(conteudo);

  if (destacar) {
    td.appendChild(elementoConteudo);
  }

  tr.appendChild(td);

  return td;
}

async function executarOperacaoProtegida(botao, textoTemporario, operacao) {
  if (campeonato.operacaoEmAndamento) {
    return false;
  }

  campeonato.operacaoEmAndamento = true;

  const textoOriginal = botao?.textContent;

  document.querySelectorAll("button:not(.alternar-tema)").forEach((item) => {
    item.disabled = true;
  });

  if (botao) {
    botao.textContent = textoTemporario;
    botao.setAttribute("aria-busy", "true");
  }

  try {
    await operacao();
    return true;
  } finally {
    campeonato.operacaoEmAndamento = false;

    document.querySelectorAll("button:not(.alternar-tema)").forEach((item) => {
      item.disabled = false;
    });

    if (botao) {
      if (botao.textContent === textoTemporario) {
        botao.textContent = textoOriginal;
      }

      botao.removeAttribute("aria-busy");
    }
  }
}
