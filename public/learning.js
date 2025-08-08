// Learning page client script
(function () {
    const state = {
        items: [],
        filtered: [],
        query: "",
        kind: "",
        sort: "newest",
        me: null,
    };

    const els = {
        grid: document.getElementById("learning-grid"),
        empty: document.getElementById("learn-empty"),
        count: document.getElementById("learn-count"),
        search: document.getElementById("learn-search"),
        kind: document.getElementById("learn-kind"),
        sort: document.getElementById("learn-sort"),
        clear: document.getElementById("learn-clear"),
        postBtn: document.getElementById("learn-post"),
        subject: document.getElementById("learn-subject"),
        details: document.getElementById("learn-details"),
        kindCreate: document.getElementById("learn-kind-create"),
        status: document.getElementById("learn-status"),
        modal: document.getElementById("learn-modal"),
        modalBody: document.getElementById("learn-modal-body"),
    };

    function getToken() {
        return localStorage.getItem("auth_token");
    }

    function debounce(fn, wait) {
        let t;
        return (...args) => {
            clearTimeout(t);
            t = setTimeout(() => fn(...args), wait);
        };
    }

    async function fetchMe() {
        const token = getToken();
        if (!token) return null;
        try {
            const res = await fetch("/api/users/me", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return null;
            const data = await res.json();
            return data && data.user ? data.user : null;
        } catch {
            return null;
        }
    }

    async function fetchItems() {
        const params = new URLSearchParams();
        if (state.kind) params.set("kind", state.kind);
        // subject filter is applied client-side on details + subject for richer search
        const res = await fetch("/api/learning?" + params.toString());
        const data = await res.json();
        state.items = Array.isArray(data.items) ? data.items : [];
        applyFilters();
    }

    function applyFilters() {
        const q = state.query.trim().toLowerCase();
        let arr = state.items.filter((it) => {
            if (state.kind && it.kind !== state.kind) return false;
            if (!q) return true;
            const hay = `${it.subject || ""} ${it.details || ""} ${
                (it.ownerId && (it.ownerId.username || it.ownerId.name)) || ""
            }`.toLowerCase();
            return hay.includes(q);
        });

        switch (state.sort) {
            case "oldest":
                arr.sort(
                    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
                );
                break;
            case "az":
                arr.sort((a, b) =>
                    (a.subject || "").localeCompare(b.subject || "")
                );
                break;
            case "za":
                arr.sort((a, b) =>
                    (b.subject || "").localeCompare(a.subject || "")
                );
                break;
            default:
                arr.sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                );
        }

        state.filtered = arr;
        render();
    }

    function render() {
        els.count.textContent = state.filtered.length;
        if (!state.filtered.length) {
            els.grid.innerHTML = "";
            els.empty.hidden = false;
            return;
        }
        els.empty.hidden = true;
        const meId =
            (state.me && state.me._id) || localStorage.getItem("user_id");
        const html = state.filtered
            .map((it) => {
                const owner =
                    (it.ownerId && (it.ownerId.username || it.ownerId.name)) ||
                    "unknown";
                const ts = new Date(it.createdAt);
                const youOwn =
                    meId &&
                    it.ownerId &&
                    (it.ownerId._id === meId || it.ownerId === meId);
                return `
        <article class="card" data-id="${it._id}">
          <div class="meta">
            <span class="badge ${it.kind === "request" ? "request" : ""}">${
                    it.kind === "request" ? "Request" : "Offer"
                }</span>
            <span class="muted">• by @${owner}</span>
            <span class="muted">• ${ts.toLocaleDateString()}</span>
          </div>
          <h3>${escapeHtml(it.subject)}</h3>
          <p>${escapeHtml(it.details)}</p>
          <div class="actions">
            <button class="primary" data-action="view">View</button>
            ${
                youOwn
                    ? '<button class="danger" data-action="delete">Delete</button>'
                    : ""
            }
          </div>
        </article>
      `;
            })
            .join("");
        els.grid.innerHTML = html;
    }

    function openModal(contentHtml) {
        els.modalBody.innerHTML = contentHtml;
        els.modal.hidden = false;
    }
    function closeModal() {
        els.modal.hidden = true;
    }

    function escapeHtml(str) {
        return String(str || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Events
    els.search.addEventListener(
        "input",
        debounce((e) => {
            state.query = e.target.value;
            applyFilters();
        }, 150)
    );
    els.kind.addEventListener("change", (e) => {
        state.kind = e.target.value;
        fetchItems();
    });
    els.sort.addEventListener("change", (e) => {
        state.sort = e.target.value;
        applyFilters();
    });
    els.clear.addEventListener("click", () => {
        state.query = "";
        state.kind = "";
        state.sort = "newest";
        els.search.value = "";
        els.kind.value = "";
        els.sort.value = "newest";
        fetchItems();
    });

    // Grid delegation
    els.grid.addEventListener("click", async (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        const card = e.target.closest(".card");
        const id = card && card.getAttribute("data-id");
        const action = btn.getAttribute("data-action");
        const item = state.filtered.find((x) => x._id === id);
        if (!item) return;

        if (action === "view") {
            const owner =
                (item.ownerId &&
                    (item.ownerId.username || item.ownerId.name)) ||
                "unknown";
            openModal(`
        <h2 id="learn-modal-title">${escapeHtml(item.subject)}</h2>
        <p class="muted">${
            item.kind === "request" ? "Request" : "Offer"
        } • by @${escapeHtml(owner)} • ${new Date(
                item.createdAt
            ).toLocaleString()}</p>
        <div style="margin-top:10px">${escapeHtml(item.details)}</div>
      `);
        }
        if (action === "delete") {
            const yes = confirm("Delete this learning item?");
            if (!yes) return;
            try {
                const token = getToken();
                const res = await fetch(
                    "/api/learning/" + encodeURIComponent(id),
                    {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                if (!res.ok) throw new Error("Delete failed");
                state.items = state.items.filter((x) => x._id !== id);
                applyFilters();
            } catch (err) {
                alert("Could not delete item.");
            }
        }
    });

    // Modal close
    els.modal.addEventListener("click", (e) => {
        if (e.target.hasAttribute("data-close-modal")) closeModal();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeModal();
    });

    // Create new item
    if (els.postBtn) {
        els.postBtn.addEventListener("click", async () => {
            const token = getToken();
            if (!token) {
                window.location.href = "/auth.html";
                return;
            }
            const subject = (els.subject.value || "").trim();
            const details = (els.details.value || "").trim();
            const kind = els.kindCreate.value;
            if (!subject || !details) {
                els.status.textContent = "Please fill subject and details.";
                return;
            }
            els.status.textContent = "Posting...";
            try {
                const res = await fetch("/api/learning", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ subject, details, kind }),
                });
                if (!res.ok) throw new Error("Failed");
                els.subject.value = "";
                els.details.value = "";
                els.kindCreate.value = "offer";
                els.status.textContent = "Posted!";
                await fetchItems();
                setTimeout(() => (els.status.textContent = ""), 1000);
            } catch (err) {
                els.status.textContent = "Could not post. Please try again.";
            }
        });
    }

    // Init
    (async function init() {
        state.me = await fetchMe();
        await fetchItems();
    })();
})();
