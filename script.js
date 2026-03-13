/* =========================
   CONFIGURAÇÕES
========================= */

const SHEETS_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTMOXxCgbTiCkB6YKsJiI59OCt_bUvU5XyCEsmhujItFUTdLDmw9_fuOYnLbbOGVVCmQsgbTXcWsw4D/pub?output=csv';

const API_URL =
  'https://script.google.com/macros/s/AKfycbxYOBTihSuzq3ZIPx9HYLHRmbPNvPO7hLXmBZEjThqTlsgkfM3oRXUvBoE63s8xe0yc/exec';

/* =========================
   CARREGAR PRESENTES
========================= */

let todosOsPresentes = [];
let listaExpandida = false;

fetch(SHEETS_URL)
  .then(res => res.text())
  .then(csv => {
    const lines = csv.trim().split('\n');
    const headers = lines.shift().split(',');

    todosOsPresentes = lines.map(line => {
      const values = line.split(',');
      return Object.fromEntries(
        headers.map((h, i) => [h.trim(), values[i]?.trim()])
      );
    });

    renderizarPresentes();
  })
  .catch(err => {
    console.error('Erro ao carregar presentes:', err);
  });

function renderizarPresentes() {
  const giftsContainer = document.getElementById('gifts-list');
  giftsContainer.innerHTML = '';

  const presentesParaMostrar = listaExpandida
    ? todosOsPresentes
    : todosOsPresentes.slice(0, 3);

  presentesParaMostrar.forEach(data => {
    const ativo = data.ativo === 'TRUE';
    const pessoa = data.pessoa || '';
    const mensagem = data.mensagem || '';

    const card = document.createElement('div');
    card.className = 'gift-card';

    card.innerHTML = `
      <img src="images/${data.imagem}" class="gift-image" alt="${data.nome}">
      <h3 class="gift-title">${data.nome}</h3>
      <p class="gift-description">${data.descricao}</p>
      <p class="gift-price">R$ ${parseFloat(data.preco).toFixed(2)}</p>

      <div class="gift-status">
        ${
          ativo
            ? `
              <p class="gift-placeholder">&nbsp;</p>
              <p class="gift-placeholder">&nbsp;</p>
            `
            : `
              <p class="gift-buyer">
                🎁 Presente dado por <strong>${pessoa}</strong>
              </p>
              <p class="gift-message">
                “${mensagem || 'Sem mensagem'}”
              </p>
            `
        }
      </div>
    `;

    const btn = document.createElement('button');
    btn.className = ativo ? 'btn btn-primary' : 'btn btn-disabled';
    btn.textContent = ativo
      ? 'Comprar este presente'
      : 'Presente já comprado';

    btn.disabled = !ativo;

    if (ativo) {
      btn.onclick = () => comprarPresente(data);
    }

    card.appendChild(btn);
    giftsContainer.appendChild(card);
  });

  atualizarBotaoToggle();
}

const toggleBtn = document.getElementById('toggleGiftsBtn');

toggleBtn.onclick = () => {
  listaExpandida = !listaExpandida;
  renderizarPresentes();
};

function atualizarBotaoToggle() {
  toggleBtn.textContent = listaExpandida
    ? 'Mostrar menos presentes'
    : 'Ver todos os presentes';

  toggleBtn.style.display =
    todosOsPresentes.length <= 3 ? 'none' : 'inline-block';
}

/* =========================
   COMPRAR PRESENTE
========================= */

let presenteSelecionado = null;

function comprarPresente(data) {
  presenteSelecionado = data;
  document.getElementById('popupPresente').style.display = 'flex';
}

function fecharPopup() {
  document.getElementById('popupPresente').style.display = 'none';
}

function enviarPresente() {
  const pessoa = document.getElementById('nomePessoa').value.trim();
  const mensagem = document.getElementById('mensagemPessoa').value.trim();

  if (!pessoa) {
    alert('Por favor, digite seu nome');
    return;
  }

  const url =
    API_URL +
    '?action=create-payment' +
    '&id=' + encodeURIComponent(presenteSelecionado.id) +
    '&pessoa=' + encodeURIComponent(pessoa) +
    '&mensagem=' + encodeURIComponent(mensagem);

  window.location.href = url;
}


/* =========================
   CONFIG RSVP
========================= */

const RSVP_SHEETS_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vT6ut7HurFnnkZiObhp2RC6TMSoGAAbR2Z_39SicJYVc32jZ67f-Gu5i7V0EjKovfiGtIuZtXRBKUNb/pub?output=csv';

const RSVP_API_URL =
  'https://script.google.com/macros/s/AKfycbz7lzI8KMKW2B1a7ddDxK1iIRq_IoPFqGZXIZVILQsjBz_--RydyhbFnDrxVVOxvpN7/exec';

/* =========================
   ABRIR POPUP
========================= */

document.querySelector('.rsvp-section .btn').onclick = abrirRSVP;

function abrirRSVP() {
  document.getElementById('popupRSVP').style.display = 'flex';
  carregarConvidados();
}

function fecharRSVP() {
  document.getElementById('popupRSVP').style.display = 'none';
}

/* =========================
   CARREGAR CONVIDADOS
========================= */

function carregarConvidados() {
  fetch(RSVP_SHEETS_URL)
    .then(res => res.text())
    .then(csv => {
      const linhas = csv.trim().split('\n');
      linhas.shift(); // remove cabeçalho

      const select = document.getElementById('listaConvidados');
      select.innerHTML = '<option value="">Selecione seu nome</option>';

      linhas.forEach(linha => {
        const [nome, confirmado] = linha.split(',');

        if (confirmado.trim() === 'FALSE') {
          const option = document.createElement('option');
          option.value = nome.trim();
          option.textContent = nome.trim();
          select.appendChild(option);
        }
      });
    })
    .catch(err => {
      console.error('Erro ao carregar convidados:', err);
    });
}

/* =========================
   CONFIRMAR PRESÊNCIA
========================= */

function confirmarPresenca() {
  const select = document.getElementById('listaConvidados');
  const nome = select.value;

  if (!nome) {
    alert('Selecione seu nome');
    return;
  }

  const botao = document.getElementById('btnConfirmarPresenca');

  // feedback imediato
  botao.textContent = 'Confirmando...';
  botao.disabled = true;

  fetch(RSVP_API_URL, {
    method: 'POST',
    body: JSON.stringify({
      action: 'confirmar-presenca',
      nome: nome
    })
  })
    .then(res => res.text())
    .then(() => {
      fecharRSVP();
      abrirPopupSucesso();

      // remove nome da lista (UX bonito)
      select.querySelector(`option[value="${nome}"]`)?.remove();
      select.value = '';
    })
    .catch(() => {
      alert('Erro ao confirmar presença');

      // restaura botão se falhar
      botao.textContent = 'Confirmar presença';
      botao.disabled = false;
    });
}

function abrirPopupSucesso() {
  document.getElementById('popupSucesso').style.display = 'flex';
}

function fecharPopupSucesso() {
  document.getElementById('popupSucesso').style.display = 'none';

  const botao = document.getElementById('btnConfirmarPresenca');
  botao.textContent = 'Confirmar presença';
  botao.disabled = false;
}
