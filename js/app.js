/**
 * Controlador Principal da Aplicação (UI, Eventos e Integração)
 */

import { 
  loginUser, 
  registerUser, 
  logoutUser, 
  initAuthListener 
} from "./auth.js";

import { 
  formatMonthTitle, 
  getNextMonthId, 
  adjustDateForWeekend, 
  loadMonthData, 
  queueSaveMonthData, 
  calculatePeriodTotals, 
  calculateMonthTotals 
} from "./finance.js";

// Estado da Aplicação
const state = {
  user: null,
  activeMonthId: "2026-09", // Começa em Setembro de 2026 por padrão
  availableMonths: ["2026-09", "2026-10", "2026-11", "2026-12"],
  monthData: null
};

// Referências DOM
const DOM = {
  authContainer: document.getElementById("auth-container"),
  appContainer: document.getElementById("app-container"),
  
  // Auth Elements
  loginTabBtn: document.getElementById("tab-login-btn"),
  signupTabBtn: document.getElementById("tab-signup-btn"),
  authForm: document.getElementById("auth-form"),
  authTitle: document.getElementById("auth-title"),
  authSubmitBtn: document.getElementById("auth-submit-btn"),
  emailInput: document.getElementById("email-input"),
  passwordInput: document.getElementById("password-input"),
  authAlert: document.getElementById("auth-alert"),
  
  // App Elements
  userEmailDisplay: document.getElementById("user-email-display"),
  btnLogout: document.getElementById("btn-logout"),
  syncBadge: document.getElementById("sync-badge"),
  monthTabsContainer: document.getElementById("month-tabs-container"),
  btnAddMonth: document.getElementById("btn-add-month"),
  
  // Summary Banner Elements
  monthEntradasTotal: document.getElementById("month-entradas-total"),
  monthSaidasTotal: document.getElementById("month-saidas-total"),
  monthSaldoTotal: document.getElementById("month-saldo-total"),
  
  // Periods Cards
  p15Card: document.getElementById("period-15-card"),
  p31Card: document.getElementById("period-31-card")
};

/**
 * Formata um valor numérico como moeda brasileira (R$)
 */
function formatCurrency(val) {
  const num = parseFloat(val) || 0;
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Atualiza o badge de sincronização com o Firestore
 * @param {"synced" | "saving" | "error"} status 
 */
function updateSyncStatus(status) {
  DOM.syncBadge.className = `sync-badge ${status}`;
  if (status === "synced") {
    DOM.syncBadge.innerHTML = `✓ Sincronizado`;
  } else if (status === "saving") {
    DOM.syncBadge.innerHTML = `⏳ Salvando...`;
  } else if (status === "error") {
    DOM.syncBadge.innerHTML = `⚠️ Erro ao salvar`;
  }
}

/**
 * Inicializa os Listeners de Autenticação e Eventos
 */
function init() {
  setupAuthEvents();
  
  initAuthListener(async (user) => {
    state.user = user;
    if (user) {
      DOM.userEmailDisplay.textContent = user.email;
      DOM.authContainer.classList.add("hidden");
      DOM.appContainer.classList.remove("hidden");
      await selectMonth(state.activeMonthId);
    } else {
      DOM.authContainer.classList.remove("hidden");
      DOM.appContainer.classList.add("hidden");
    }
  });
}

/**
 * Configura eventos da tela de login/cadastro
 */
function setupAuthEvents() {
  let isSignupMode = false;

  DOM.loginTabBtn.addEventListener("click", () => {
    isSignupMode = false;
    DOM.loginTabBtn.classList.add("active");
    DOM.signupTabBtn.classList.remove("active");
    DOM.authTitle.textContent = "Acessar Conta";
    DOM.authSubmitBtn.textContent = "Entrar";
    DOM.authAlert.classList.add("hidden");
  });

  DOM.signupTabBtn.addEventListener("click", () => {
    isSignupMode = true;
    DOM.signupTabBtn.classList.add("active");
    DOM.loginTabBtn.classList.remove("active");
    DOM.authTitle.textContent = "Criar Nova Conta";
    DOM.authSubmitBtn.textContent = "Cadastrar";
    DOM.authAlert.classList.add("hidden");
  });

  DOM.authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = DOM.emailInput.value.trim();
    const password = DOM.passwordInput.value.trim();

    if (!email || !password) {
      showAuthAlert("Por favor, preencha o e-mail e a senha.");
      return;
    }

    DOM.authSubmitBtn.disabled = true;
    DOM.authSubmitBtn.textContent = isSignupMode ? "Cadastrando..." : "Entrando...";

    let result;
    if (isSignupMode) {
      result = await registerUser(email, password);
    } else {
      result = await loginUser(email, password);
    }

    DOM.authSubmitBtn.disabled = false;
    DOM.authSubmitBtn.textContent = isSignupMode ? "Cadastrar" : "Entrar";

    if (!result.success) {
      showAuthAlert(result.error);
    } else {
      DOM.authAlert.classList.add("hidden");
    }
  });

  DOM.btnLogout.addEventListener("click", async () => {
    await logoutUser();
  });

  DOM.btnAddMonth.addEventListener("click", () => {
    const lastMonth = state.availableMonths[state.availableMonths.length - 1];
    const nextMonth = getNextMonthId(lastMonth);
    if (!state.availableMonths.includes(nextMonth)) {
      state.availableMonths.push(nextMonth);
      renderMonthTabs();
      selectMonth(nextMonth);
    }
  });
}

function showAuthAlert(msg) {
  DOM.authAlert.textContent = msg;
  DOM.authAlert.classList.remove("hidden");
}

/**
 * Seleciona e carrega os dados de um mês
 * @param {string} monthId 
 */
async function selectMonth(monthId) {
  state.activeMonthId = monthId;
  renderMonthTabs();

  updateSyncStatus("saving");
  try {
    state.monthData = await loadMonthData(state.user.uid, monthId);
    updateSyncStatus("synced");
    renderDashboard();
  } catch (err) {
    updateSyncStatus("error");
  }
}

/**
 * Renderiza as abas de meses navegáveis
 */
function renderMonthTabs() {
  DOM.monthTabsContainer.innerHTML = "";

  state.availableMonths.forEach((mId) => {
    const btn = document.createElement("button");
    btn.className = `month-tab ${mId === state.activeMonthId ? "active" : ""}`;
    btn.textContent = formatMonthTitle(mId);
    btn.addEventListener("click", () => selectMonth(mId));
    DOM.monthTabsContainer.appendChild(btn);
  });
}

/**
 * Renderiza todo o Dashboard Financeiro do mês ativo
 */
function renderDashboard() {
  if (!state.monthData) return;

  // 1. Atualizar Totais Gerais do Mês
  const monthTotals = calculateMonthTotals(state.monthData);
  DOM.monthEntradasTotal.textContent = formatCurrency(monthTotals.totalEntradas);
  DOM.monthSaidasTotal.textContent = formatCurrency(monthTotals.totalSaidas);
  DOM.monthSaldoTotal.textContent = formatCurrency(monthTotals.saldo);
  DOM.monthSaldoTotal.className = `summary-value ${monthTotals.saldo >= 0 ? "text-success" : "text-danger"}`;

  // 2. Renderizar os Cards dos dois Períodos (15 e 31)
  const [yearStr, monthStr] = state.activeMonthId.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  renderPeriodCard(DOM.p15Card, "p15", 15, year, month);
  renderPeriodCard(DOM.p31Card, "p31", 31, year, month);
}

/**
 * Renderiza o card de um período específico (p15 ou p31)
 */
function renderPeriodCard(container, periodKey, targetDay, year, month) {
  const periodData = state.monthData[periodKey];
  const dateInfo = adjustDateForWeekend(year, month, targetDay);
  const totals = calculatePeriodTotals(periodData);

  container.innerHTML = `
    <div class="period-header">
      <div class="period-title">
        🗓️ Período ${targetDay === 31 ? "31 (Fim de Mês)" : "Dia 15"}
      </div>
      <div class="date-badge ${dateInfo.isAdjusted ? "adjusted" : ""}">
        ${dateInfo.dateFormatted} (${dateInfo.dayOfWeekName})
        ${dateInfo.isAdjusted ? ` ⚠️ Ajustado de ${dateInfo.originalDateFormatted}` : ""}
      </div>
    </div>

    <!-- ENTRADAS -->
    <div class="section-container">
      <div class="section-header">
        <span class="section-title entradas">💵 Entradas (Receitas)</span>
      </div>
      <div class="items-list" id="${periodKey}-entradas-list"></div>
      <button class="btn-add-item" id="${periodKey}-add-entrada-btn">
        + Adicionar Entrada
      </button>
    </div>

    <!-- SAÍDAS -->
    <div class="section-container">
      <div class="section-header">
        <span class="section-title saidas">💳 Saídas (Despesas)</span>
      </div>
      <div class="items-list" id="${periodKey}-saidas-list"></div>
      <button class="btn-add-item" id="${periodKey}-add-saida-btn">
        + Adicionar Despesa
      </button>
    </div>

    <!-- RESUMO DO PERÍODO -->
    <div class="period-summary-footer">
      <div class="summary-row">
        <span>Entradas do Período:</span>
        <strong class="text-success">${formatCurrency(totals.totalEntradas)}</strong>
      </div>
      <div class="summary-row">
        <span>Saídas do Período:</span>
        <strong class="text-danger">${formatCurrency(totals.totalSaidas)}</strong>
      </div>
      <div class="summary-row total-saldo">
        <span>Saldo do Período:</span>
        <strong class="${totals.saldo >= 0 ? "text-success" : "text-danger"}">
          ${formatCurrency(totals.saldo)}
        </strong>
      </div>
    </div>
  `;

  // Renderiza itens de Entradas e Saídas
  const entradasContainer = container.querySelector(`#${periodKey}-entradas-list`);
  const saidasContainer = container.querySelector(`#${periodKey}-saidas-list`);

  renderItemsList(entradasContainer, periodData.entradas, periodKey, "entradas");
  renderItemsList(saidasContainer, periodData.saidas, periodKey, "saidas");

  // Botões de Adicionar
  container.querySelector(`#${periodKey}-add-entrada-btn`).addEventListener("click", () => {
    addItem(periodKey, "entradas");
  });

  container.querySelector(`#${periodKey}-add-saida-btn`).addEventListener("click", () => {
    addItem(periodKey, "saidas");
  });
}

/**
 * Renderiza a lista de itens (inputs de nome, valor, status e botão deletar)
 */
function renderItemsList(container, itemsList = [], periodKey, typeKey) {
  container.innerHTML = "";

  if (itemsList.length === 0) {
    container.innerHTML = `<div style="font-size: 0.8rem; color: #94a3b8; font-style: italic; padding: 0.25rem 0;">Nenhum item cadastrado</div>`;
    return;
  }

  itemsList.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "item-row";

    row.innerHTML = `
      <input type="text" class="item-name-input" value="${item.descricao}" placeholder="Descrição..." />
      <div class="item-amount-wrapper">
        <span class="currency-symbol">R$</span>
        <input type="number" step="0.01" min="0" class="item-amount-input" value="${item.valor || 0}" />
      </div>
      <button class="status-toggle-btn ${item.pago ? "pago" : "pendente"}">
        ${item.pago ? "✓ Pago" : "⏳ Pendente"}
      </button>
      <button class="btn-delete-item" title="Excluir item">🗑️</button>
    `;

    // Eventos dos Inputs
    const nameInput = row.querySelector(".item-name-input");
    const amountInput = row.querySelector(".item-amount-input");
    const toggleBtn = row.querySelector(".status-toggle-btn");
    const deleteBtn = row.querySelector(".btn-delete-item");

    nameInput.addEventListener("change", (e) => {
      item.descricao = e.target.value;
      triggerDataChange();
    });

    amountInput.addEventListener("change", (e) => {
      item.valor = parseFloat(e.target.value) || 0;
      triggerDataChange();
    });

    toggleBtn.addEventListener("click", () => {
      item.pago = !item.pago;
      triggerDataChange();
    });

    deleteBtn.addEventListener("click", () => {
      itemsList.splice(index, 1);
      triggerDataChange();
    });

    container.appendChild(row);
  });
}

/**
 * Adiciona um novo item ao período selecionado
 */
function addItem(periodKey, typeKey) {
  const newItem = {
    id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    descricao: typeKey === "entradas" ? "Nova Entrada" : "Nova Despesa",
    valor: 0,
    pago: false
  };

  state.monthData[periodKey][typeKey].push(newItem);
  triggerDataChange();
}

/**
 * Notifica a alteração nos dados: re-renderiza o dashboard e enfileira o salvamento no Firestore
 */
function triggerDataChange() {
  renderDashboard();
  queueSaveMonthData(state.user.uid, state.activeMonthId, state.monthData, (status) => {
    updateSyncStatus(status);
  });
}

// Inicializa o aplicativo após carregar a página
document.addEventListener("DOMContentLoaded", init);
