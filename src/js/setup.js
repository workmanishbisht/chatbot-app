// Setup page logic
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyCEYuOyb0Tp28AZ3-l0diqvNPG810Bo8-Y",
    authDomain: "studio-3859565550-24cfb.firebaseapp.com",
    projectId: "studio-3859565550-24cfb",
    appId: "1:384760615604:web:94ebf95c68e1848f0fbde1",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const DEFAULT_AVATAR =
    "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

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

window.addEventListener("DOMContentLoaded", () => {
    const profileImg = document.querySelector(".profile img");
    const changeText = document.querySelector(".profile .change-text");
    const finishBtn = document.querySelector(".finish-btn");
    const bar = document.querySelector(".progress-bar span");

    document
        .querySelectorAll(".option.active,.role.active,.toggle.active")
        .forEach(e => e.classList.remove("active"));

    bar.style.width = "0%";
    finishBtn.disabled = true;
    finishBtn.style.opacity = "0.5";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.hidden = true;
    document.body.appendChild(fileInput);

    profileImg.parentElement.onclick = () => fileInput.click();
    changeText.onclick = () => fileInput.click();

    const unsubscribe = onAuthStateChanged(auth, async user => {
        unsubscribe();

        if (!user) {
            window.location.replace("../index.html");
            return;
        }

        const snap = await getDoc(doc(db, "users", user.uid));

        if (snap.exists() && snap.data().setupCompleted) {
            window.location.replace("../pages/Home.html");
            return;
        }

        const localPhoto = localStorage.getItem(`profilePhoto_${user.uid}`);
        profileImg.src =
            localPhoto ||
            (snap.exists() && snap.data().photoURL) ||
            DEFAULT_AVATAR;

        updateProgress();
    });

    fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0];
        const user = auth.currentUser;
        if (!file || !user) return;

        try {
            const ext = file.name.split(".").pop() || "jpg";
            const storageRef = ref(storage, `profiles/${user.uid}.${ext}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);

            profileImg.src = url;
            localStorage.setItem(`profilePhoto_${user.uid}`, url);
            showToast("Profile picture uploaded");
            updateProgress();
        } catch {
            showToast("Failed to upload photo", false);
        }
    });

    function updateProgress() {
        const usage = document.querySelector(".option-grid .option.active");
        const role = document.querySelector(".role-grid .role.active");
        const toggles = document.querySelectorAll(".toggle-row .toggle.active");
        const hasPhoto = profileImg.src !== DEFAULT_AVATAR;

        const done =
            (usage ? 1 : 0) +
            (role ? 1 : 0) +
            toggles.length +
            (hasPhoto ? 1 : 0);

        const percent = (done / 5) * 100;
        bar.style.width = `${percent}%`;
        finishBtn.disabled = percent !== 100;
        finishBtn.style.opacity = percent === 100 ? "1" : "0.5";
    }

    document.querySelectorAll(".option-grid .option").forEach(el => {
        el.onclick = () => {
            document
                .querySelectorAll(".option-grid .option")
                .forEach(o => o.classList.remove("active"));
            el.classList.add("active");
            updateProgress();
        };
    });

    document.querySelectorAll(".role-grid .role").forEach(el => {
        el.onclick = () => {
            document
                .querySelectorAll(".role-grid .role")
                .forEach(r => r.classList.remove("active"));
            el.classList.add("active");
            updateProgress();
        };
    });

    document.querySelectorAll(".toggle-row .toggle").forEach(el => {
        el.onclick = () => {
            el.classList.toggle("active");
            updateProgress();
        };
    });

    finishBtn.onclick = () => {
        if (finishBtn.disabled) return;

        const user = auth.currentUser;
        const usageEl = document.querySelector(".option-grid .option.active");
        const roleEl = document.querySelector(".role-grid .role.active");
        const toggles = document.querySelectorAll(".toggle-row .toggle");

        showToast("Setup completed");
        window.location.replace("../pages/Home.html");

        setDoc(
            doc(db, "users", user.uid),
            {
                usage: usageEl?.innerText.trim().toLowerCase() || "",
                role: roleEl?.innerText.trim().toLowerCase() || "",
                notifications: {
                    email: toggles[0]?.classList.contains("active") || false,
                    push: toggles[1]?.classList.contains("active") || false,
                },
                photoURL: profileImg.src !== DEFAULT_AVATAR ? profileImg.src : "",
                setupCompleted: true,
                updatedAt: new Date().toISOString(),
            },
            { merge: true }
        );
    };
});
