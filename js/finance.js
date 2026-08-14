/**
 * Lógica Financeira, Ajuste de Datas e Manipulação do Firestore
 */

import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

// Timer global para debounce de salvamento
let saveDebounceTimer = null;

const DIAS_DA_SEMANA = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", 
  "Quinta-feira", "Sexta-feira", "Sábado"
];

const MESES_NOME = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

/**
 * Retorna o nome formatado do mês/ano a partir do ID (ex: "2026-09" -> "Setembro de 2026")
 * @param {string} monthId 
 */
export function formatMonthTitle(monthId) {
  const [yearStr, monthStr] = monthId.split("-");
  const monthIdx = parseInt(monthStr, 10) - 1;
  return `${MESES_NOME[monthIdx]} de ${yearStr}`;
}

/**
 * Retorna o mês anterior no formato "YYYY-MM"
 * @param {string} monthId 
 */
export function getPreviousMonthId(monthId) {
  const [yearStr, monthStr] = monthId.split("-");
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) - 1;
  if (month < 1) {
    month = 12;
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Retorna o próximo mês no formato "YYYY-MM"
 * @param {string} monthId 
 */
export function getNextMonthId(monthId) {
  const [yearStr, monthStr] = monthId.split("-");
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) + 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Ajusta automaticamente a data de vencimento se cair em final de semana.
 * As datas de cada mês de referência correspondem ao mês ANTERIOR (ex.: para Setembro/2026,
 * as datas de vencimento/recebimento são 15/08/2026 e 31/08/2026).
 * Se cair no Sábado (dia 6) ou Domingo (dia 0), ajusta para a Sexta-feira anterior.
 * 
 * @param {number} targetYear Ano do mês de referência (ex: 2026)
 * @param {number} targetMonth Mês de referência (1 a 12, ex: 9 para Setembro)
 * @param {number} targetPeriodDay (15 ou 31)
 */
export function adjustDateForWeekend(targetYear, targetMonth, targetPeriodDay) {
  // O período financeiro utiliza o mês anterior ao mês de referência
  let calcMonth = targetMonth - 1;
  let calcYear = targetYear;
  if (calcMonth < 1) {
    calcMonth = 12;
    calcYear -= 1;
  }

  // Obtém o último dia do mês anterior (ex.: 28, 30 ou 31)
  const lastDayOfMonth = new Date(calcYear, calcMonth, 0).getDate();
  const baseDay = targetPeriodDay === 31 ? lastDayOfMonth : targetPeriodDay;
  
  const baseDate = new Date(calcYear, calcMonth - 1, baseDay);
  const dayOfWeek = baseDate.getDay(); // 0: Domingo, 6: Sábado

  let adjustedDay = baseDay;
  let isAdjusted = false;
  let originalDayName = DIAS_DA_SEMANA[dayOfWeek];

  if (dayOfWeek === 6) { // Sábado -> Sexta anterior (-1 dia)
    adjustedDay = baseDay - 1;
    isAdjusted = true;
  } else if (dayOfWeek === 0) { // Domingo -> Sexta anterior (-2 dias)
    adjustedDay = baseDay - 2;
    isAdjusted = true;
  }

  const finalDate = new Date(calcYear, calcMonth - 1, adjustedDay);
  const finalDayOfWeek = finalDate.getDay();
  const finalDayName = DIAS_DA_SEMANA[finalDayOfWeek];

  const pad = (n) => String(n).padStart(2, '0');
  const dateFormatted = `${pad(adjustedDay)}/${pad(calcMonth)}/${calcYear}`;
  const originalDateFormatted = `${pad(baseDay)}/${pad(calcMonth)}/${calcYear}`;

  return {
    dateFormatted,
    dayOfWeekName: finalDayName,
    isAdjusted,
    originalDateFormatted,
    originalDayName,
    adjustedDay
  };
}

/**
 * Cria a estrutura inicial com despesas fixas pré-cadastradas
 */
export function createDefaultMonthData(monthId) {
  return {
    monthId,
    p15: {
      entradas: [
        { id: `ent_${Date.now()}_1`, descricao: "Entrada Principal", valor: 0, pago: false }
      ],
      saidas: [
        { id: `sai_${Date.now()}_1`, descricao: "Carro", valor: 0, pago: false },
        { id: `sai_${Date.now()}_2`, descricao: "Cartão Santander", valor: 0, pago: false },
        { id: `sai_${Date.now()}_3`, descricao: "Gás", valor: 0, pago: false },
        { id: `sai_${Date.now()}_4`, descricao: "Seguro Residência", valor: 0, pago: false },
        { id: `sai_${Date.now()}_5`, descricao: "Cartão Mercado Pago", valor: 0, pago: false }
      ]
    },
    p31: {
      entradas: [],
      saidas: [
        { id: `sai_${Date.now()}_6`, descricao: "Água", valor: 0, pago: false },
        { id: `sai_${Date.now()}_7`, descricao: "Luz", valor: 0, pago: false },
        { id: `sai_${Date.now()}_8`, descricao: "Claro", valor: 0, pago: false },
        { id: `sai_${Date.now()}_9`, descricao: "Ajuda Mãe", valor: 0, pago: false }
      ]
    }
  };
}

/**
 * Herança entre meses: Cria dados para um novo mês copiando os valores do mês anterior
 * @param {string} monthId 
 * @param {Object} previousMonthData 
 */
export function inheritFromPreviousMonth(monthId, previousMonthData) {
  if (!previousMonthData) {
    return createDefaultMonthData(monthId);
  }

  const copyPeriodItems = (items = []) => {
    return items.map(item => ({
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      descricao: item.descricao,
      valor: item.valor || 0,
      pago: false // Reseta o status pago para o novo mês
    }));
  };

  return {
    monthId,
    p15: {
      entradas: copyPeriodItems(previousMonthData.p15?.entradas),
      saidas: copyPeriodItems(previousMonthData.p15?.saidas)
    },
    p31: {
      entradas: copyPeriodItems(previousMonthData.p31?.entradas),
      saidas: copyPeriodItems(previousMonthData.p31?.saidas)
    }
  };
}

/**
 * Busca os dados de um mês específico no Firestore.
 * Caso não exista, tenta buscar o mês anterior para aplicar herança de valores.
 * 
 * @param {string} uid User ID no Firebase
 * @param {string} monthId ID do mês (ex.: "2026-09")
 */
export async function loadMonthData(uid, monthId) {
  try {
    const docRef = doc(db, "users", uid, "meses", monthId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    }

    // Se o mês não existe, busca o mês anterior para herdar valores
    const prevMonthId = getPreviousMonthId(monthId);
    const prevDocRef = doc(db, "users", uid, "meses", prevMonthId);
    const prevDocSnap = await getDoc(prevDocRef);

    let newMonthData;
    if (prevDocSnap.exists()) {
      newMonthData = inheritFromPreviousMonth(monthId, prevDocSnap.data());
    } else {
      newMonthData = createDefaultMonthData(monthId);
    }

    // Salva o novo mês inicializado no Firestore
    await setDoc(docRef, newMonthData);
    return newMonthData;

  } catch (error) {
    console.error("Erro ao carregar mês do Firestore:", error);
    throw error;
  }
}

/**
 * Salva as alterações de um mês no Firestore com Debounce
 * 
 * @param {string} uid 
 * @param {string} monthId 
 * @param {Object} monthData 
 * @param {Function} onStatusChange Callback para atualizar status ("saving", "synced", "error")
 */
export function queueSaveMonthData(uid, monthId, monthData, onStatusChange) {
  if (onStatusChange) onStatusChange("saving");

  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
  }

  saveDebounceTimer = setTimeout(async () => {
    try {
      const docRef = doc(db, "users", uid, "meses", monthId);
      await setDoc(docRef, monthData, { merge: true });
      if (onStatusChange) onStatusChange("synced");
    } catch (error) {
      console.error("Erro ao salvar dados no Firestore:", error);
      if (onStatusChange) onStatusChange("error");
    }
  }, 600); // 600ms debounce
}

/**
 * Calcula totais de um período (p15 ou p31)
 * @param {Object} periodData 
 */
export function calculatePeriodTotals(periodData = {}) {
  const entradas = periodData.entradas || [];
  const saidas = periodData.saidas || [];

  const totalEntradas = entradas.reduce((acc, item) => acc + (parseFloat(item.valor) || 0), 0);
  const totalSaidas = saidas.reduce((acc, item) => acc + (parseFloat(item.valor) || 0), 0);
  const saldo = totalEntradas - totalSaidas;

  return { totalEntradas, totalSaidas, saldo };
}

/**
 * Calcula totais consolidados do mês inteiro
 * @param {Object} monthData 
 */
export function calculateMonthTotals(monthData = {}) {
  const p15Totals = calculatePeriodTotals(monthData.p15);
  const p31Totals = calculatePeriodTotals(monthData.p31);

  const totalEntradas = p15Totals.totalEntradas + p31Totals.totalEntradas;
  const totalSaidas = p15Totals.totalSaidas + p31Totals.totalSaidas;
  const saldo = totalEntradas - totalSaidas;

  return { totalEntradas, totalSaidas, saldo };
}
