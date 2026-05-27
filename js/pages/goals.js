import { formatMoney, parseAmount } from '../utils.js';

export class GoalsPage {
  constructor(state, sheetService) {
    this.state = state;
    this.sheetService = sheetService;
    this.editingGoalId = null;
    this.lastView = "";
  }

  init() {
    this.goalWriterEl = document.querySelector("#goalWriter");
    this.dashboardGridEl = document.querySelector("#dashboardGrid");
    
    // Inputs
    this.goalEditingIdEl = document.querySelector("#goalEditingId");
    this.goalInputNameEl = document.querySelector("#goalInputName");
    this.goalInputTargetEl = document.querySelector("#goalInputTarget");
    this.goalInputCollectedEl = document.querySelector("#goalInputCollected");
    this.goalInputProgressEl = document.querySelector("#goalInputProgress");

    // Form and Buttons
    this.goalFormEl = document.querySelector("#goalForm");
    this.goalAdd10kBtn = document.querySelector("#goalAdd10kButton");
    this.goalCancelBtn = document.querySelector("#goalCancelButton");
    this.goalSubmitBtn = document.querySelector("#goalSubmitButton");
    this.goalWriterTitleEl = document.querySelector("#goalWriter .panel-head h2");
    this.goalListEl = document.querySelector("#goalList");

    this.setupListeners();
  }

  setupListeners() {
    if (this.goalFormEl) {
      this.goalFormEl.addEventListener("submit", (event) => {
        event.preventDefault();
        
        const name = this.goalInputNameEl?.value.trim() || "Untitled Goal";
        const required = Math.max(parseAmount(this.goalInputTargetEl?.value), 1);
        const progressInput = this.goalInputProgressEl?.value;
        const progress = progressInput === "" ? null : Math.min(Math.max(Number(progressInput) || 0, 0), 100);
        
        const collected = progress === null 
          ? parseAmount(this.goalInputCollectedEl?.value) 
          : Math.round((required * progress) / 100);

        if (this.editingGoalId) {
          // Update existing
          const updatedGoal = this.state.createGoal({
            id: this.editingGoalId,
            name,
            required,
            collected
          });
          this.state.goals = this.state.goals.map((g) => (g.id === this.editingGoalId ? updatedGoal : g));
          this.state.activeGoalId = updatedGoal.id;
          this.editingGoalId = null;
        } else {
          // Add new
          const nextGoal = this.state.createGoal({
            name,
            required,
            collected
          });
          this.state.goals = [nextGoal, ...this.state.goals];
          this.state.activeGoalId = nextGoal.id;
        }

        this.state.saveGoals();
        this.sheetService?.syncGoals(this.state.goals);
        this.clearForm();
        this.state.notify();

        const goalsContainer = document.querySelector("#goals");
        if (goalsContainer) {
          goalsContainer.classList.remove("focus-pulse");
          window.setTimeout(() => goalsContainer.classList.add("focus-pulse"), 80);
        }
      });
    }

    if (this.goalListEl) {
      this.goalListEl.addEventListener("click", (event) => {
        const item = event.target.closest(".goal-item");
        if (!item) return;
        
        const action = event.target.closest("[data-goal-action]")?.dataset.goalAction;
        const selectedGoalId = item.dataset.goalId;

        if (action === "delete") {
          if (this.state.goals.length > 1) {
            this.state.goals = this.state.goals.filter((goal) => goal.id !== selectedGoalId);
            if (this.state.activeGoalId === selectedGoalId) {
              this.state.activeGoalId = this.state.goals[0].id;
            }
            if (this.editingGoalId === selectedGoalId) {
              this.editingGoalId = null;
              this.clearForm();
            }
            this.state.saveGoals();
            this.sheetService?.syncGoals(this.state.goals);
            this.state.notify();
          }
          return;
        }

        if (action === "edit") {
          this.editingGoalId = selectedGoalId;
          const goalToEdit = this.state.goals.find(g => g.id === selectedGoalId);
          if (goalToEdit) {
            this.state.activeGoalId = selectedGoalId;
            this.populateForm(goalToEdit);
            this.state.saveGoals();
            this.state.notify();
            this.goalInputNameEl?.focus();
          }
          return;
        }

        // Just select active
        this.state.activeGoalId = selectedGoalId;
        this.state.saveGoals();
        this.state.notify();
      });
    }

    if (this.goalCancelBtn) {
      this.goalCancelBtn.addEventListener("click", () => {
        this.editingGoalId = null;
        this.clearForm();
        this.state.notify();
      });
    }

    if (this.goalAdd10kBtn) {
      this.goalAdd10kBtn.addEventListener("click", () => {
        if (this.goalInputCollectedEl) {
          const current = parseAmount(this.goalInputCollectedEl.value) || 0;
          this.goalInputCollectedEl.value = current + 10000;
          syncProgressFromAmounts();
        }
      });
    }

    const syncProgressFromAmounts = () => {
      const required = Math.max(parseAmount(this.goalInputTargetEl?.value), 1);
      const collected = parseAmount(this.goalInputCollectedEl?.value);
      if (this.goalInputProgressEl) {
        this.goalInputProgressEl.value = Math.min(Math.round((collected / required) * 100), 100);
      }
    };

    const syncCollectedFromProgress = () => {
      const required = Math.max(parseAmount(this.goalInputTargetEl?.value), 1);
      const progress = Math.min(Math.max(Number(this.goalInputProgressEl?.value) || 0, 0), 100);
      if (this.goalInputCollectedEl) {
        this.goalInputCollectedEl.value = Math.round((required * progress) / 100);
      }
    };

    this.goalInputTargetEl?.addEventListener("input", syncProgressFromAmounts);
    this.goalInputCollectedEl?.addEventListener("input", syncProgressFromAmounts);
    this.goalInputProgressEl?.addEventListener("input", syncCollectedFromProgress);
  }

  clearForm() {
    if (this.goalEditingIdEl) this.goalEditingIdEl.value = "";
    if (this.goalInputNameEl) this.goalInputNameEl.value = "";
    if (this.goalInputTargetEl) this.goalInputTargetEl.value = "";
    if (this.goalInputCollectedEl) this.goalInputCollectedEl.value = "";
    if (this.goalInputProgressEl) this.goalInputProgressEl.value = "";
  }

  populateForm(goal) {
    if (this.goalEditingIdEl) this.goalEditingIdEl.value = goal.id || "";
    if (this.goalInputNameEl) this.goalInputNameEl.value = goal.name || "";
    if (this.goalInputTargetEl) this.goalInputTargetEl.value = goal.required || "";
    if (this.goalInputCollectedEl) this.goalInputCollectedEl.value = goal.collected || "";
    if (this.goalInputProgressEl) {
      this.goalInputProgressEl.value = Math.min(
        Math.round((goal.collected / Math.max(goal.required, 1)) * 100),
        100
      );
    }
  }

  render() {
    const { goals, activeGoalId, currentView } = this.state;
    const isGoalsView = currentView === "goals";

    // Clear form only on initial navigation transition to Goals view
    if (isGoalsView && this.lastView !== "goals") {
      this.editingGoalId = null;
      this.clearForm();
    }
    this.lastView = currentView;

    if (this.goalWriterEl) this.goalWriterEl.classList.toggle("is-hidden", !isGoalsView);
    if (this.dashboardGridEl) this.dashboardGridEl.classList.toggle("is-hidden", isGoalsView);

    if (isGoalsView) {
      if (this.editingGoalId) {
        const editingGoal = goals.find((g) => g.id === this.editingGoalId);
        if (editingGoal) {
          if (this.goalWriterTitleEl) this.goalWriterTitleEl.textContent = `Edit Goal: ${editingGoal.name}`;
          if (this.goalSubmitBtn) this.goalSubmitBtn.textContent = "Save Changes";
          if (this.goalCancelBtn) this.goalCancelBtn.classList.remove("is-hidden");
        }
      } else {
        if (this.goalWriterTitleEl) this.goalWriterTitleEl.textContent = "Write Goal";
        if (this.goalSubmitBtn) this.goalSubmitBtn.textContent = "Save Goal";
        if (this.goalCancelBtn) this.goalCancelBtn.classList.add("is-hidden");
      }
    }

    if (this.goalListEl) {
      this.goalListEl.innerHTML = goals
        .map((goal) => {
          const goalProgress = Math.min(Math.round((goal.collected / Math.max(goal.required, 1)) * 100), 100);
          const isActive = goal.id === activeGoalId;
          const isEditing = goal.id === this.editingGoalId;
          return `
            <div class="goal-item ${isActive ? "active" : ""} ${isEditing ? "editing" : ""}" data-goal-id="${goal.id}">
              <span class="goal-mini-ring" style="--progress:${goalProgress}"></span>
              <span>
                <strong>${goal.name}</strong>
                <small>${formatMoney(goal.collected)} / ${formatMoney(goal.required)}</small>
              </span>
              <span class="goal-actions">
                <button type="button" data-goal-action="edit">${isEditing ? "Editing..." : "Edit"}</button>
                <button class="danger" type="button" data-goal-action="delete">Delete</button>
              </span>
            </div>`;
        })
        .join("");
    }
  }
}
