import { colors, formatMoney, parseDateValue, displayDate } from '../utils.js';

export class BillsPage {
  constructor(state) {
    this.state = state;
  }

  init() {
    this.billListEl = document.querySelector("#billList");
  }

  render() {
    if (!this.billListEl) return;
    const { rows } = this.state;
    const sorted = [...rows].sort((a, b) => parseDateValue(b.date) - parseDateValue(a.date));
    const bills = sorted.filter((row) => row.type === "bill" || String(row.category).toLowerCase().includes("subscription"));

    const fallback = rows.filter((row) => String(row.category).toLowerCase().includes("subscription"));
    const list = (bills.length ? bills : fallback).slice(0, 5);

    this.billListEl.innerHTML = list
      .map((row, index) => {
        const label = row.subcategory === "-" ? row.category : row.subcategory;
        return `
          <div class="bill-row" style="--color:${colors[index % colors.length]}">
            <span class="bill-icon">${label.charAt(0).toUpperCase()}</span>
            <strong>${label}<small>${displayDate(row.date)}</small></strong>
            <em>${formatMoney(row.amount)}</em>
          </div>`;
      })
      .join("");
  }
}
