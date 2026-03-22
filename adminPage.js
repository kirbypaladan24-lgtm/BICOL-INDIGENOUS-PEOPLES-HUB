import { observeAuth, logout, isAdmin } from "./auth.js";
import { initAdmin } from "./admin.js";
import { showToast } from "./ui.js";

const logoutBtn = document.getElementById("logoutBtn");
const themeToggle = document.getElementById("themeToggle");

logoutBtn?.addEventListener("click", async () => {
  await logout();
  window.location.href = "index.html";
});

// reuse theme toggle logic
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "light") document.documentElement.setAttribute("data-theme", "light");
themeToggle?.addEventListener("click", () => {
  const isLight = document.documentElement.getAttribute("data-theme") === "light";
  if (isLight) {
    document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("theme", "dark");
  } else {
    document.documentElement.setAttribute("data-theme", "light");
    localStorage.setItem("theme", "light");
  }
});

observeAuth(async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  if (!isAdmin(user)) {
    showToast("Admin access required.", "error");
    await logout();
    window.location.href = "index.html";
    return;
  }
  await initAdmin(user);
});
