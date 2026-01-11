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

function showToast(text, ok = true) {
  if (!window.Toastify) return;
  Toastify({
    text,
    duration: 2500,
    gravity: "top",
    position: "center",
    backgroundColor: ok ? "#4cd964" : "#ff6b6b",
  }).showToast();
}

document.addEventListener("DOMContentLoaded", () => {
  const profileImg = document.getElementById("profilePreview");
  const removeBtn = document.querySelector(".remove-btn");
  const changeText = document.querySelector(".profile .change-text");
  const finishBtn = document.querySelector(".finish-btn");
  const bar = document.querySelector(".progress-bar span");

  let allowSave = true;

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/jpeg,image/png,image/webp";
  fileInput.hidden = true;
  document.body.appendChild(fileInput);

  function saveState(uid) {
    if (!allowSave) return;
    const state = {
      usage:
        document.querySelector(".option-grid .option.active")?.dataset.value ||
        "",
      role:
        document.querySelector(".role-grid .role.active")?.dataset.value || "",
      toggles: [...document.querySelectorAll(".toggle-row .toggle")].map((t) =>
        t.classList.contains("active")
      ),
      photo: profileImg.src.startsWith("data:image") ? profileImg.src : "",
    };
    localStorage.setItem(`setup_${uid}`, JSON.stringify(state));
  }

  function restoreState(uid) {
    const raw = localStorage.getItem(`setup_${uid}`);
    if (!raw) return;

    allowSave = false;
    const state = JSON.parse(raw);

    document
      .querySelectorAll(".option-grid .option")
      .forEach((el) =>
        el.classList.toggle("active", el.dataset.value === state.usage)
      );

    document
      .querySelectorAll(".role-grid .role")
      .forEach((el) =>
        el.classList.toggle("active", el.dataset.value === state.role)
      );

    document
      .querySelectorAll(".toggle-row .toggle")
      .forEach((el, i) =>
        el.classList.toggle("active", state.toggles?.[i] ?? false)
      );

    profileImg.src = state.photo || DEFAULT_AVATAR;
    allowSave = true;
  }

  function updateProgress() {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const done =
      (document.querySelector(".option-grid .option.active") ? 1 : 0) +
      (document.querySelector(".role-grid .role.active") ? 1 : 0) +
      document.querySelectorAll(".toggle-row .toggle.active").length +
      (profileImg.src !== DEFAULT_AVATAR ? 1 : 0);

    const percent = (done / 5) * 100;
    bar.style.width = `${percent}%`;
    finishBtn.disabled = percent !== 100;
    finishBtn.style.opacity = percent === 100 ? "1" : "0.5";

    saveState(uid);
  }

  changeText.onclick = () => fileInput.click();

  fileInput.onchange = () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      profileImg.src = reader.result;
      updateProgress();
      showToast("Profile picture updated");
    };
    reader.readAsDataURL(file);
  };

  removeBtn.onclick = () => {
    profileImg.src = DEFAULT_AVATAR;
    updateProgress();
    showToast("Profile picture removed", false);
  };

  document.querySelectorAll(".option-grid .option").forEach((el) => {
    el.addEventListener("click", () => {
      document
        .querySelectorAll(".option-grid .option")
        .forEach((o) => o.classList.remove("active"));
      el.classList.add("active");
      updateProgress();
    });
  });

  document.querySelectorAll(".role-grid .role").forEach((el) => {
    el.addEventListener("click", () => {
      document
        .querySelectorAll(".role-grid .role")
        .forEach((r) => r.classList.remove("active"));
      el.classList.add("active");
      updateProgress();
    });
  });

  document.querySelectorAll(".toggle-row .toggle").forEach((el) => {
    el.addEventListener("click", () => {
      el.classList.toggle("active");
      updateProgress();
    });
  });

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      location.replace("../index.html");
      return;
    }

    await restoreState(user.uid);
    updateProgress();

    const snap = await getDoc(doc(db, "users", user.uid));

    if (snap.exists() && snap.data().setupCompleted === true) {
      location.replace("./Home.html");
    }
  });

  finishBtn.onclick = async () => {
    const user = auth.currentUser;
    if (!user || finishBtn.disabled) return;

    location.replace("./Home.html");

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          setupCompleted: true,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      localStorage.removeItem(`setup_${user.uid}`);
    } catch (error) {
      console.error("Setup completion failed:", error);
    }
  };
});
