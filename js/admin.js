function adminEstaAutenticado() {
  const token = localStorage.getItem("token-admin-efootball");
  const expiraEm = Number(localStorage.getItem("expira-admin-efootball"));

  if (!token || !expiraEm || expiraEm <= Date.now()) {
    localStorage.removeItem("token-admin-efootball");
    localStorage.removeItem("expira-admin-efootball");
    return false;
  }

  return true;
}

function atualizarInterfaceAdmin() {
  const autenticado = adminEstaAutenticado();
  const botaoAcesso = document.getElementById("acessoAdmin");

  document.body.classList.toggle("admin-autenticado", autenticado);
  document.querySelectorAll(".controle-admin").forEach((elemento) => {
    elemento.hidden = !autenticado;
  });

  if (botaoAcesso) {
    botaoAcesso.textContent = autenticado ? "Sair da administração" : "Área administrativa";
    botaoAcesso.setAttribute("aria-pressed", String(autenticado));
  }

  if (typeof campeonato !== "undefined" && typeof atualizarTabelaJogos === "function") {
    atualizarTabelaJogos();
  }
}

function encerrarSessaoAdmin() {
  localStorage.removeItem("token-admin-efootball");
  localStorage.removeItem("expira-admin-efootball");
  atualizarInterfaceAdmin();
  mostrarNotificacao("Sessão administrativa encerrada.", "sucesso");
}

async function entrarComoAdministrador(evento) {
  evento.preventDefault();

  const modal = document.getElementById("modalAdmin");
  const campoPIN = document.getElementById("pinAdmin");
  const botaoEntrar = document.getElementById("entrarAdmin");

  await executarOperacaoProtegida(botaoEntrar, "Entrando...", async () => {
    try {
      const sessao = await loginAdministradorAPI(campoPIN.value);

      localStorage.setItem("token-admin-efootball", sessao.token);
      localStorage.setItem("expira-admin-efootball", sessao.expiraEm);
      campoPIN.value = "";
      modal.close();
      atualizarInterfaceAdmin();

      if (!confrontosEstaoSincronizadosNoCliente(campeonato.confrontos)) {
        campeonato.confrontos = await tentarSincronizarConfrontos(
          campeonato.confrontos,
        );
        carregarRodadasConfrontos();
        atualizarMandantesDaRodada();
        atualizarTabelaJogos();
      }

      mostrarNotificacao("Área administrativa liberada.", "sucesso");
    } catch (erro) {
      mostrarNotificacao(
        `Não foi possível entrar: ${erro?.message || "falha desconhecida."}`,
        "erro",
        6000,
      );
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const botaoAcesso = document.getElementById("acessoAdmin");
  const modal = document.getElementById("modalAdmin");
  const campoPIN = document.getElementById("pinAdmin");

  atualizarInterfaceAdmin();

  botaoAcesso.addEventListener("click", () => {
    if (adminEstaAutenticado()) {
      encerrarSessaoAdmin();
      return;
    }

    modal.showModal();
    campoPIN.focus();
  });

  document
    .getElementById("cancelarLoginAdmin")
    .addEventListener("click", () => modal.close());
  document
    .getElementById("formLoginAdmin")
    .addEventListener("submit", entrarComoAdministrador);
});
