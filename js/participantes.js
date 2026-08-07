// ======================================
// OBTÉM UM PARTICIPANTE PELO ID
// ======================================

function obterParticipante(id) {
  return campeonato.participantes.find(
    (participante) => participante.id === Number(id),
  );
}

// ======================================
// CARREGA PARTICIPANTES NOS SELECTS
// ======================================

function carregarParticipantes() {
  const mandante = document.getElementById("mandante");
  const visitante = document.getElementById("visitante");

  mandante.replaceChildren(criarOpcaoSelecione());
  visitante.replaceChildren(criarOpcaoSelecione());

  campeonato.participantes.forEach((jogador) => {
    const optionMandante = document.createElement("option");

    optionMandante.value = jogador.id;
    optionMandante.textContent = `${jogador.nome} (${jogador.time})`;

    const optionVisitante = optionMandante.cloneNode(true);

    mandante.appendChild(optionMandante);
    visitante.appendChild(optionVisitante);
  });

  carregarFiltroParticipantes();
}

function carregarFiltroParticipantes() {
  const filtro = elementos.filtroParticipante;

  if (!filtro) {
    return;
  }

  const valorSelecionado = filtro.value;
  const opcaoTodos = document.createElement("option");

  opcaoTodos.value = "";
  opcaoTodos.textContent = "Todos";
  filtro.replaceChildren(opcaoTodos);

  campeonato.participantes.forEach((jogador) => {
    const option = document.createElement("option");

    option.value = jogador.id;
    option.textContent = jogador.nome;
    filtro.appendChild(option);
  });

  filtro.value = valorSelecionado;
}
