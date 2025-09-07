// Admin Dashboard JavaScript
let currentUser = null;
let authToken = null;

// Check authentication and permissions
async function checkAdminAuth() {
    const token = localStorage.getItem("auth_token");
    if (!token) {
        window.location.href = "/auth.html";
        return;
    }

    try {
        const res = await fetch("/api/users/me", {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("user_id");
            window.location.href = "/auth.html";
            return;
        }

        const data = await res.json();
        if (data.user.role !== "admin") {
            alert("Access denied. Admin privileges required.");
            window.location.href = "index.html";
            return;
        }

        currentUser = data.user;
        authToken = token;
        console.log("Admin authenticated:", currentUser.username);
    } catch (error) {
        console.error("Auth check failed:", error);
        window.location.href = "/auth.html";
    }
}

// Show specific admin section
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll(".admin-section").forEach((section) => {
        section.classList.remove("active");
    });

    // Show selected section
    document.getElementById(sectionId).classList.add("active");

    // Load data for the section
    switch (sectionId) {
        case "overview":
            loadOverview();
            break;
        case "users":
            loadUsers();
            break;
        case "posts":
            loadPosts();
            break;
        case "volunteers":
            loadVolunteers();
            break;
        case "donations":
            loadDonations();
            break;
        case "events":
            loadEvents();
            break;
        case "emergency":
            loadEmergencyContacts();
            break;
        case "logs":
            loadLogs();
            break;
    }
}

// Load overview statistics
async function loadOverview() {
    try {
        const [usersRes, postsRes, donationsRes, eventsRes] = await Promise.all(
            [
                fetch("/api/admin/stats/users", {
                    headers: { Authorization: `Bearer ${authToken}` },
                }),
                fetch("/api/admin/stats/posts", {
                    headers: { Authorization: `Bearer ${authToken}` },
                }),
                fetch("/api/admin/stats/donations", {
                    headers: { Authorization: `Bearer ${authToken}` },
                }),
                fetch("/api/admin/stats/events", {
                    headers: { Authorization: `Bearer ${authToken}` },
                }),
            ]
        );

        // Fallback if admin stats endpoints don't exist yet
        if (!usersRes.ok) {
            const statsGrid = document.getElementById("statsGrid");
            statsGrid.innerHTML = `
                <div class="stat-card">
                    <h4>Total Users</h4>
                    <div class="number">-</div>
                </div>
                <div class="stat-card">
                    <h4>Active Posts</h4>
                    <div class="number">-</div>
                </div>
                <div class="stat-card">
                    <h4>Total Donations</h4>
                    <div class="number">-</div>
                </div>
                <div class="stat-card">
                    <h4>Upcoming Events</h4>
                    <div class="number">-</div>
                </div>
            `;

            document.getElementById("recentActivity").innerHTML = `
                <h3>Recent Activity</h3>
                <p>Admin statistics endpoints not yet implemented. Basic admin functions are available in other sections.</p>
            `;
            return;
        }

        const [usersData, postsData, donationsData, eventsData] =
            await Promise.all([
                usersRes.json(),
                postsRes.json(),
                donationsRes.json(),
                eventsRes.json(),
            ]);

        const statsGrid = document.getElementById("statsGrid");
        statsGrid.innerHTML = `
            <div class="stat-card">
                <h4>Total Users</h4>
                <div class="number">${usersData.total || 0}</div>
            </div>
            <div class="stat-card">
                <h4>Active Posts</h4>
                <div class="number">${postsData.active || 0}</div>
            </div>
            <div class="stat-card">
                <h4>Total Donations</h4>
                <div class="number">$${donationsData.total || 0}</div>
            </div>
            <div class="stat-card">
                <h4>Upcoming Events</h4>
                <div class="number">${eventsData.upcoming || 0}</div>
            </div>
        `;
    } catch (error) {
        console.error("Failed to load overview:", error);
        document.getElementById("statsGrid").innerHTML =
            '<div class="loading">Failed to load statistics</div>';
    }
}

// Load users
async function loadUsers() {
    try {
        const res = await fetch("/api/admin/users", {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        if (!res.ok) {
            document.getElementById("usersList").innerHTML =
                '<div class="loading">Admin users endpoint not implemented yet</div>';
            return;
        }

        const data = await res.json();
        const usersList = document.getElementById("usersList");

        if (!data.users || data.users.length === 0) {
            usersList.innerHTML = "<p>No users found.</p>";
            return;
        }

        usersList.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Volunteer Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.users
                        .map(
                            (user) => `
                        <tr>
                            <td>${user.id}</td>
                            <td>${user.name || "N/A"}</td>
                            <td>${user.email}</td>
                            <td>${user.username || "N/A"}</td>
                            <td><span class="status-badge ${
                                user.role === "admin"
                                    ? "status-active"
                                    : "status-pending"
                            }">${user.role || "user"}</span></td>
                            <td>
                                ${
                                    user.isVolunteer
                                        ? `<span class="status-badge ${
                                              user.isVolunteerVerified
                                                  ? "status-active"
                                                  : "status-pending"
                                          }">
                                        ${
                                            user.isVolunteerVerified
                                                ? "Verified"
                                                : "Pending"
                                        }
                                    </span>`
                                        : "No"
                                }
                            </td>
                            <td>
                                <button class="btn btn-primary" onclick="editUser('${
                                    user.id
                                }')">Edit</button>
                                ${
                                    user.role !== "admin"
                                        ? `<button class="btn btn-danger" onclick="deleteUser('${user.id}')">Delete</button>`
                                        : ""
                                }
                            </td>
                        </tr>
                    `
                        )
                        .join("")}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error("Failed to load users:", error);
        document.getElementById("usersList").innerHTML =
            '<div class="loading">Failed to load users</div>';
    }
}

// Load posts
async function loadPosts() {
    try {
        const res = await fetch("/api/posts", {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        if (!res.ok) {
            throw new Error("Failed to fetch posts");
        }

        const data = await res.json();
        const postsList = document.getElementById("postsList");

        if (!data.posts || data.posts.length === 0) {
            postsList.innerHTML = "<p>No posts found.</p>";
            return;
        }

        postsList.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Type</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Location</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.posts
                        .map(
                            (post) => `
                        <tr>
                            <td>${post.id}</td>
                            <td><span class="status-badge ${
                                post.type === "offer"
                                    ? "status-active"
                                    : "status-warning"
                            }">${post.type}</span></td>
                            <td>${post.title}</td>
                            <td>${post.category}</td>
                            <td><span class="status-badge ${
                                post.priority === "High"
                                    ? "status-rejected"
                                    : post.priority === "Medium"
                                    ? "status-warning"
                                    : "status-active"
                            }">${post.priority}</span></td>
                            <td><span class="status-badge ${
                                post.status === "active"
                                    ? "status-active"
                                    : "status-pending"
                            }">${post.status}</span></td>
                            <td>${post.location || "N/A"}</td>
                            <td>
                                <button class="btn btn-primary" onclick="editPost('${
                                    post.id
                                }')">Edit</button>
                                <button class="btn btn-danger" onclick="deletePost('${
                                    post.id
                                }')">Delete</button>
                            </td>
                        </tr>
                    `
                        )
                        .join("")}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error("Failed to load posts:", error);
        document.getElementById("postsList").innerHTML =
            '<div class="loading">Failed to load posts</div>';
    }
}

// Load volunteers
async function loadVolunteers() {
    try {
        // Fetch all volunteer requests (pending and hold)
        const requestsRes = await fetch("/api/admin/volunteers/requests", {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        // Fetch approved volunteers
        const approvedRes = await fetch(
            "/api/admin/volunteers/status/approved",
            {
                headers: { Authorization: `Bearer ${authToken}` },
            }
        );

        // Fetch rejected volunteers
        const rejectedRes = await fetch(
            "/api/admin/volunteers/status/rejected",
            {
                headers: { Authorization: `Bearer ${authToken}` },
            }
        );

        // Fetch revoked volunteers
        const revokedRes = await fetch("/api/admin/volunteers/status/revoked", {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        if (!requestsRes.ok || !approvedRes.ok) {
            throw new Error("Failed to fetch volunteer data");
        }

        const requestsData = await requestsRes.json();
        const approvedData = await approvedRes.json();
        const rejectedData = rejectedRes.ok
            ? await rejectedRes.json()
            : { volunteers: [] };
        const revokedData = revokedRes.ok
            ? await revokedRes.json()
            : { volunteers: [] };

        const volunteersList = document.getElementById("volunteersList");

        // Separate pending and hold requests
        const pendingRequests =
            requestsData.requests?.filter(
                (r) => r.volunteerStatus === "pending"
            ) || [];
        const holdRequests =
            requestsData.requests?.filter(
                (r) => r.volunteerStatus === "hold"
            ) || [];

        volunteersList.innerHTML = `
            <div class="volunteer-sections">
                <!-- Pending Applications -->
                <div class="volunteer-section">
                    <h3>Pending Volunteer Applications (${
                        pendingRequests.length
                    })</h3>
                    ${
                        pendingRequests.length === 0
                            ? "<p>No pending volunteer applications.</p>"
                            : generateVolunteerTable(pendingRequests, "pending")
                    }
                </div>

                <!-- On Hold Applications -->
                <div class="volunteer-section">
                    <h3>Applications on Hold (${holdRequests.length})</h3>
                    ${
                        holdRequests.length === 0
                            ? "<p>No applications on hold.</p>"
                            : generateVolunteerTable(holdRequests, "hold")
                    }
                </div>

                <!-- Approved Volunteers -->
                <div class="volunteer-section">
                    <h3>Approved Volunteers (${
                        approvedData.volunteers?.length || 0
                    })</h3>
                    ${
                        approvedData.volunteers?.length === 0
                            ? "<p>No approved volunteers.</p>"
                            : generateVolunteerTable(
                                  approvedData.volunteers,
                                  "approved"
                              )
                    }
                </div>

                <!-- Rejected Volunteers -->
                <div class="volunteer-section">
                    <h3>Rejected Volunteers (${
                        rejectedData.volunteers?.length || 0
                    })</h3>
                    ${
                        rejectedData.volunteers?.length === 0
                            ? "<p>No rejected volunteers.</p>"
                            : generateVolunteerTable(
                                  rejectedData.volunteers,
                                  "rejected"
                              )
                    }
                </div>

                <!-- Revoked Volunteers -->
                <div class="volunteer-section">
                    <h3>Revoked Volunteers (${
                        revokedData.volunteers?.length || 0
                    })</h3>
                    ${
                        revokedData.volunteers?.length === 0
                            ? "<p>No revoked volunteers.</p>"
                            : generateVolunteerTable(
                                  revokedData.volunteers,
                                  "revoked"
                              )
                    }
                </div>
            </div>
        `;
    } catch (error) {
        console.error("Failed to load volunteers:", error);
        document.getElementById("volunteersList").innerHTML =
            '<div class="loading">Failed to load volunteers</div>';
    }
}

function generateVolunteerTable(volunteers, status) {
    return `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Username</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Profile</th>
                    <th>Notes</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${volunteers
                    .map((volunteer) => {
                        let statusDate = "N/A";
                        switch (status) {
                            case "approved":
                                statusDate = volunteer.volunteerVerifiedAt
                                    ? new Date(
                                          volunteer.volunteerVerifiedAt
                                      ).toLocaleDateString()
                                    : "N/A";
                                break;
                            case "rejected":
                                statusDate = volunteer.volunteerRejectedAt
                                    ? new Date(
                                          volunteer.volunteerRejectedAt
                                      ).toLocaleDateString()
                                    : "N/A";
                                break;
                            case "hold":
                                statusDate = volunteer.volunteerHeldAt
                                    ? new Date(
                                          volunteer.volunteerHeldAt
                                      ).toLocaleDateString()
                                    : "N/A";
                                break;
                            default:
                                statusDate = volunteer.volunteerRequestedAt
                                    ? new Date(
                                          volunteer.volunteerRequestedAt
                                      ).toLocaleDateString()
                                    : "N/A";
                        }

                        return `
                        <tr>
                            <td>${volunteer.name}</td>
                            <td>${volunteer.email}</td>
                            <td>${volunteer.username}</td>
                            <td>${statusDate}</td>
                            <td><span class="status-badge status-${status}">${status.toUpperCase()}</span></td>
                            <td>
                                ${
                                    volunteer.volunteerProfile
                                        ? `<button class="btn btn-sm btn-primary" onclick="viewVolunteerProfile('${volunteer.id}')">View</button>`
                                        : "No profile"
                                }
                            </td>
                            <td title="${
                                volunteer.volunteerAdminNotes ||
                                volunteer.volunteerRejectionReason ||
                                "No notes"
                            }">
                                ${
                                    volunteer.volunteerAdminNotes ||
                                    volunteer.volunteerRejectionReason ||
                                    "No notes"
                                }
                            </td>
                            <td>
                                ${generateActionButtons(volunteer.id, status)}
                            </td>
                        </tr>
                    `;
                    })
                    .join("")}
            </tbody>
        </table>
    `;
}

function generateActionButtons(userId, currentStatus) {
    switch (currentStatus) {
        case "pending":
            return `
                <button class="btn btn-sm btn-success" onclick="approveVolunteer('${userId}')">Approve</button>
                <button class="btn btn-sm btn-warning" onclick="holdVolunteer('${userId}')">Hold</button>
                <button class="btn btn-sm btn-danger" onclick="rejectVolunteer('${userId}')">Reject</button>
            `;
        case "hold":
            return `
                <button class="btn btn-sm btn-success" onclick="approveVolunteer('${userId}')">Approve</button>
                <button class="btn btn-sm btn-danger" onclick="rejectVolunteer('${userId}')">Reject</button>
            `;
        case "approved":
            return `
                <button class="btn btn-sm btn-warning" onclick="holdVolunteer('${userId}')">Hold</button>
                <button class="btn btn-sm btn-danger" onclick="revokeVolunteer('${userId}')">Revoke</button>
            `;
        case "rejected":
            return `
                <button class="btn btn-sm btn-success" onclick="approveVolunteer('${userId}')">Approve</button>
                <button class="btn btn-sm btn-warning" onclick="holdVolunteer('${userId}')">Hold</button>
            `;
        case "revoked":
            return `
                <button class="btn btn-sm btn-success" onclick="approveVolunteer('${userId}')">Re-approve</button>
            `;
        default:
            return "";
    }
}

// Load donations
async function loadDonations() {
    try {
        const res = await fetch("/api/donations", {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        if (!res.ok) {
            throw new Error("Failed to fetch donations");
        }

        const data = await res.json();
        const donationsList = document.getElementById("donationsList");

        if (!data.donations || data.donations.length === 0) {
            donationsList.innerHTML = "<p>No donations found.</p>";
            return;
        }

        donationsList.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Goal</th>
                        <th>Raised</th>
                        <th>Status</th>
                        <th>Created Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.donations
                        .map(
                            (donation) => `
                        <tr>
                            <td>${donation.id}</td>
                            <td>${donation.title}</td>
                            <td>$${donation.goal}</td>
                            <td>$${donation.raised}</td>
                            <td><span class="status-badge ${
                                donation.status === "active"
                                    ? "status-active"
                                    : "status-pending"
                            }">${donation.status}</span></td>
                            <td>${new Date(
                                donation.created_at
                            ).toLocaleDateString()}</td>
                            <td>
                                <button class="btn btn-primary" onclick="editDonation('${
                                    donation.id
                                }')">Edit</button>
                                <button class="btn btn-danger" onclick="deleteDonation('${
                                    donation.id
                                }')">Delete</button>
                            </td>
                        </tr>
                    `
                        )
                        .join("")}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error("Failed to load donations:", error);
        document.getElementById("donationsList").innerHTML =
            '<div class="loading">Failed to load donations</div>';
    }
}

// Load events
async function loadEvents() {
    try {
        const res = await fetch("/api/events", {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        if (!res.ok) {
            throw new Error("Failed to fetch events");
        }

        const data = await res.json();
        const eventsList = document.getElementById("eventsList");

        if (!data.events || data.events.length === 0) {
            eventsList.innerHTML = "<p>No events found.</p>";
            return;
        }

        eventsList.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Location</th>
                        <th>Organizer</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.events
                        .map(
                            (event) => `
                        <tr>
                            <td>${event.id}</td>
                            <td>${event.title}</td>
                            <td>${new Date(
                                event.date
                            ).toLocaleDateString()}</td>
                            <td>${event.time || "N/A"}</td>
                            <td>${event.location || "N/A"}</td>
                            <td>${event.organizer || "N/A"}</td>
                            <td>
                                <button class="btn btn-primary" onclick="editEvent('${
                                    event.id
                                }')">Edit</button>
                                <button class="btn btn-danger" onclick="deleteEvent('${
                                    event.id
                                }')">Delete</button>
                            </td>
                        </tr>
                    `
                        )
                        .join("")}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error("Failed to load events:", error);
        document.getElementById("eventsList").innerHTML =
            '<div class="loading">Failed to load events</div>';
    }
}

// Load emergency contacts
async function loadEmergencyContacts() {
    try {
        const res = await fetch("/api/emergency", {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        if (!res.ok) {
            throw new Error("Failed to fetch emergency contacts");
        }

        const data = await res.json();
        const emergencyList = document.getElementById("emergencyList");

        if (!data.contacts || data.contacts.length === 0) {
            emergencyList.innerHTML = "<p>No emergency contacts found.</p>";
            return;
        }

        emergencyList.innerHTML = `
            <button class="btn btn-success" onclick="addEmergencyContact()" style="margin-bottom: 20px;">Add New Contact</button>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Area</th>
                        <th>City</th>
                        <th>Phone</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.contacts
                        .map(
                            (contact) => `
                        <tr>
                            <td>${contact.id}</td>
                            <td>${contact.name}</td>
                            <td>${contact.category}</td>
                            <td>${contact.main_area || "N/A"}</td>
                            <td>${contact.city || "N/A"}</td>
                            <td>${contact.phone}</td>
                            <td>
                                <button class="btn btn-primary" onclick="editEmergencyContact('${
                                    contact.id
                                }')">Edit</button>
                                <button class="btn btn-danger" onclick="deleteEmergencyContact('${
                                    contact.id
                                }')">Delete</button>
                            </td>
                        </tr>
                    `
                        )
                        .join("")}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error("Failed to load emergency contacts:", error);
        document.getElementById("emergencyList").innerHTML =
            '<div class="loading">Failed to load emergency contacts</div>';
    }
}

// Load activity logs
async function loadLogs() {
    try {
        const res = await fetch("/api/admin/logs", {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        if (!res.ok) {
            document.getElementById("logsList").innerHTML =
                '<div class="loading">Admin logs endpoint not implemented yet</div>';
            return;
        }

        const data = await res.json();
        const logsList = document.getElementById("logsList");

        if (!data.logs || data.logs.length === 0) {
            logsList.innerHTML = "<p>No logs found.</p>";
            return;
        }

        logsList.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>User</th>
                        <th>Action</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.logs
                        .map(
                            (log) => `
                        <tr>
                            <td>${new Date(
                                log.created_at
                            ).toLocaleString()}</td>
                            <td>${log.user_name || "System"}</td>
                            <td><span class="status-badge status-active">${
                                log.action
                            }</span></td>
                            <td>${
                                log.meta ? JSON.stringify(log.meta) : "N/A"
                            }</td>
                        </tr>
                    `
                        )
                        .join("")}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error("Failed to load logs:", error);
        document.getElementById("logsList").innerHTML =
            '<div class="loading">Failed to load logs</div>';
    }
}

// Action functions
async function approveVolunteer(userId) {
    const adminNotes = prompt("Add admin notes (optional):");
    try {
        const res = await fetch(`/api/admin/volunteers/${userId}/approve`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                adminNotes,
            }),
        });

        if (res.ok) {
            alert("Volunteer approved successfully!");
            loadVolunteers();
        } else {
            const data = await res.json();
            alert("Error: " + (data.message || "Failed to approve volunteer"));
        }
    } catch (error) {
        console.error("Error approving volunteer:", error);
        alert("Failed to approve volunteer");
    }
}

async function rejectVolunteer(userId) {
    const reason = prompt("Reason for rejection:");
    if (!reason) return;

    const adminNotes = prompt("Add admin notes (optional):");

    try {
        const res = await fetch(`/api/admin/volunteers/${userId}/reject`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                reason,
                adminNotes,
            }),
        });

        if (res.ok) {
            alert("Volunteer rejected successfully!");
            loadVolunteers();
        } else {
            const data = await res.json();
            alert("Error: " + (data.message || "Failed to reject volunteer"));
        }
    } catch (error) {
        console.error("Error rejecting volunteer:", error);
        alert("Failed to reject volunteer");
    }
}

async function holdVolunteer(userId) {
    const adminNotes = prompt(
        "Reason for putting on hold (will be saved as admin notes):"
    );
    if (!adminNotes) return;

    try {
        const res = await fetch(`/api/admin/volunteers/${userId}/hold`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                adminNotes,
            }),
        });

        if (res.ok) {
            alert("Volunteer status set to hold successfully!");
            loadVolunteers();
        } else {
            const data = await res.json();
            alert("Error: " + (data.message || "Failed to hold volunteer"));
        }
    } catch (error) {
        console.error("Error holding volunteer:", error);
        alert("Failed to hold volunteer");
    }
}

async function revokeVolunteer(userId) {
    if (
        !confirm(
            "Are you sure you want to revoke volunteer status? This will remove their volunteer privileges."
        )
    ) {
        return;
    }

    const reason = prompt("Reason for revoking volunteer status:");
    if (!reason) return;

    const adminNotes = prompt("Add admin notes (optional):");

    try {
        const res = await fetch(`/api/admin/volunteers/${userId}/revoke`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                reason,
                adminNotes,
            }),
        });

        if (res.ok) {
            alert("Volunteer status revoked successfully!");
            loadVolunteers();
        } else {
            const data = await res.json();
            alert(
                "Error: " +
                    (data.message || "Failed to revoke volunteer status")
            );
        }
    } catch (error) {
        console.error("Error revoking volunteer:", error);
        alert("Failed to revoke volunteer status");
    }
}

// Placeholder functions for other actions
function editUser(userId) {
    alert("User editing functionality to be implemented");
}
function deleteUser(userId) {
    if (confirm("Are you sure you want to delete this user?")) {
        alert("User deletion functionality to be implemented");
    }
}
function editPost(postId) {
    alert("Post editing functionality to be implemented");
}
function deletePost(postId) {
    if (confirm("Are you sure you want to delete this post?")) {
        alert("Post deletion functionality to be implemented");
    }
}
function editDonation(donationId) {
    alert("Donation editing functionality to be implemented");
}
function deleteDonation(donationId) {
    if (confirm("Are you sure you want to delete this donation?")) {
        alert("Donation deletion functionality to be implemented");
    }
}
function editEvent(eventId) {
    alert("Event editing functionality to be implemented");
}
function deleteEvent(eventId) {
    if (confirm("Are you sure you want to delete this event?")) {
        alert("Event deletion functionality to be implemented");
    }
}
function addEmergencyContact() {
    alert("Add emergency contact functionality to be implemented");
}
function editEmergencyContact(contactId) {
    alert("Emergency contact editing functionality to be implemented");
}
function deleteEmergencyContact(contactId) {
    if (confirm("Are you sure you want to delete this emergency contact?")) {
        alert("Emergency contact deletion functionality to be implemented");
    }
}
function viewVolunteerProfile(userId) {
    alert("Volunteer profile viewing functionality to be implemented");
}

// Initialize dashboard
document.addEventListener("DOMContentLoaded", async () => {
    await checkAdminAuth();
    loadOverview();
});
