const { getSql } = require("../config/db");
const {
    listVolunteerRequests,
    listVolunteersByStatus,
    approveVolunteer,
    rejectVolunteer,
    holdVolunteer,
    revokeVolunteer,
} = require("../models/User");
const { addLog } = require("../models/HistoryLog");

const ensureAuth = (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return false;
    }
    return true;
};

const ensureAdmin = (req, res) => {
    if (!ensureAuth(req, res)) return false;
    if (req.user.role !== "admin") {
        res.status(403).json({ message: "Admin access required" });
        return false;
    }
    return true;
};

// Get platform statistics
const getStats = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    try {
        const sql = getSql();

        // Get user stats
        const userStats = await sql`
            select 
                count(*) as total_users,
                count(case when role = 'admin' then 1 end) as admin_users,
                count(case when is_volunteer = true then 1 end) as volunteer_users,
                count(case when is_volunteer_verified = true then 1 end) as verified_volunteers
            from users
        `;

        // Get post stats
        const postStats = await sql`
            select 
                count(*) as total_posts,
                count(case when status = 'active' then 1 end) as active_posts,
                count(case when type = 'request' then 1 end) as requests,
                count(case when type = 'offer' then 1 end) as offers
            from posts
        `;

        // Get donation stats
        const donationStats = await sql`
            select 
                count(*) as total_campaigns,
                coalesce(sum(goal), 0) as total_goal,
                coalesce(sum(raised), 0) as total_raised,
                count(case when status = 'active' then 1 end) as active_campaigns
            from donations
        `;

        // Get event stats
        const eventStats = await sql`
            select 
                count(*) as total_events,
                count(case when date >= current_date then 1 end) as upcoming_events,
                count(case when date < current_date then 1 end) as past_events
            from events
        `;

        // Get emergency contacts count
        const emergencyStats = await sql`
            select count(*) as total_contacts
            from emergency_contacts
        `;

        res.json({
            users: userStats[0],
            posts: postStats[0],
            donations: donationStats[0],
            events: eventStats[0],
            emergency: emergencyStats[0],
        });
    } catch (error) {
        console.error("Error getting admin stats:", error);
        res.status(500).json({ message: "Failed to get statistics" });
    }
};

// Get all users (admin only)
const getUsers = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    try {
        const sql = getSql();
        const users = await sql`
            select 
                id,
                name,
                email,
                username,
                role,
                is_volunteer,
                is_volunteer_verified,
                volunteer_requested_at,
                volunteer_verified_at,
                created_at,
                updated_at
            from users
            order by created_at desc
        `;

        const mappedUsers = users.map((user) => ({
            id: String(user.id),
            name: user.name,
            email: user.email,
            username: user.username,
            role: user.role,
            isVolunteer: user.is_volunteer,
            isVolunteerVerified: user.is_volunteer_verified,
            volunteerRequestedAt: user.volunteer_requested_at,
            volunteerVerifiedAt: user.volunteer_verified_at,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
        }));

        res.json({ users: mappedUsers });
    } catch (error) {
        console.error("Error getting users:", error);
        res.status(500).json({ message: "Failed to get users" });
    }
};

// Get recent activity logs
const getLogs = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    try {
        const sql = getSql();
        const logs = await sql`
            select 
                hl.id,
                hl.action,
                hl.meta,
                hl.created_at,
                u.name as user_name,
                u.email as user_email,
                u.username as user_username
            from history_logs hl
            left join users u on u.id = hl.user_id
            order by hl.created_at desc
            limit 100
        `;

        res.json({ logs });
    } catch (error) {
        console.error("Error getting logs:", error);
        res.status(500).json({ message: "Failed to get logs" });
    }
};

// Update user role (admin only)
const updateUserRole = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    const { userId, role } = req.body;

    if (!userId || !role) {
        return res
            .status(400)
            .json({ message: "userId and role are required" });
    }

    if (!["user", "admin"].includes(role)) {
        return res
            .status(400)
            .json({ message: "Invalid role. Must be 'user' or 'admin'" });
    }

    try {
        const sql = getSql();

        // Prevent removing admin role from the last admin
        if (role === "user") {
            const adminCount = await sql`
                select count(*) as count from users where role = 'admin'
            `;

            if (adminCount[0].count <= 1) {
                return res.status(400).json({
                    message:
                        "Cannot remove admin role. At least one admin must remain.",
                });
            }
        }

        await sql`
            update users 
            set role = ${role}, updated_at = now()
            where id = ${userId}
        `;

        res.json({ message: "User role updated successfully" });
    } catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).json({ message: "Failed to update user role" });
    }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ message: "userId is required" });
    }

    try {
        const sql = getSql();

        // Check if user is admin
        const user = await sql`
            select role from users where id = ${userId}
        `;

        if (!user.length) {
            return res.status(404).json({ message: "User not found" });
        }

        // Prevent deleting the last admin
        if (user[0].role === "admin") {
            const adminCount = await sql`
                select count(*) as count from users where role = 'admin'
            `;

            if (adminCount[0].count <= 1) {
                return res.status(400).json({
                    message: "Cannot delete the last admin user.",
                });
            }
        }

        // Delete user (this will cascade to related records)
        await sql`
            delete from users where id = ${userId}
        `;

        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Failed to delete user" });
    }
};

// Delete post (admin only)
const deletePost = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    const { postId } = req.params;

    try {
        const sql = getSql();
        await sql`
            delete from posts where id = ${postId}
        `;

        res.json({ message: "Post deleted successfully" });
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ message: "Failed to delete post" });
    }
};

// Delete donation (admin only)
const deleteDonation = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    const { donationId } = req.params;

    try {
        const sql = getSql();
        await sql`
            delete from donations where id = ${donationId}
        `;

        res.json({ message: "Donation deleted successfully" });
    } catch (error) {
        console.error("Error deleting donation:", error);
        res.status(500).json({ message: "Failed to delete donation" });
    }
};

// Delete event (admin only)
const deleteEvent = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    const { eventId } = req.params;

    try {
        const sql = getSql();
        await sql`
            delete from events where id = ${eventId}
        `;

        res.json({ message: "Event deleted successfully" });
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ message: "Failed to delete event" });
    }
};

// Add emergency contact (admin only)
const addEmergencyContact = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    const { name, category, mainArea, city, fullAddress, phone, fax } =
        req.body;

    if (!name || !category || !phone) {
        return res
            .status(400)
            .json({ message: "Name, category, and phone are required" });
    }

    try {
        const sql = getSql();
        const result = await sql`
            insert into emergency_contacts (name, category, main_area, city, full_address, phone, fax)
            values (${name}, ${category}, ${mainArea || null}, ${
            city || null
        }, ${fullAddress || null}, ${phone}, ${fax || null})
            returning id
        `;

        res.status(201).json({
            message: "Emergency contact added successfully",
            id: result[0].id,
        });
    } catch (error) {
        console.error("Error adding emergency contact:", error);
        res.status(500).json({ message: "Failed to add emergency contact" });
    }
};

// Delete emergency contact (admin only)
const deleteEmergencyContact = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    const { contactId } = req.params;

    try {
        const sql = getSql();
        await sql`
            delete from emergency_contacts where id = ${contactId}
        `;

        res.json({ message: "Emergency contact deleted successfully" });
    } catch (error) {
        console.error("Error deleting emergency contact:", error);
        res.status(500).json({ message: "Failed to delete emergency contact" });
    }
};

// Volunteer Management Functions

// Get volunteer requests (pending and hold status)
const getVolunteerRequests = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    try {
        const requests = await listVolunteerRequests();
        res.json({ requests });
    } catch (error) {
        console.error("Error getting volunteer requests:", error);
        res.status(500).json({ message: "Failed to get volunteer requests" });
    }
};

// Get volunteers by status
const getVolunteersByStatus = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    const { status } = req.params;
    const validStatuses = [
        "pending",
        "approved",
        "rejected",
        "hold",
        "revoked",
    ];

    if (status && !validStatuses.includes(status)) {
        return res.status(400).json({
            message:
                "Invalid status. Valid statuses: " + validStatuses.join(", "),
        });
    }

    try {
        const volunteers = await listVolunteersByStatus(status || null);
        res.json({ volunteers });
    } catch (error) {
        console.error("Error getting volunteers by status:", error);
        res.status(500).json({ message: "Failed to get volunteers by status" });
    }
};

// Approve volunteer
const approveVolunteerStatus = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    const { userId } = req.params;
    const { adminNotes } = req.body;

    if (!userId) {
        return res.status(400).json({ message: "userId is required" });
    }

    try {
        await approveVolunteer(userId, { adminNotes });
        await addLog({
            userId: req.user.id,
            action: "volunteer_approved_by_admin",
            meta: { targetUserId: userId, adminNotes: adminNotes || null },
        });

        res.json({ message: "Volunteer approved successfully" });
    } catch (error) {
        console.error("Error approving volunteer:", error);
        res.status(500).json({ message: "Failed to approve volunteer" });
    }
};

// Reject volunteer
const rejectVolunteerStatus = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    const { userId } = req.params;
    const { reason, adminNotes } = req.body;

    if (!userId) {
        return res.status(400).json({ message: "userId is required" });
    }

    try {
        await rejectVolunteer(userId, { reason, adminNotes });
        await addLog({
            userId: req.user.id,
            action: "volunteer_rejected_by_admin",
            meta: {
                targetUserId: userId,
                reason: reason || null,
                adminNotes: adminNotes || null,
            },
        });

        res.json({ message: "Volunteer rejected successfully" });
    } catch (error) {
        console.error("Error rejecting volunteer:", error);
        res.status(500).json({ message: "Failed to reject volunteer" });
    }
};

// Hold volunteer
const holdVolunteerStatus = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    const { userId } = req.params;
    const { adminNotes } = req.body;

    if (!userId) {
        return res.status(400).json({ message: "userId is required" });
    }

    try {
        await holdVolunteer(userId, { adminNotes });
        await addLog({
            userId: req.user.id,
            action: "volunteer_held_by_admin",
            meta: { targetUserId: userId, adminNotes: adminNotes || null },
        });

        res.json({ message: "Volunteer status set to hold successfully" });
    } catch (error) {
        console.error("Error holding volunteer:", error);
        res.status(500).json({ message: "Failed to hold volunteer" });
    }
};

// Revoke volunteer
const revokeVolunteerStatus = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    const { userId } = req.params;
    const { reason, adminNotes } = req.body;

    if (!userId) {
        return res.status(400).json({ message: "userId is required" });
    }

    try {
        await revokeVolunteer(userId, { reason, adminNotes });
        await addLog({
            userId: req.user.id,
            action: "volunteer_revoked_by_admin",
            meta: {
                targetUserId: userId,
                reason: reason || null,
                adminNotes: adminNotes || null,
            },
        });

        res.json({ message: "Volunteer status revoked successfully" });
    } catch (error) {
        console.error("Error revoking volunteer:", error);
        res.status(500).json({ message: "Failed to revoke volunteer" });
    }
};

module.exports = {
    getStats,
    getUsers,
    getLogs,
    updateUserRole,
    deleteUser,
    deletePost,
    deleteDonation,
    deleteEvent,
    addEmergencyContact,
    deleteEmergencyContact,
    getVolunteerRequests,
    getVolunteersByStatus,
    approveVolunteerStatus,
    rejectVolunteerStatus,
    holdVolunteerStatus,
    revokeVolunteerStatus,
};
