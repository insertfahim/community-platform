# Incident Updates Feature

This feature allows users who reported an incident to share time-to-time updates about the incident's progress, providing ongoing communication about the situation.

## Overview

The incident updates feature adds the following capabilities:

-   Incident reporters can add multiple updates to their incidents over time
-   Updates are displayed in chronological order on the incident view
-   Update count is shown on incident cards
-   Only the original incident reporter can add updates to their incident
-   Updates can optionally include status changes

## Database Schema

### New Table: incident_updates

```sql
CREATE TABLE incident_updates (
    id BIGSERIAL PRIMARY KEY,
    incident_id BIGINT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    reporter_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    update_text TEXT NOT NULL,
    status_change TEXT CHECK (status_change IN ('reported', 'investigating', 'resolved', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Indexes

-   `idx_incident_updates_incident_id` - For querying updates by incident
-   `idx_incident_updates_reporter_id` - For querying updates by user
-   `idx_incident_updates_created_at` - For chronological ordering

## API Endpoints

### Add Update to Incident

```
POST /api/incidents/:incidentId/updates
Authorization: Bearer <token>
Content-Type: application/json

{
    "updateText": "Update description",
    "statusChange": "investigating" // optional
}
```

### Get Updates for Incident

```
GET /api/incidents/:incidentId/updates

Response:
{
    "updates": [
        {
            "id": 1,
            "incident_id": 1,
            "reporter_id": 1,
            "update_text": "Update description",
            "status_change": null,
            "created_at": "2023-...",
            "reporter_name": "John Doe",
            "reporter_username": "johndoe"
        }
    ]
}
```

### Get Incident with Updates

```
GET /api/incidents/:id?includeUpdates=true

Response:
{
    "incident": {
        "id": 1,
        "title": "Incident title",
        // ... other incident fields
        "updates": [
            // ... updates array
        ]
    }
}
```

### Edit Update

```
PUT /api/incidents/updates/:updateId
Authorization: Bearer <token>
Content-Type: application/json

{
    "updateText": "Modified update text"
}
```

### Delete Update

```
DELETE /api/incidents/updates/:updateId
Authorization: Bearer <token>
```

### Get User's Updates

```
GET /api/incidents/my-updates?limit=20
Authorization: Bearer <token>
```

## Frontend Features

### Enhanced Incident Cards

-   Display update count: "View Updates (3)"
-   Show "Add Update" button for incident reporters
-   Update count is displayed next to the "View Updates" button

### Update Modals

1. **View Updates Modal**: Shows all updates for an incident in chronological order
2. **Add Update Modal**: Allows reporters to add new updates with optional status changes

### Permissions

-   Only authenticated users can add updates
-   Only the original incident reporter can add updates to their incident
-   Anyone can view updates (public information)
-   Only update creators can edit/delete their updates

## Usage Flow

1. **User reports an incident** via the existing incident reporting form
2. **User can add updates** by clicking "Add Update" button on their incident card
3. **Updates are displayed** when anyone clicks "View Updates" on the incident
4. **Updates show chronologically** with newest at the bottom
5. **Status changes** are highlighted in the update display

## Security & Validation

### Server-side Validation

-   Update text is required and cannot be empty
-   Only incident reporters can add updates to their incidents
-   Update authors can only edit/delete their own updates
-   Status changes are validated against allowed values

### Client-side Features

-   Authentication required messages
-   Permission-based UI (only show "Add Update" for incident reporters)
-   Input validation and user feedback
-   Responsive design for mobile devices

## Installation & Migration

1. **Run the migration**:

    ```bash
    node run-incident-updates-migration.js
    ```

2. **Test the functionality**:

    ```bash
    node test-incident-updates.js
    ```

3. **Start the server**:
    ```bash
    npm start
    ```

## Example Usage

### Adding an Update

```javascript
// User reported incident ID 1, now wants to add an update
POST /api/incidents/1/updates
{
    "updateText": "The situation has improved. Repairs are underway.",
    "statusChange": "investigating"
}
```

### Viewing Updates

```javascript
// Anyone can view updates for incident 1
GET /api/incidents/1/updates

// Response includes all updates with reporter information
{
    "updates": [
        {
            "id": 1,
            "update_text": "Initial report filed with authorities",
            "created_at": "2023-01-01T10:00:00Z",
            "reporter_name": "John Doe"
        },
        {
            "id": 2,
            "update_text": "The situation has improved. Repairs are underway.",
            "status_change": "investigating",
            "created_at": "2023-01-01T14:00:00Z",
            "reporter_name": "John Doe"
        }
    ]
}
```

## Benefits

1. **Enhanced Communication**: Allows ongoing updates about incident progress
2. **Transparency**: Community can see the current status of reported issues
3. **Accountability**: Reporters can provide follow-ups on their reports
4. **Historical Record**: Creates a timeline of incident development
5. **Improved Trust**: Shows that incidents are being monitored and updated

## Future Enhancements

Potential additions could include:

-   Email notifications when updates are added
-   Photo attachments to updates
-   Admin ability to add official updates
-   Update categories (progress, resolution, setback, etc.)
-   Public comments on incidents (separate from reporter updates)
