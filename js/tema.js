function obterTemaInicial(temaSalvo, prefereEscuro) {
  if (temaSalvo === "claro" || temaSalvo === "escuro") {
    return temaSalvo;
  }

  return prefereEscuro ? "escuro" : "claro";
}

function obterTemaAtual() {
  return document.documentElement.dataset.theme === "escuro"
    ? "escuro"
    : "claro";
}

function atualizarBotaoTema() {
  const botao = document.getElementById("alternarTema");

  if (!botao) {
    return;
  }

  const temaEscuro = obterTemaAtual() === "escuro";
  const descricao = temaEscuro ? "Ativar modo claro" : "Ativar modo escuro";

  botao.textContent = temaEscuro ? "☀️" : "🌙";
  botao.setAttribute("aria-label", descricao);
  botao.title = descricao;
}

function aplicarTema(tema, persistir = false) {
  const temaNormalizado = tema === "escuro" ? "escuro" : "claro";

  document.documentElement.dataset.theme = temaNormalizado;
  document.documentElement.style.colorScheme =
    temaNormalizado === "escuro" ? "dark" : "light";

  if (persistir) {
    try {
      localStorage.setItem("tema-efootball", temaNormalizado);
    } catch (erro) {
      console.warn("Não foi possível salvar a preferência de tema.", erro);
    }
  }

  atualizarBotaoTema();
}

function alternarTema() {
  aplicarTema(obterTemaAtual() === "escuro" ? "claro" : "escuro", true);
}

(function iniciarTema() {
  let temaSalvo = null;

  try {
    temaSalvo = localStorage.getItem("tema-efootball");
  } catch (erro) {
    console.warn("Não foi possível ler a preferência de tema.", erro);
  }

  const prefereEscuro = window.matchMedia?.(
    "(prefers-color-scheme: dark)",
  ).matches;

  aplicarTema(obterTemaInicial(temaSalvo, Boolean(prefereEscuro)));

  document.addEventListener("DOMContentLoaded", () => {
    atualizarBotaoTema();
    document
      .getElementById("alternarTema")
      ?.addEventListener("click", alternarTema);
  });
})();
