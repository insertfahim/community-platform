// If already authenticated, redirect away from auth page
(async function ensureNotAuthenticatedView() {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    try {
        const res = await fetch("/api/users/me", {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            window.location.href = "/";
            return;
        }
        // Clear invalid token
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_id");
    } catch (_e) {
        // Network errors ignored here; user can still log in
    }
})();

document.querySelector(".img__btn").addEventListener("click", function () {
    document.querySelector(".cont").classList.toggle("s--signup");
});

//SIGN UP
const signUpBtn = document.querySelector(".submit.sign-up");
if (signUpBtn) {
    signUpBtn.addEventListener("click", async () => {
        const name = document
            .querySelector('.sign-up input[type="text"]')
            .value.trim();
        const email = document
            .querySelector('.sign-up input[type="email"]')
            .value.trim();
        const password = document
            .querySelector('.sign-up input[type="password"]')
            .value.trim();
        const signupError = document.getElementById("signupError");

        if (signupError) signupError.innerText = "";

        if (!name || !email || !password) {
            signupError.innerText = "❌ All fields are required.";
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            signupError.innerText = "❌ Please enter a valid email address.";
            return;
        }

        try {
            const res = await fetch("/api/users/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                signupError.innerText =
                    data.message || "❌ Registration failed.";
                return;
            }
            const note = document.getElementById("signupNote");
            if (note)
                note.innerText =
                    "✅ Registered successfully. You can now sign in.";
            document.querySelector('.sign-up input[type="text"]').value = "";
            document.querySelector('.sign-up input[type="email"]').value = "";
            document.querySelector('.sign-up input[type="password"]').value =
                "";

            // Switch to sign-in view
            document.querySelector(".cont").classList.remove("s--signup");
        } catch (err) {
            console.error("Network error:", err);
            signupError.innerText = "❌ Network error. Please try again.";
        }
    });
}

// SIGN IN
const signInBtn = document.querySelector(".sign-in .submit");
if (signInBtn) {
    signInBtn.addEventListener("click", async () => {
        const email = document
            .querySelector('.sign-in input[type="email"]')
            .value.trim();
        const password = document
            .querySelector('.sign-in input[type="password"]')
            .value.trim();
        const signinError = document.getElementById("signinError");

        if (signinError) signinError.innerText = "";

        if (!email || !password) {
            signinError.innerText = "❌ Email and password are required.";
            return;
        }

        try {
            const res = await fetch("/api/users/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                signinError.innerText = data.message || "❌ Login failed.";
                return;
            }

            const note = document.getElementById("signinNote");
            if (note) note.innerText = "✅ Logged in. Redirecting...";
            // store token for authenticated requests
            if (data.token) {
                localStorage.setItem("auth_token", data.token);
                localStorage.setItem("user_id", data.userId);
            }
            window.location.href = "/";
        } catch (err) {
            console.error("Network error:", err);
            signinError.innerText = "❌ Network error. Please try again.";
        }
    });
}

// DEMO ACCOUNT LOGIN
const demoBtn = document.getElementById("demoLoginBtn");
if (demoBtn) {
    demoBtn.addEventListener("click", async () => {
        const signinError = document.getElementById("signinError");
        if (signinError) signinError.innerText = "";
        try {
            const res = await fetch("/api/users/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: "john@example.com",
                    password: "password",
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                signinError.innerText = data.message || "❌ Demo login failed.";
                return;
            }
            if (data.token) {
                localStorage.setItem("auth_token", data.token);
                localStorage.setItem("user_id", data.userId);
            }
            window.location.href = "/";
        } catch (err) {
            console.error("Demo login error:", err);
            if (signinError) signinError.innerText = "❌ Demo login error.";
        }
    });
}
