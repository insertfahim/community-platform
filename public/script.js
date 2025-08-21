function toggleMenu() {
    const modernNav = document.getElementById("site-nav-links");
    const legacyNav = document.getElementById("nav-links");
    const target = modernNav || legacyNav;
    if (target) target.classList.toggle("is-open");
}

document.addEventListener("DOMContentLoaded", function () {
    // Remove all existing navigation elements to ensure consistency
    const legacyNavbar = document.querySelector(".navbar");
    if (legacyNavbar) legacyNavbar.remove();

    // Remove existing site-header if present
    const existingHeader = document.querySelector(".site-header");
    if (existingHeader) existingHeader.remove();

    // Remove existing navigation by looking for common patterns
    // Look for divs that contain the community branding or navigation links
    const allDivs = document.querySelectorAll("div");
    allDivs.forEach((div) => {
        const hasHomeLink = div.querySelector(
            'a[href="/"], a[href="index.html"]'
        );
        const hasCommunityText =
            div.textContent && div.textContent.includes("🏘️ Community");
        const hasNavStyle =
            div.getAttribute("style") &&
            div.getAttribute("style").includes("background: #f8f9fa");

        if (
            (hasHomeLink || hasCommunityText || hasNavStyle) &&
            div !== document.body
        ) {
            // Additional check to make sure this looks like navigation
            const hasMultipleLinks = div.querySelectorAll("a").length > 2;
            if (hasMultipleLinks || hasNavStyle) {
                div.remove();
            }
        }
    });

    // Always create a consistent header for all pages
    const header = document.createElement("header");
    header.className = "site-header";
    header.innerHTML = `
      <div class="site-container">
        <a href="/" class="site-brand">🏘️ Community</a>
        <button id="site-menu-btn" class="site-menu-btn" aria-label="Toggle navigation">☰</button>
        <ul id="site-nav-links" class="site-nav-links">
          <li><a href="/">Home</a></li>
          <li><a href="/feed.html">Feed</a></li>
          <li data-requires-auth><a href="/post.html">Post Help</a></li>
          <li><a href="/calendar.html">Calendar</a></li>
          <li><a href="/donations.html">Donations</a></li>
          <li><a href="/volunteers.html">Volunteers</a></li>
          <li><a href="/emergency.html">Emergency</a></li>
          <li data-requires-admin style="display:none">
            <a href="/admin.html" style="background: rgba(255, 255, 255, 0.15); color: #fbbf24; padding: 8px 16px; border-radius: 6px;">🛡️ Dashboard</a>
          </li>
          <li data-auth-link><a href="/auth.html">Sign Up / Login</a></li>
          <li data-logout-link style="display:none"><a href="#" id="site-logout">Logout</a></li>
        </ul>
      </div>
    `;
    document.body.insertBefore(header, document.body.firstChild);

    // Ensure body has proper padding for fixed header
    if (
        !document.body.style.paddingTop &&
        !document.body.classList.contains("admin-dashboard")
    ) {
        document.body.style.paddingTop = "64px";
    }

    // Toggle button - works for both existing and dynamic headers
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

                    // Show/hide admin links based on role
                    document
                        .querySelectorAll("[data-requires-admin]")
                        .forEach((el) => {
                            el.style.display =
                                data.user && data.user.role === "admin"
                                    ? ""
                                    : "none";
                        });
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

                // Hide admin features for guests
                document
                    .querySelectorAll("[data-requires-admin]")
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
            ]);
            if (disabledPages.has(path)) {
                window.location.replace("/");
                return;
            }

            // Admin page access control
            if (path === "/admin.html") {
                if (!token) {
                    window.location.replace("/auth.html");
                    return;
                }
                // Additional admin role check is handled by admin.js
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

// Enhanced Home Page Interactions
document.addEventListener("DOMContentLoaded", function () {
    // Animate stats on scroll
    function animateStats() {
        const statNumbers = document.querySelectorAll(".stat-number");
        statNumbers.forEach((stat, index) => {
            const finalValue = parseInt(stat.textContent);
            let currentValue = 0;
            const increment = finalValue / 50;
            const timer = setInterval(() => {
                currentValue += increment;
                if (currentValue >= finalValue) {
                    stat.textContent = stat.textContent.includes("+")
                        ? finalValue + "+"
                        : finalValue;
                    clearInterval(timer);
                } else {
                    stat.textContent =
                        Math.floor(currentValue) +
                        (stat.textContent.includes("+") ? "+" : "");
                }
            }, 30);
        });
    }

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.2,
        rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("animate-in");

                // Special handling for stats section
                if (entry.target.classList.contains("stats-section")) {
                    setTimeout(animateStats, 500);
                }
            }
        });
    }, observerOptions);

    // Observe sections for scroll animations
    const sections = document.querySelectorAll(
        ".features-section, .stats-section"
    );
    sections.forEach((section) => observer.observe(section));

    // Observe feature cards individually
    const featureCards = document.querySelectorAll(".feature-card");
    featureCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        observer.observe(card);
    });

    // Add smooth scrolling to feature links
    const featureLinks = document.querySelectorAll(".feature-link");
    featureLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
            const href = link.getAttribute("href");
            if (href.startsWith("#")) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: "smooth" });
                }
            }
        });
    });

    // Add loading state for CTA buttons
    const ctaButtons = document.querySelectorAll(".cta-btn");
    ctaButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
            button.classList.add("loading");
            setTimeout(() => {
                button.classList.remove("loading");
            }, 1000);
        });
    });

    // Add parallax effect to hero section
    let ticking = false;
    function updateParallax() {
        const scrolled = window.pageYOffset;
        const parallax = document.querySelector(".hero-image img");
        if (parallax) {
            const speed = scrolled * 0.1;
            parallax.style.transform = `translateY(${speed}px) scale(1.05)`;
        }
        ticking = false;
    }

    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }

    // Add scroll event listener for parallax (only if user prefers motion)
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        window.addEventListener("scroll", requestTick);
    }
});

// Add CSS for scroll animations
const animationStyles = document.createElement("style");
animationStyles.textContent = `
    .features-section,
    .stats-section {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease;
    }
    
    .features-section.animate-in,
    .stats-section.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    .feature-card {
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.5s ease;
    }
    
    .feature-card.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    .cta-btn.loading {
        pointer-events: none;
        opacity: 0.7;
        transform: scale(0.98);
    }
    
    .cta-btn.loading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        margin: -10px 0 0 -10px;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(animationStyles);
