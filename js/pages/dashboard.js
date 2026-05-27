import { formatMoney, parseDateValue, getMonthKey, compareExpensesByNewest } from '../utils.js';

export class DashboardPage {
  constructor(state) {
    this.state = state;
  }

  init() {
    this.balanceValueEl = document.querySelector("#balanceValue");
    this.monthlyValueEl = document.querySelector("#monthlyValue");
    this.monthlyTrendEl = document.querySelector("#monthlyTrend");
    this.investmentValueEl = document.querySelector("#investmentValue");
    this.goalSummaryListEl = document.querySelector("#goalSummaryList");

    // Event listener for clicking goal summary items
    if (this.goalSummaryListEl) {
      this.goalSummaryListEl.addEventListener("click", (event) => {
        const item = event.target.closest(".goal-summary-item");
        if (!item) return;
        this.state.activeGoalId = item.dataset.goalId;
        this.state.saveGoals();
        this.state.notify();
      });
    }
  }

  render() {
    const { rows, goals, activeGoalId } = this.state;
    const sorted = [...rows].sort(compareExpensesByNewest);
    
    const expenses = sorted.filter((row) => !["income", "investment"].includes(row.type));
    const investments = sorted.filter((row) => row.type === "investment" || String(row.category).toLowerCase().includes("investment"));
    const incomes = sorted.filter((row) => row.type === "income");

    const latestValidRow = sorted.find((row) => !Number.isNaN(parseDateValue(row.date).getTime()));
    const latestMonth = latestValidRow ? getMonthKey(latestValidRow.date) : new Date().toISOString().slice(0, 7);
    const latestDate = new Date(`${latestMonth}-01`);
    const previousMonth = new Date(latestDate);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    const previousKey = previousMonth.toISOString().slice(0, 7);

    const currentExpenses = expenses.filter((row) => getMonthKey(row.date) === latestMonth).reduce((sum, row) => sum + row.amount, 0);
    const previousExpenses = expenses.filter((row) => getMonthKey(row.date) === previousKey).reduce((sum, row) => sum + row.amount, 0);
    const trend = previousExpenses ? ((currentExpenses - previousExpenses) / previousExpenses) * 100 : 0;
    const trendText = `${Math.abs(trend).toFixed(0)}% ${trend <= 0 ? "less" : "more"} than last month`;

    const start2025 = new Date("2025-01-01T00:00:00");
    const expensesFrom2025 = expenses.filter((row) => {
      const rowDate = parseDateValue(row.date);
      return !Number.isNaN(rowDate.getTime()) && rowDate >= start2025;
    });
    const totalExpense2025 = expensesFrom2025.reduce((sum, row) => sum + row.amount, 0);

    const totalIncome = incomes.reduce((sum, row) => sum + row.amount, 0);
    const totalInvestment = investments.reduce((sum, row) => sum + row.amount, 0);

    if (this.balanceValueEl) this.balanceValueEl.textContent = formatMoney(totalExpense2025);
    
    const balanceTrendEl = document.querySelector("#balanceTrend");
    if (balanceTrendEl) {
      const activeMonths = new Set(expensesFrom2025.map(r => getMonthKey(r.date))).size;
      const averageMonthly = expensesFrom2025.length > 0 
        ? totalExpense2025 / Math.max(activeMonths, 1)
        : 0;
      balanceTrendEl.textContent = `Rata-rata: ${formatMoney(averageMonthly)} / bulan`;
    }
    if (this.monthlyValueEl) this.monthlyValueEl.textContent = formatMoney(currentExpenses);
    if (this.investmentValueEl) this.investmentValueEl.textContent = formatMoney(totalInvestment);
    
    if (this.monthlyTrendEl) {
      this.monthlyTrendEl.textContent = trendText;
      this.monthlyTrendEl.className = `trend ${trend <= 0 ? "down" : "up"}`;
    }

    if (this.goalSummaryListEl) {
      this.goalSummaryListEl.innerHTML = goals
        .slice(0, 3)
        .map((goal) => {
          const required = Math.max(Number(goal.required) || 0, 1);
          const collected = Math.max(Number(goal.collected) || 0, 0);
          const progress = Math.min(Math.round((collected / required) * 100), 100);
          return `
            <button class="goal-summary-item ${goal.id === activeGoalId ? "active" : ""}" type="button" data-goal-id="${goal.id}">
              <strong>${goal.name || "Untitled Goal"}</strong>
              <small>${progress}%</small>
              <span class="goal-summary-bar" style="--progress:${progress}"><span></span></span>
            </button>`;
        })
        .join("");
    }
  }
}
