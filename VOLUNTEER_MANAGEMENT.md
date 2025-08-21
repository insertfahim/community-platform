# Volunteer Management System

This document describes the enhanced volunteer management system that allows admin users to approve, reject, hold, or revoke volunteer status for users.

## Features

### Volunteer Status Types

1. **Pending** - Initial status when user applies to be a volunteer
2. **Approved** - Volunteer application has been approved and user has volunteer privileges
3. **Rejected** - Volunteer application has been rejected
4. **Hold** - Application is on hold pending further review
5. **Revoked** - Previously approved volunteer has had their status revoked

### Admin Functionality

Admins can:

-   View all volunteer applications categorized by status
-   Approve pending or held applications
-   Reject applications with reason
-   Put applications on hold with notes
-   Revoke approved volunteer status
-   View volunteer profiles and admin notes
-   Track status change history through activity logs

## API Endpoints

### Admin Volunteer Management Endpoints

#### GET `/api/admin/volunteers/requests`

Get all pending and held volunteer requests.

**Response:**

```json
{
  "requests": [
    {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "username": "username",
      "volunteerStatus": "pending",
      "volunteerRequestedAt": "2023-01-01T00:00:00Z",
      "volunteerProfile": {...},
      "volunteerAdminNotes": "Optional notes"
    }
  ]
}
```

#### GET `/api/admin/volunteers/status/:status`

Get volunteers by specific status (pending, approved, rejected, hold, revoked).

#### GET `/api/admin/volunteers/status`

Get all volunteers regardless of status.

#### POST `/api/admin/volunteers/:userId/approve`

Approve a volunteer application.

**Request Body:**

```json
{
    "adminNotes": "Optional admin notes"
}
```

#### POST `/api/admin/volunteers/:userId/reject`

Reject a volunteer application.

**Request Body:**

```json
{
    "reason": "Reason for rejection",
    "adminNotes": "Optional admin notes"
}
```

#### POST `/api/admin/volunteers/:userId/hold`

Put volunteer application on hold.

**Request Body:**

```json
{
    "adminNotes": "Reason for hold"
}
```

#### POST `/api/admin/volunteers/:userId/revoke`

Revoke volunteer status from an approved volunteer.

**Request Body:**

```json
{
    "reason": "Reason for revocation",
    "adminNotes": "Optional admin notes"
}
```

### Enhanced Volunteer Endpoints

#### GET `/api/volunteers/status/:status`

Public endpoint to get volunteers by status.

#### POST `/api/volunteers/approve`

Direct approve action (admin only).

#### POST `/api/volunteers/reject`

Direct reject action (admin only).

#### POST `/api/volunteers/hold`

Direct hold action (admin only).

#### POST `/api/volunteers/revoke`

Direct revoke action (admin only).

## Database Changes

### New Columns Added to `users` Table

-   `volunteer_status` VARCHAR(20) - Current status of volunteer application
-   `volunteer_held_at` TIMESTAMP - When status was set to hold

### Indexes Added

-   `idx_users_volunteer_status` - For efficient status queries
-   `idx_users_active_volunteers` - For active volunteer queries
-   `idx_users_volunteer_requests` - For pending/hold requests

## Frontend Changes

### Admin Dashboard Enhancements

The volunteer management section now shows:

1. **Pending Applications** - Applications waiting for review
2. **Applications on Hold** - Applications temporarily held
3. **Approved Volunteers** - Currently active volunteers
4. **Rejected Applications** - Previously rejected applications
5. **Revoked Volunteers** - Previously approved volunteers who were revoked

### Status-Based Actions

-   **Pending**: Can approve, hold, or reject
-   **Hold**: Can approve or reject
-   **Approved**: Can hold or revoke
-   **Rejected**: Can approve or hold
-   **Revoked**: Can re-approve

### Visual Indicators

-   Color-coded status badges for easy identification
-   Action buttons contextual to current status
-   Date stamps for status changes
-   Admin notes display with tooltips

## Activity Logging

All volunteer status changes are logged with:

-   Admin user who made the change
-   Target user affected
-   Action taken
-   Timestamp
-   Additional metadata (reasons, notes)

Log actions include:

-   `volunteer_approved_by_admin`
-   `volunteer_rejected_by_admin`
-   `volunteer_held_by_admin`
-   `volunteer_revoked_by_admin`

## Migration Instructions

1. Run the SQL migration script: `migration_volunteer_status.sql`
2. Restart the application to load new model functions
3. Admin users can now access enhanced volunteer management through the admin dashboard

## Backward Compatibility

-   Existing `/api/volunteers/verify` endpoint still works for legacy compatibility
-   Existing volunteer data is automatically migrated to use the new status system
-   All previous functionality remains intact

## Security

-   All volunteer management actions require admin role
-   Proper authentication and authorization checks in place
-   Input validation for all status change requests
-   Activity logging for audit trail

## Error Handling

-   Comprehensive error messages for failed operations
-   Proper HTTP status codes returned
-   Frontend user feedback for all actions
-   Database constraint validation
