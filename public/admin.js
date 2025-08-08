(async function () {
    const token = localStorage.getItem("auth_token");
    if (!token) return (window.location.href = "/auth");
    try {
        // ensure current user is admin; otherwise redirect
        const me = await fetch("/api/users/me", {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!me.ok) return (window.location.href = "/auth");
        const meData = await me.json();
        if (!meData.user || meData.user.role !== "admin") {
            return (window.location.href = "/");
        }
    } catch {
        return (window.location.href = "/auth");
    }

    async function loadUsers() {
        const res = await fetch("/api/admin/users", {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
            alert("Failed to load users");
            return;
        }
        const { users } = await res.json();
        const body = document.getElementById("usersBody");
        body.innerHTML = "";
        users.forEach((u) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td><span class="pill">${u.role}</span></td>
        <td>${
            u.isVolunteer
                ? u.isVolunteerVerified
                    ? "Verified"
                    : "Pending"
                : "No"
        }</td>
        <td>
          <select data-user="${u._id || u.id}" data-current="${u.role}">
            <option value="user" ${
                u.role === "user" ? "selected" : ""
            }>user</option>
            <option value="admin" ${
                u.role === "admin" ? "selected" : ""
            }>admin</option>
          </select>
        </td>
      `;
            body.appendChild(tr);
        });

        body.querySelectorAll("select").forEach((sel) => {
            sel.addEventListener("change", async (e) => {
                const userId = sel.getAttribute("data-user");
                const newRole = sel.value;
                const res = await fetch(`/api/admin/users/${userId}/role`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ role: newRole }),
                });
                if (!res.ok) {
                    alert("Failed to update role");
                    sel.value = sel.getAttribute("data-current");
                    return;
                }
                const { user } = await res.json();
                sel.setAttribute("data-current", user.role);
                sel.closest("tr").querySelector(".pill").textContent =
                    user.role;
            });
        });
    }

    loadUsers();
})();
