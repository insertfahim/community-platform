// config/db.js
// Postgres (Neon) SQL helper and lightweight init
require("dotenv").config();
const { neon } = require("@neondatabase/serverless");

let initialized = false;

function getSql() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        throw new Error(
            "DATABASE_URL environment variable is required but not set"
        );
    }
    return neon(url);
}

async function ensureSchema(sql) {
    // Users
    await sql`
        create table if not exists users (
            id bigserial primary key,
            name text not null,
            username text unique,
            email text not null unique,
            password text not null,
            role text not null default 'user',
            is_volunteer boolean not null default false,
            is_volunteer_verified boolean not null default false,
            volunteer_profile jsonb,
            volunteer_requested_at timestamptz,
            volunteer_verified_at timestamptz,
            volunteer_rejected_at timestamptz,
            volunteer_rejection_reason text,
            volunteer_admin_notes text,
            created_at timestamptz not null default now(),
            updated_at timestamptz not null default now()
        );
    `;

    // Posts
    await sql`
        create table if not exists posts (
            id bigserial primary key,
            type text not null check (type in ('request','offer')),
            title text not null,
            description text not null,
            category text not null,
            priority text not null,
            location text not null,
            contact_info text not null,
            owner_id bigint references users(id) on delete set null,
            status text not null default 'active' check (status in ('active','completed','cancelled')),
            created_at timestamptz not null default now(),
            updated_at timestamptz not null default now()
        );
    `;

    // Donations
    await sql`
        create table if not exists donations (
            id bigserial primary key,
            kind text not null check (kind in ('clothes','food','books','other')),
            description text not null,
            location text not null,
            contact text not null,
            status text not null default 'available' check (status in ('available','claimed','donated')),
            owner_id bigint not null references users(id) on delete cascade,
            created_at timestamptz not null default now(),
            updated_at timestamptz not null default now()
        );
    `;

    // Events
    await sql`
        create table if not exists events (
            id bigserial primary key,
            title text not null,
            description text not null,
            start_at timestamptz not null,
            end_at timestamptz not null,
            location text not null,
            owner_id bigint not null references users(id) on delete cascade,
            created_at timestamptz not null default now(),
            updated_at timestamptz not null default now()
        );
    `;

    // Emergency contacts
    await sql`
        create table if not exists emergency_contacts (
            id bigserial primary key,
            name text not null,
            category text not null,
            main_area text not null,
            city text not null,
            full_address text,
            phone text,
            fax text,
            created_at timestamptz not null default now(),
            updated_at timestamptz not null default now()
        );
    `;

    // Messages
    await sql`
        create table if not exists messages (
            id bigserial primary key,
            sender_id bigint not null references users(id) on delete cascade,
            recipient_id bigint not null references users(id) on delete cascade,
            content text not null,
            is_read boolean not null default false,
            created_at timestamptz not null default now(),
            updated_at timestamptz not null default now()
        );
    `;

    // Learning sessions
    await sql`
        create table if not exists learning_sessions (
            id bigserial primary key,
            title text not null,
            description text not null,
            subject text not null,
            level text not null check (level in ('beginner','intermediate','advanced','all')),
            session_type text not null check (session_type in ('teach','learn','exchange')),
            location text not null,
            contact_info text not null,
            owner_id bigint not null references users(id) on delete cascade,
            status text not null default 'active' check (status in ('active','completed','cancelled')),
            created_at timestamptz not null default now(),
            updated_at timestamptz not null default now()
        );
    `;

    // Incidents
    await sql`
        create table if not exists incidents (
            id bigserial primary key,
            title text not null,
            description text not null,
            category text not null check (category in ('safety','traffic','infrastructure','environment','crime','medical','other')),
            severity text not null check (severity in ('low','medium','high','critical')),
            location text not null,
            status text not null default 'reported' check (status in ('reported','investigating','resolved','closed')),
            reporter_id bigint references users(id) on delete set null,
            contact_info text,
            resolution_notes text,
            resolved_by bigint references users(id) on delete set null,
            resolved_at timestamptz,
            created_at timestamptz not null default now(),
            updated_at timestamptz not null default now()
        );
    `;

    // History logs
    await sql`
        create table if not exists history_logs (
            id bigserial primary key,
            user_id bigint not null references users(id) on delete cascade,
            action text not null,
            meta jsonb,
            created_at timestamptz not null default now(),
            updated_at timestamptz not null default now()
        );
    `;
}

async function connectToDatabase() {
    if (initialized) return;
    const sql = getSql();
    await ensureSchema(sql);
    initialized = true;
}

module.exports = { getSql, connectToDatabase };
