import { createAccountWithProfile, loginWithEmail } from "./auth.js";

const form = document.getElementById("signupForm");
const toast = document.getElementById("signupToast");
const passwordInput = document.getElementById("passwordInput");
const toggleSignupPass = document.getElementById("toggleSignupPass");

function showToast(msg, variant = "info") {
  toast.textContent = msg;
  toast.dataset.variant = variant;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 2500);
}

toggleSignupPass?.addEventListener("click", () => {
  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";
  toggleSignupPass.textContent = isHidden ? "Hide" : "Show";
  toggleSignupPass.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("usernameInput").value.trim();
  const phone = document.getElementById("phoneInput").value.trim();
  const birthdate = document.getElementById("birthdateInput").value;
  const email = document.getElementById("emailInput").value.trim();
  const password = document.getElementById("passwordInput").value.trim();

  if (!/\S+@\S+\.\S+/.test(email)) {
    showToast("Enter a valid email address.", "warn");
    return;
  }
  if (password.length < 6) {
    showToast("Password must be at least 6 characters.", "warn");
    return;
  }
  if (!username) {
    showToast("Username is required.", "warn");
    return;
  }
  try {
    await createAccountWithProfile({ email, password, username, phone, birthdate });
    showToast("Account created! Redirecting to login...");
    setTimeout(() => (window.location.href = "index.html"), 1200);
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      // Try to log in with the same credentials; if password is wrong, inform the user.
      try {
        await loginWithEmail(email, password);
        showToast("Email already registered. Logging you in...");
        setTimeout(() => (window.location.href = "index.html"), 800);
        return;
      } catch (loginErr) {
        showToast("Email already in use. Use Login or reset your password.", "error");
        return;
      }
    }
    showToast("Signup failed: " + err.message, "error");
  }
});
