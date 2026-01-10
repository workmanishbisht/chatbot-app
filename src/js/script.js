import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* Firebase init */
const firebaseConfig = {
  apiKey: "AIzaSyCEYuOyb0Tp28AZ3-l0diqvNPG810Bo8-Y",
  authDomain: "studio-3859565550-24cfb.firebaseapp.com",
  projectId: "studio-3859565550-24cfb",
  appId: "1:384760615604:web:94ebf95c68e1848f0fbde1",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

/* DOM */
const loginForm = document.querySelector(".login-form");
const signupForm = document.querySelector(".signup-form");

const switchToSignup = document.querySelector(".switch-to-signup");
const switchToLogin = document.querySelector(".switch-to-login");
const topToggleBtn = document.getElementById("toggleAuth");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginBtn = document.querySelector(".login-form .login-btn");

const signupName = signupForm.querySelector('input[placeholder="John Doe"]');
const signupEmail = signupForm.querySelector('input[type="email"]');
const signupPasswords = signupForm.querySelectorAll('input[type="password"]');
const signupBtn = document.querySelector(".signup-form .login-btn");

const googleLoginBtn = document.querySelector(".login-form .social.google");
const googleSignupBtn = document.querySelector(".signup-form .social.google");
const githubLoginBtn = document.querySelector(".login-form .social.github");
const githubSignupBtn = document.querySelector(".signup-form .social.github");

/* Toast */
function showToast(text, success = true) {
  Toastify({
    text,
    duration: 3000,
    gravity: "top",
    position: "center",
    fontFamily: "poppins",
    backgroundColor: success ? "#22c55e" : "#ef4444",
  }).showToast();
}

/* Clear inputs */
function clearForms() {
  loginEmail.value = "";
  loginPassword.value = "";
  signupName.value = "";
  signupEmail.value = "";
  signupPasswords.forEach(i => i.value = "");
}

/* Password eye toggle */
document.querySelectorAll(".input-box").forEach(box => {
  const input = box.querySelector("input");
  const eye = box.querySelector(".eye");
  if (!input || !eye) return;

  eye.addEventListener("click", () => {
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    eye.className = show ? "ri-eye-line eye" : "ri-eye-off-line eye";
  });
});

/* Form toggle */
function showLogin() {
  signupForm.classList.remove("active");
  loginForm.classList.add("active");
  topToggleBtn.innerText = "Sign Up";
  clearForms();
}

function showSignup() {
  loginForm.classList.remove("active");
  signupForm.classList.add("active");
  topToggleBtn.innerText = "Log In";
  clearForms();
}

switchToSignup?.addEventListener("click", e => {
  e.preventDefault();
  showSignup();
});

switchToLogin?.addEventListener("click", e => {
  e.preventDefault();
  showLogin();
});

topToggleBtn?.addEventListener("click", e => {
  e.preventDefault();
  loginForm.classList.contains("active") ? showSignup() : showLogin();
});

/* Validation */
function validate(email, password) {
  if (!email || !password) return showToast("All fields are required", false), false;
  if (!email.includes("@")) return showToast("Invalid email address", false), false;
  if (password.length < 6) return showToast("Password must be at least 6 characters", false), false;
  return true;
}

/* LOGIN */
loginBtn?.addEventListener("click", async () => {
  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();
  if (!validate(email, password)) return;

  try {
    const res = await signInWithEmailAndPassword(auth, email, password);
    localStorage.setItem("user", JSON.stringify(res.user));
    showToast("Login successful");
    setTimeout(() => location.replace("/src/pages/setup.html"), 1400);
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      showToast("Account not found. Please create an account.", false);
      showSignup();
    } else {
      showToast("Invalid email or password", false);
    }
  }
});

/* SIGNUP */
signupBtn?.addEventListener("click", async () => {
  const name = signupName.value.trim();
  const email = signupEmail.value.trim();
  const password = signupPasswords[0].value.trim();
  const confirm = signupPasswords[1].value.trim();

  if (!name) return showToast("Name is required", false);
  if (!validate(email, password)) return;
  if (password !== confirm) return showToast("Passwords do not match", false);

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    showToast("Account created successfully. Please login.");
    showLogin();
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      showToast("Account already exists. Please login.", false);
      showLogin();
    } else {
      showToast("Signup failed", false);
    }
  }
});

/* Social auth */
[googleLoginBtn, googleSignupBtn, githubLoginBtn, githubSignupBtn].forEach(btn => {
  btn?.addEventListener("click", async () => {
    try {
      const provider = btn.classList.contains("google") ? googleProvider : githubProvider;
      const res = await signInWithPopup(auth, provider);
      localStorage.setItem("user", JSON.stringify(res.user));
      showToast("Login successful");
      setTimeout(() => location.replace("/src/pages/setup.html"), 1000);
    } catch {
      showToast("Authentication failed", false);
    }
  });
});

/* Auto redirect */
if (
  (location.pathname === "/" || location.pathname.endsWith("index.html")) &&
  localStorage.getItem("user")
) {
  location.replace("/src/pages/setup.html");
}
