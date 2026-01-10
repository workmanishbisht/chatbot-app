import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCEYuOyb0Tp28AZ3-l0diqvNPG810Bo8-Y",
  authDomain: "studio-3859565550-24cfb.firebaseapp.com",
  projectId: "studio-3859565550-24cfb",
  appId: "1:384760615604:web:94ebf95c68e1848f0fbde1",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const DEFAULT_AVATAR = "https://i.pravatar.cc/300";
const MIN_IMAGE_SIZE = 100 * 1024;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function showToast(msg, success = true) {
  if (!window.Toastify) return;
  Toastify({
    text: msg,
    duration: 3000,
    gravity: "top",
    position: "center",
    backgroundColor: success ? "#4cd964" : "#ff6b6b",
  }).showToast();
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
}

window.addEventListener("DOMContentLoaded", () => {
  const profileImg = document.getElementById("profilePreview");
  const removeBtn = document.querySelector(".remove-btn");
  const changeText = document.querySelector(".profile .change-text");
  const finishBtn = document.querySelector(".finish-btn");
  const bar = document.querySelector(".progress-bar span");

  bar.style.width = "0%";
  finishBtn.disabled = true;
  finishBtn.style.opacity = "0.5";

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/jpeg,image/png,image/webp";
  fileInput.hidden = true;
  document.body.appendChild(fileInput);

  profileImg.parentElement.onclick = (e) => {
    if (e.target.closest(".remove-btn")) return;
    fileInput.click();
  };
  changeText.onclick = () => fileInput.click();

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    const user = auth.currentUser;
    if (!file || !user) return;

    if (file.size < MIN_IMAGE_SIZE) {
      showToast("Image too small! Minimum 100KB required", false);
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      showToast("Image too large! Max 5MB allowed", false);
      return;
    }

    const base64 = await fileToBase64(file);
    localStorage.setItem(`profilePhoto_${user.uid}`, base64);
    profileImg.src = base64;
    updateProgress();
    showToast("Profile picture updated");
    fileInput.value = "";
  });

  removeBtn.onclick = () => {
    const user = auth.currentUser;
    if (!user) return;
    localStorage.removeItem(`profilePhoto_${user.uid}`);
    profileImg.src = DEFAULT_AVATAR;
    updateProgress();
    showToast("Profile picture removed");
  };

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.replace("../index.html");
      return;
    }

    const key = `profilePhoto_${user.uid}`;
    const savedPhoto = localStorage.getItem(key);
    profileImg.src =
      savedPhoto && savedPhoto.startsWith("data:image")
        ? savedPhoto
        : DEFAULT_AVATAR;

    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists() && snap.data().setupCompleted) {
      window.location.replace("../pages/Home.html");
      return;
    }

    updateProgress();
  });

  function updateProgress() {
    const usage = document.querySelector(".option-grid .option.active");
    const role = document.querySelector(".role-grid .role.active");
    const toggles = document.querySelectorAll(".toggle-row .toggle.active");
    const hasPhoto =
      profileImg.src &&
      profileImg.src !== DEFAULT_AVATAR &&
      profileImg.src.startsWith("data:image");

    const done =
      (usage ? 1 : 0) + (role ? 1 : 0) + toggles.length + (hasPhoto ? 1 : 0);

    const percent = (done / 5) * 100;
    bar.style.width = percent + "%";
    finishBtn.disabled = percent !== 100;
    finishBtn.style.opacity = percent === 100 ? "1" : "0.5";
  }

  document.querySelectorAll(".option-grid .option").forEach((el) => {
    el.onclick = () => {
      document.querySelectorAll(".option-grid .option").forEach(o => o.classList.remove("active"));
      el.classList.add("active");
      updateProgress();
    };
  });

  document.querySelectorAll(".role-grid .role").forEach((el) => {
    el.onclick = () => {
      document.querySelectorAll(".role-grid .role").forEach(r => r.classList.remove("active"));
      el.classList.add("active");
      updateProgress();
    };
  });

  document.querySelectorAll(".toggle-row .toggle").forEach((el) => {
    el.onclick = () => {
      el.classList.toggle("active");
      updateProgress();
    };
  });

  finishBtn.onclick = async () => {
    if (finishBtn.disabled) return;

    const user = auth.currentUser;
    const usageEl = document.querySelector(".option-grid .option.active");
    const roleEl = document.querySelector(".role-grid .role.active");
    const toggles = document.querySelectorAll(".toggle-row .toggle");

    await setDoc(
      doc(db, "users", user.uid),
      {
        usage: usageEl?.innerText.trim().toLowerCase() || "",
        role: roleEl?.innerText.trim().toLowerCase() || "",
        notifications: {
          email: toggles[0]?.classList.contains("active") || false,
          push: toggles[1]?.classList.contains("active") || false,
        },
        setupCompleted: true,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    showToast("Setup completed");
    window.location.replace("../pages/Home.html");
  };
});
