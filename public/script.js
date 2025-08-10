function toggleMenu() {
    const modernNav = document.getElementById("site-nav-links");
    const legacyNav = document.getElementById("nav-links");
    const target = modernNav || legacyNav;
    if (target) target.classList.toggle("is-open");
}

document.addEventListener("DOMContentLoaded", function () {
    // Remove legacy floating navbar if present
    const legacyNavbar = document.querySelector(".navbar");
    if (legacyNavbar) legacyNavbar.remove();

    // Build header
    const header = document.createElement("header");
    header.className = "site-header";
    header.innerHTML = `
      <div class="site-container">
        <a href="/" class="site-brand">Community Support</a>
        <button id="site-menu-btn" class="site-menu-btn" aria-label="Toggle navigation">☰</button>
        <ul id="site-nav-links" class="site-nav-links">
          <li><a href="/feed.html">Feed</a></li>
          <li data-requires-auth><a href="/post.html">Post Help</a></li>
          <li><a href="/donations.html">Donations</a></li>
          <li><a href="/volunteers.html">Volunteers</a></li>
          <li><a href="/emergency.html">Emergency</a></li>
          <li data-requires-auth><a href="/calendar.html">Calendar</a></li>
          <li data-auth-link><a href="/auth.html">Sign Up / Login</a></li>
          <li data-logout-link style="display:none"><a href="#" id="site-logout">Logout</a></li>
        </ul>
      </div>
    `;
    document.body.insertBefore(header, document.body.firstChild);

    // Build footer
    const footer = document.createElement("footer");
    footer.className = "site-footer";
    const year = new Date().getFullYear();
    footer.innerHTML = `
      <div class="site-container footer-content">
        <div class="footer-brand">Community Support</div>
        <ul class="footer-links">
          <li><a href="/feed.html">Feed</a></li>
          <li data-requires-auth><a href="/post.html">Post</a></li>
          <li><a href="/donations.html">Donations</a></li>
          <li><a href="/volunteers.html">Volunteers</a></li>
          <li><a href="/emergency.html">Emergency</a></li>
          <li data-requires-auth><a href="/calendar.html">Calendar</a></li>
        </ul>
        <div class="footer-copy">© ${year} Community Support</div>
      </div>
    `;
    document.body.appendChild(footer);

    // Toggle button
    const menuBtn = document.getElementById("site-menu-btn");
    const navLinks = document.getElementById("site-nav-links");
    if (menuBtn && navLinks) {
        menuBtn.addEventListener("click", () =>
            navLinks.classList.toggle("is-open")
        );
    }

    // Close menu on outside click
    document.addEventListener("click", (event) => {
        const headerEl = document.querySelector(".site-header");
        const openMenu = document.getElementById("site-nav-links");
        if (headerEl && openMenu && !headerEl.contains(event.target)) {
            openMenu.classList.remove("is-open");
        }
    });

    // Update auth/admin links and visibility
    (async function syncAuthLinks() {
        try {
            const token = localStorage.getItem("auth_token");
            const nav = document.getElementById("site-nav-links");
            if (!nav) return;
            const authLi = nav.querySelector("li[data-auth-link]");
            const logoutLi = nav.querySelector("li[data-logout-link]");
            const logoutA = document.getElementById("site-logout");

            if (token) {
                if (authLi) authLi.style.display = "none";
                if (logoutLi) logoutLi.style.display = "";
                if (logoutA) {
                    logoutA.onclick = (e) => {
                        e.preventDefault();
                        localStorage.removeItem("auth_token");
                        localStorage.removeItem("user_id");
                        window.location.href = "/auth.html";
                    };
                }

                const res = await fetch("/api/users/me", {
                    headers: { Authorization: `Bearer ${token}` },
                }).catch(() => null);
                if (!res || !res.ok) {
                    // Treat as guest if token invalid
                    localStorage.removeItem("auth_token");
                    localStorage.removeItem("user_id");
                    if (authLi) authLi.style.display = "";
                    if (logoutLi) logoutLi.style.display = "none";
                    document.body.dataset.role = "guest";
                    nav.querySelectorAll("[data-requires-auth]").forEach(
                        (el) => {
                            el.style.display = "none";
                        }
                    );
                } else {
                    const data = await res.json();
                    document.body.dataset.role =
                        data && data.user ? data.user.role || "user" : "user";
                    // Show features requiring auth
                    document
                        .querySelectorAll("[data-requires-auth]")
                        .forEach((el) => {
                            el.style.display = "";
                        });
                    // Admin UI disabled per scope
                }
            } else {
                if (authLi) authLi.style.display = "";
                if (logoutLi) logoutLi.style.display = "none";
                document.body.dataset.role = "guest";
                // Hide features requiring auth for guests
                document
                    .querySelectorAll("[data-requires-auth]")
                    .forEach((el) => {
                        el.style.display = "none";
                    });
            }
            // Page-level guardrails
            const path = window.location.pathname;
            const requiresAuthPages = new Set(["/calendar.html", "/post.html"]);
            if (!token && requiresAuthPages.has(path)) {
                window.location.replace("/auth.html");
                return;
            }
            // Redirect disabled pages to home
            const disabledPages = new Set([
                "/messages.html",
                "/learning.html",
                "/incidents.html",
                "/history.html",
                "/admin.html",
            ]);
            if (disabledPages.has(path)) {
                window.location.replace("/");
                return;
            }
        } catch (_err) {
            // ignore
        }
    })();

    // Parallax effect for hero image (if present)
    window.addEventListener("scroll", function () {
        const scrolled = window.pageYOffset;
        const parallax = document.querySelector(".image-container img");
        const speed = scrolled * 0.1;
        if (parallax) {
            parallax.style.transform = `translateY(${speed}px)`;
        }
    });

    // Bounce effect on title words (homepage)
    const words = document.querySelectorAll(".word");
    words.forEach((word) => {
        word.addEventListener("click", function () {
            this.style.animation = "none";
            this.offsetHeight; // reflow
            this.style.animation = "bounce 0.6s ease";
        });
    });
});

// Animation keyframes for bounce
const style = document.createElement("style");
style.textContent = `
  @keyframes bounce {
    0%, 20%, 60%, 100% { transform: translateY(0) scale(1); }
    40% { transform: translateY(-20px) scale(1.1); }
    80% { transform: translateY(-10px) scale(1.05); }
  }
`;
document.head.appendChild(style);
