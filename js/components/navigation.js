export class Navigation {
  constructor(state) {
    this.state = state;
  }

  init() {
    this.navLinks = document.querySelectorAll(".nav a[data-view]");

    this.navLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        
        if (link.classList.contains("coming-soon")) {
          alert("Fitur Saving akan segera hadir! Kami sedang mempersiapkannya untuk Anda. 🚀");
          return;
        }

        this.activateNav(link);
        this.focusSection(link.dataset.view);
        history.replaceState(null, "", link.getAttribute("href"));
      });
    });

    // Hash change listener
    window.addEventListener("hashchange", () => this.activateViewFromHash());

    // Initial load view from hash
    this.activateViewFromHash();
  }

  activateNav(link) {
    this.navLinks.forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
  }

  focusSection(view) {
    this.state.setView(view);
    this.state.transactionPage = 1;
    this.state.notify();

    const targetMap = {
      dashboard: "#dashboard",
      expenses: "#expenses",
      investment: "#investment",
      cards: "#expenses",
      goals: "#goalWriter",
      insight: "#insight",
      analytics: "#analytics"
    };

    const targetSelector = targetMap[view];
    if (!targetSelector) return;
    const target = document.querySelector(targetSelector);
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "start" });
    target.classList.remove("focus-pulse");
    window.setTimeout(() => target.classList.add("focus-pulse"), 80);
  }

  activateViewFromHash() {
    const currentHash = window.location.hash || "#dashboard";
    const link = document.querySelector(`.nav a[href="${currentHash}"]`);
    if (!link) return;
    this.activateNav(link);
    this.state.setView(link.dataset.view);
    this.state.transactionPage = 1;
    this.state.notify();
  }
}
