import { colors, formatMoney, parseDateValue, getMonthKey, groupSum, compareExpensesByNewest } from '../utils.js';

export class AnalyticsPage {
  constructor(state) {
    this.state = state;
  }

  init() {
    this.barChartEl = document.querySelector("#barChart");
    this.donutChartEl = document.querySelector("#donutChart");
    this.categoryLegendEl = document.querySelector("#categoryLegend");
    this.sparklineEl = document.querySelector("#sparkline");
    this.chartTrendEl = document.querySelector("#chartTrend");
  }

  drawSparkline(values) {
    if (!this.sparklineEl) return;
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const points = values
      .map((value, index) => {
        const x = (index / Math.max(values.length - 1, 1)) * 255;
        const y = 62 - ((value - min) / Math.max(max - min, 1)) * 52;
        return `${x},${y}`;
      })
      .join(" ");
    this.sparklineEl.innerHTML = `<polyline points="${points}" fill="none" stroke="#0077b6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>`;
  }

  drawBars(monthlyData) {
    if (!this.barChartEl) return;
    const rawMax = Math.max(...monthlyData.map((item) => item.value), 1);
    
    // Nice Max algorithm to round up to a clean milestone step (e.g. 10M, 25M, 50M)
    const getNiceMax = (val) => {
      if (val <= 0) return 1000;
      const magnitude = Math.pow(10, Math.floor(Math.log10(val)));
      const normalized = val / magnitude;
      let niceNormalized;
      if (normalized <= 1) niceNormalized = 1;
      else if (normalized <= 2) niceNormalized = 2;
      else if (normalized <= 2.5) niceNormalized = 2.5;
      else if (normalized <= 5) niceNormalized = 5;
      else if (normalized <= 7.5) niceNormalized = 7.5;
      else niceNormalized = 10;
      return niceNormalized * magnitude;
    };
    
    // Nice Axis label formatting (e.g. 25M, 12.5M, 500k)
    const formatAxisLabel = (val) => {
      if (val >= 1000000) {
        const millions = val / 1000000;
        return Number.isInteger(millions) ? `${millions}M` : `${millions.toFixed(1)}M`;
      }
      if (val >= 1000) {
        const thousands = val / 1000;
        return Number.isInteger(thousands) ? `${thousands}k` : `${thousands.toFixed(1)}k`;
      }
      return String(val);
    };

    const niceMax = getNiceMax(rawMax);

    this.barChartEl.innerHTML = `
      <div class="axis">
        <span>${formatAxisLabel(niceMax)}</span>
        <span>${formatAxisLabel(niceMax * 0.75)}</span>
        <span>${formatAxisLabel(niceMax * 0.5)}</span>
        <span>${formatAxisLabel(niceMax * 0.25)}</span>
        <span>0</span>
      </div>
      ${monthlyData
        .map(
          (item) => `
            <div class="bar-item" title="${item.label}: ${formatMoney(item.value)}">
              <div class="bar-track"><div class="bar-fill" style="height:${Math.max((item.value / niceMax) * 100, 4)}%"></div></div>
              <div class="bar-label">${item.label}</div>
            </div>`
        )
        .join("")}`;
  }

  drawDonut(categoryData) {
    if (!this.donutChartEl) return;
    const total = categoryData.reduce((sum, item) => sum + item.value, 0) || 1;
    let offset = 0;
    const radius = 82;
    const circumference = 2 * Math.PI * radius;
    
    this.donutChartEl.innerHTML = categoryData
      .map((item) => {
        const length = (item.value / total) * circumference;
        const gap = 9;
        const stroke = Math.max(length - gap, 0);
        const circle = `<circle cx="120" cy="120" r="${radius}" fill="none" stroke="${item.color}" stroke-width="34" stroke-linecap="round" stroke-dasharray="${stroke} ${circumference - stroke}" stroke-dashoffset="${-offset}" transform="rotate(-90 120 120)"></circle>`;
        offset += length;
        return circle;
      })
      .join("");
  }

  renderLegend(categoryData) {
    if (!this.categoryLegendEl) return;
    this.categoryLegendEl.innerHTML = categoryData
      .map(
        (item) => `
          <div class="legend-row" style="--color:${item.color}">
            <span></span>
            <strong>${item.label}</strong>
            <em>${formatMoney(item.value)}</em>
          </div>`
      )
      .join("");
  }

  render() {
    const { rows, currentView } = this.state;
    const sorted = [...rows].sort(compareExpensesByNewest);
    const expenses = sorted.filter((row) => !["income", "investment"].includes(row.type));
    const investments = sorted.filter((row) => row.type === "investment" || String(row.category).toLowerCase().includes("investment"));

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

    if (this.chartTrendEl) {
      this.chartTrendEl.textContent = trendText;
      this.chartTrendEl.className = `trend ${trend <= 0 ? "down" : "up"}`;
    }

    const monthTotals = groupSum(expenses, (row) => getMonthKey(row.date));
    const months = Object.keys(monthTotals).filter((m) => m && m !== "Unknown").sort().slice(-6);
    const monthlyData = months.map((month) => ({
      label: new Date(`${month}-01`).toLocaleDateString("en-US", { month: "short" }),
      value: monthTotals[month]
    }));

    const currentMonthExpenses = expenses.filter((row) => getMonthKey(row.date) === latestMonth);
    const categoryTotals = Object.entries(
      groupSum(currentView === "expenses" ? expenses : currentMonthExpenses, (row) => row.category)
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value], index) => ({
        label,
        value,
        color: colors[index % colors.length]
      }));

    this.drawBars(monthlyData);
    this.drawDonut(categoryTotals);
    this.renderLegend(categoryTotals);

    const totalInvestment = investments.reduce((sum, row) => sum + row.amount, 0);
    this.drawSparkline(monthlyData.map((item) => item.value + totalInvestment / Math.max(monthlyData.length, 1)));
  }
}
