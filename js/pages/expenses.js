import { colors, formatMoney, parseDateValue, displayDate, getMonthKey, getCurrentMonthKey, compareExpensesByNewest } from '../utils.js';

export class ExpensesPage {
  constructor(state, sheetService) {
    this.state = state;
    this.sheetService = sheetService;
    this.editingRowId = null;
    this.lastView = "";
    this.lastPage = 1;
  }

  init() {
    this.recentRowsEl = document.querySelector("#recentRows");
    this.pageInfoEl = document.querySelector("#pageInfo");
    this.prevPageBtn = document.querySelector("#prevPageButton");
    this.nextPageBtn = document.querySelector("#nextPageButton");
    this.sheetConfigBtn = document.querySelector("#sheetConfigButton");
    this.sheetConfigEl = document.querySelector("#sheetConfig");
    this.sheetUrlEl = document.querySelector("#sheetUrl");
    this.sheetCancelBtn = document.querySelector("#sheetCancelButton");
    this.syncStatusEl = document.querySelector("#syncStatus");
    this.tableLoadingEl = document.querySelector("#tableLoading");
    this.tableWrapEl = document.querySelector("#expenses .table-wrap");
    this.csvFileEl = document.querySelector("#csvFile");
    this.sheetFormEl = document.querySelector("#sheetForm");

    // New element selectors for charts
    this.dailyAverageChartEl = document.querySelector("#dailyAverageChart");
    this.dailyAverageValEl = document.querySelector("#dailyAverageVal");
    this.sourceOfFundChartEl = document.querySelector("#sourceOfFundChart");
    this.sourceOfFundLegendEl = document.querySelector("#sourceOfFundLegend");

    this.setupListeners();
  }

  setupListeners() {
    if (this.prevPageBtn) {
      this.prevPageBtn.addEventListener("click", () => {
        if (this.state.transactionPage > 1) {
          this.state.transactionPage -= 1;
          this.state.notify();
        }
      });
    }

    if (this.nextPageBtn) {
      this.nextPageBtn.addEventListener("click", () => {
        this.state.transactionPage += 1;
        this.state.notify();
      });
    }

    if (this.sheetConfigBtn) {
      this.sheetConfigBtn.addEventListener("click", () => {
        this.sheetConfigEl?.classList.toggle("is-hidden");
        if (this.sheetUrlEl) this.sheetUrlEl.value = this.state.sheetDataUrl;
      });
    }

    if (this.sheetCancelBtn) {
      this.sheetCancelBtn.addEventListener("click", () => {
        this.sheetConfigEl?.classList.add("is-hidden");
      });
    }

    if (this.sheetConfigEl) {
      this.sheetConfigEl.addEventListener("submit", (event) => {
        event.preventDefault();
        const url = this.sheetUrlEl.value.trim();
        this.state.saveSheetUrl(url);
        this.sheetConfigEl.classList.add("is-hidden");
        this.sheetService.syncSheet();
      });
    }

    if (this.csvFileEl) {
      this.csvFileEl.addEventListener("change", async (event) => {
        const file = event.target.files[0];
        if (file) {
          try {
            const text = await file.text();
            this.sheetService.loadFromCSV(text);
          } catch (e) {
            this.setSyncStatus(e.message, true);
          }
        }
      });
    }

    if (this.sheetFormEl) {
      this.sheetFormEl.addEventListener("submit", async (event) => {
        event.preventDefault();
        const url = document.querySelector("#sheetUrl").value.trim();
        if (!url) return;
        try {
          const response = await fetch(url);
          const text = await response.text();
          this.sheetService.loadFromCSV(text);
        } catch (e) {
          this.setSyncStatus(e.message, true);
        }
      });
    }

    if (this.recentRowsEl) {
      this.recentRowsEl.addEventListener("click", (event) => {
        const target = event.target;
        
        const editBtn = target.closest(".edit-btn");
        if (editBtn) {
          this.editingRowId = editBtn.dataset.id;
          this.render();
          return;
        }

        const cancelBtn = target.closest(".cancel-btn");
        if (cancelBtn) {
          this.editingRowId = null;
          this.render();
          return;
        }

        const deleteBtn = target.closest(".delete-btn");
        if (deleteBtn) {
          const id = deleteBtn.dataset.id;
          if (confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
            this.state.deleteExpense(id);
            this.sheetService?.deleteExpense(id);
          }
          return;
        }

        const saveBtn = target.closest(".save-btn");
        if (saveBtn) {
          const id = saveBtn.dataset.id;
          const rowEl = saveBtn.closest("tr");
          if (rowEl) {
            const dateInput = rowEl.querySelector(".edit-date");
            const subcategoryInput = rowEl.querySelector(".edit-subcategory");
            const categorySelect = rowEl.querySelector(".edit-category");
            const amountInput = rowEl.querySelector(".edit-amount");
            const ambilSelect = rowEl.querySelector(".edit-ambil");
            const modeSelect = rowEl.querySelector(".edit-mode");

            const updatedFields = {
              date: dateInput.value,
              subcategory: subcategoryInput.value.trim() || "-",
              category: categorySelect.value,
              amount: Math.abs(Number(amountInput.value)) || 0,
              ambil: ambilSelect.value,
              mode: modeSelect.value,
            };

            this.state.updateExpense(id, updatedFields);

            const updatedTransaction = this.state.rows.find((r) => r.id === id);
            if (updatedTransaction) {
              this.sheetService?.updateExpense(updatedTransaction);
            }

            this.editingRowId = null;
            this.render();
          }
          return;
        }
      });
    }
  }

  setSyncStatus(message, isError = false) {
    if (this.syncStatusEl) {
      this.syncStatusEl.textContent = message;
      this.syncStatusEl.style.color = isError ? "var(--red)" : "var(--muted)";
    }
  }

  setLoading(isLoading) {
    if (this.tableLoadingEl) {
      this.tableLoadingEl.classList.toggle("is-hidden", !isLoading);
    }
    if (this.tableWrapEl) {
      this.tableWrapEl.classList.toggle("is-hidden", isLoading);
    }
  }

  drawDailyAverageChart(dailyData) {
    if (!this.dailyAverageChartEl) return;
    const rawMax = Math.max(...dailyData.map((item) => item.value), 1);

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

    this.dailyAverageChartEl.innerHTML = `
      <div class="axis">
        <span>${formatAxisLabel(niceMax)}</span>
        <span>${formatAxisLabel(niceMax * 0.75)}</span>
        <span>${formatAxisLabel(niceMax * 0.5)}</span>
        <span>${formatAxisLabel(niceMax * 0.25)}</span>
        <span>0</span>
      </div>
      ${dailyData
        .map(
          (item) => `
            <div class="bar-item" title="${item.label}: ${formatMoney(item.value)}">
              <div class="bar-track"><div class="bar-fill" style="height:${Math.max((item.value / niceMax) * 100, 4)}%"></div></div>
              <div class="bar-label">${item.label}</div>
            </div>`
        )
        .join("")}`;
  }

  drawSourceOfFundDonut(fundData) {
    if (!this.sourceOfFundChartEl) return;
    const total = fundData.reduce((sum, item) => sum + item.value, 0) || 1;
    let offset = 0;
    const radius = 82;
    const circumference = 2 * Math.PI * radius;

    this.sourceOfFundChartEl.innerHTML = fundData
      .map((item) => {
        const length = (item.value / total) * circumference;
        const gap = 9;
        const stroke = Math.max(length - gap, 0);
        const circle = `<circle cx="120" cy="120" r="${radius}" fill="none" stroke="${item.color}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${stroke} ${circumference - stroke}" stroke-dashoffset="${-offset}" transform="rotate(-90 120 120)"></circle>`;
        offset += length;
        return circle;
      })
      .join("");
  }

  renderIcon(name) {
    const icons = {
      edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"></path><path d="m16.5 3.5 4 4L7 21H3v-4L16.5 3.5Z"></path></svg>',
      delete: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg>',
      save: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>',
      cancel: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>'
    };

    return icons[name] || "";
  }

  renderSourceOfFundLegend(fundData) {
    if (!this.sourceOfFundLegendEl) return;
    this.sourceOfFundLegendEl.innerHTML = fundData
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
    
    if (currentView !== this.lastView) {
      this.editingRowId = null;
    }
    this.lastView = currentView;

    if (this.state.transactionPage !== this.lastPage) {
      this.editingRowId = null;
    }
    this.lastPage = this.state.transactionPage;

    const sorted = [...rows].sort(compareExpensesByNewest);
    const expenses = sorted.filter((row) => !["income", "investment"].includes(row.type));

    const isAllExpenses = currentView === "expenses";
    const currentMonthKey = getCurrentMonthKey(expenses);
    const sourceRows = isAllExpenses ? expenses : expenses.filter((row) => getMonthKey(row.date) === currentMonthKey);
    const tableRows = [...sourceRows].sort(compareExpensesByNewest);

    const dashboardRowsPerPage = 20;
    const allExpensesRowsPerPage = 50;
    const rowsPerPage = isAllExpenses ? allExpensesRowsPerPage : dashboardRowsPerPage;
    const totalPages = Math.max(Math.ceil(tableRows.length / rowsPerPage), 1);

    this.state.transactionPage = Math.min(Math.max(this.state.transactionPage, 1), totalPages);
    const pageRows = tableRows.slice((this.state.transactionPage - 1) * rowsPerPage, this.state.transactionPage * rowsPerPage);

    const titleEl = document.querySelector("#expenses .title h2");
    if (titleEl) {
      titleEl.textContent = isAllExpenses ? "All Expenses" : "Recent Expenses";
    }

    if (isAllExpenses) {
      // Calculate daily averages
      const uniqueDates = Array.from(new Set(sourceRows.map(row => {
        const d = parseDateValue(row.date);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      })));

      const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
      const dayOrder = [1, 2, 3, 4, 5, 6, 0]; // Monday to Sunday

      const dailyAverageData = dayOrder.map(dayIdx => {
        const datesForDay = uniqueDates.filter(dStr => {
          const parts = dStr.split('-');
          const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          return d.getDay() === dayIdx;
        }).length;
        const sumForDay = sourceRows
          .filter(row => parseDateValue(row.date).getDay() === dayIdx)
          .reduce((sum, r) => sum + r.amount, 0);
        return {
          label: dayNames[dayIdx],
          value: sumForDay / Math.max(datesForDay, 1)
        };
      });

      const totalOverallExpense = sourceRows.reduce((sum, r) => sum + r.amount, 0);
      const overallDailyAverage = totalOverallExpense / Math.max(uniqueDates.length, 1);
      if (this.dailyAverageValEl) {
        this.dailyAverageValEl.textContent = `Rata-rata: ${formatMoney(overallDailyAverage)} / hari`;
      }

      this.drawDailyAverageChart(dailyAverageData);

      // Calculate Source of Fund breakdown
      const fundGroups = {};
      sourceRows.forEach(row => {
        const mode = row.mode || "Other";
        fundGroups[mode] = (fundGroups[mode] || 0) + row.amount;
      });

      const fundData = Object.entries(fundGroups)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([label, value], index) => ({
          label,
          value,
          color: colors[index % colors.length]
        }));

      this.drawSourceOfFundDonut(fundData);
      this.renderSourceOfFundLegend(fundData);
    }

    if (this.recentRowsEl) {
      const uniqueCats = Array.from(new Set(this.state.rows.map(r => r.category))).filter(Boolean);
      const categoriesList = uniqueCats.length ? uniqueCats : ["Food", "Transportation", "Shopping", "Health", "Utilities", "Account Transfer", "Groceries", "Entertainment", "Internet", "Education", "Miscellaneous"];

      const uniqueAmbils = Array.from(new Set(this.state.rows.map(r => r.ambil))).filter(Boolean);
      const ambilsList = uniqueAmbils.length ? uniqueAmbils : ["Spend Bulanan", "Ambil dari tabungan", "Other"];

      const uniqueModes = Array.from(new Set(this.state.rows.map(r => r.mode))).filter(Boolean);
      const modesList = uniqueModes.length ? uniqueModes : ["Mandiri", "BCA", "Credit Card", "Blu", "Superbank"];

      this.recentRowsEl.innerHTML = pageRows
        .map((row) => {
          const isEditing = this.editingRowId === row.id;
          if (isEditing) {
            const dateVal = parseDateValue(row.date).toISOString().slice(0, 10);
            return `
              <tr class="editing-row" data-id="${row.id}">
                <td><input type="date" class="edit-date" value="${dateVal}"></td>
                <td><input type="text" class="edit-subcategory" value="${row.subcategory}"></td>
                <td>
                  <select class="edit-category">
                    ${categoriesList.map(c => `<option value="${c}" ${c === row.category ? 'selected' : ''}>${c}</option>`).join('')}
                  </select>
                </td>
                <td><input type="number" class="edit-amount" value="${row.amount}" min="0"></td>
                <td>
                  <select class="edit-ambil">
                    ${ambilsList.map(a => `<option value="${a}" ${a === row.ambil ? 'selected' : ''}>${a}</option>`).join('')}
                  </select>
                </td>
                <td>
                  <select class="edit-mode">
                    ${modesList.map(m => `<option value="${m}" ${m === row.mode ? 'selected' : ''}>${m}</option>`).join('')}
                  </select>
                </td>
                <td class="actions-col">
                  <div class="row-actions">
                    <button type="button" class="action-icon-btn save-btn" data-id="${row.id}" title="Save" aria-label="Save transaction">${this.renderIcon("save")}</button>
                    <button type="button" class="action-icon-btn cancel-btn" data-id="${row.id}" title="Cancel" aria-label="Cancel editing">${this.renderIcon("cancel")}</button>
                  </div>
                </td>
              </tr>`;
          } else {
            return `
              <tr data-id="${row.id}">
                <td>${displayDate(row.date)}</td>
                <td>${row.subcategory}</td>
                <td>${row.category}</td>
                <td>${formatMoney(row.amount)}</td>
                <td>${row.ambil || "-"}</td>
                <td>${row.mode}</td>
                <td class="actions-col">
                  <div class="row-actions">
                    <button type="button" class="action-icon-btn edit-btn" data-id="${row.id}" title="Edit" aria-label="Edit transaction">${this.renderIcon("edit")}</button>
                    <button type="button" class="action-icon-btn delete-btn" data-id="${row.id}" title="Delete" aria-label="Delete transaction">${this.renderIcon("delete")}</button>
                  </div>
                </td>
              </tr>`;
          }
        })
        .join("");
    }

    if (this.pageInfoEl) this.pageInfoEl.textContent = `Page ${this.state.transactionPage} of ${totalPages}`;
    if (this.prevPageBtn) this.prevPageBtn.disabled = this.state.transactionPage <= 1;
    if (this.nextPageBtn) this.nextPageBtn.disabled = this.state.transactionPage >= totalPages;
  }
}
