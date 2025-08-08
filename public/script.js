function toggleMenu() {
    const navLinks = document.getElementById("nav-links");
    navLinks.classList.toggle("hidden");
}

document.addEventListener("click", function (event) {
    const navbar = document.querySelector(".navbar");
    const navLinks = document.getElementById("nav-links");

    if (!navbar.contains(event.target)) {
        navLinks.classList.add("hidden");
    }
});

document.addEventListener("DOMContentLoaded", function () {
    // Ensure a navbar exists on every page; inject one if missing
    function ensureNavbar() {
        if (document.querySelector(".navbar")) return;
        const nav = document.createElement("nav");
        nav.className = "navbar";
        nav.innerHTML = `
            <div class="menu-icon" onclick="toggleMenu()">&#9776;</div>
            <ul id="nav-links" class="nav-links hidden">
                <li><a href="/auth.html">Sign Up / Login</a></li>
                <li><a href="/post.html">Post Help</a></li>
                <li><a href="/feed.html">Feed</a></li>
                <li><a href="/messages.html">Messages</a></li>
                <li><a href="/calendar.html">Calendar</a></li>
                <li><a href="/donations.html">Donations</a></li>
                <li><a href="/learning.html">Learning</a></li>
                <li><a href="/incidents.html">Alerts</a></li>
                <li><a href="/history.html">My Logs</a></li>
                <li><a href="/volunteers.html">Volunteers</a></li>
                <li><a href="/emergency.html">Emergency</a></li>
            </ul>
        `;
        document.body.insertBefore(nav, document.body.firstChild);
    }

    ensureNavbar();

    // Update navbar auth link based on token
    try {
        const token = localStorage.getItem("auth_token");
        const navLinks = document.getElementById("nav-links");
        if (navLinks) {
            const authLinkLi = Array.from(navLinks.querySelectorAll("a")).find(
                (a) => a.getAttribute("href") === "/auth.html"
            )?.parentElement;
            if (token) {
                if (authLinkLi) authLinkLi.style.display = "none";
                const logoutLi = document.createElement("li");
                const logoutA = document.createElement("a");
                logoutA.href = "#";
                logoutA.textContent = "Logout";
                logoutA.addEventListener("click", (e) => {
                    e.preventDefault();
                    localStorage.removeItem("auth_token");
                    localStorage.removeItem("user_id");
                    window.location.href = "/auth";
                });
                logoutLi.appendChild(logoutA);
                navLinks.appendChild(logoutLi);
            }
        }
    } catch (_e) {
        /* no-op */
    }

    window.addEventListener("scroll", function () {
        const scrolled = window.pageYOffset;
        const parallax = document.querySelector(".image-container img");
        const speed = scrolled * 0.1;

        if (parallax) {
            parallax.style.transform = `translateY(${speed}px)`;
        }
    });

    const words = document.querySelectorAll(".word");
    words.forEach((word) => {
        word.addEventListener("click", function () {
            this.style.animation = "none";
            this.offsetHeight; // Trigger reflow
            this.style.animation = "bounce 0.6s ease";
        });
    });
});

const style = document.createElement("style");
style.textContent = `
  @keyframes bounce {
    0%, 20%, 60%, 100% {
      transform: translateY(0) scale(1);
    }
    40% {
      transform: translateY(-20px) scale(1.1);
    }
    80% {
      transform: translateY(-10px) scale(1.05);
    }
  }
`;
document.head.appendChild(style);
