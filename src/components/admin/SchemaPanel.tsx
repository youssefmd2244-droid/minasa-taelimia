// Supabase Schema Reference — displayed in admin settings
export const SUPABASE_SCHEMA = `
-- ===== EDUVERSE SUPABASE SCHEMA =====
-- Copy and run this in Supabase SQL Editor

-- App Settings
CREATE TABLE app_settings (
    id SERIAL PRIMARY KEY,
    theme_colors JSONB,
    app_name TEXT DEFAULT 'EduVerse',
    logo_url TEXT,
    logo_animation_style TEXT DEFAULT 'pulse',
    rgb_lighting_enabled BOOLEAN DEFAULT true
);

-- Sections (Levels/Courses)
CREATE TABLE sections (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    is_visible BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    display_order INT DEFAULT 0
);

-- Content (Videos, Text, Files)
CREATE TABLE content (
    id SERIAL PRIMARY KEY,
    section_id INT REFERENCES sections(id),
    title TEXT NOT NULL,
    type TEXT CHECK (type IN ('video','text','pdf','word','powerpoint','excel','zip')),
    file_url TEXT,
    content_body TEXT,
    is_featured BOOLEAN DEFAULT false,
    show_on_home BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    level INT DEFAULT 1,
    preferred_language TEXT DEFAULT 'ar',
    grade_year INT
);

-- Comments / Q&A
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    content_id INT REFERENCES content(id),
    user_id UUID REFERENCES auth.users(id),
    comment_text TEXT NOT NULL,
    reply_text TEXT,
    is_visible BOOLEAN DEFAULT true,
    user_grade_year INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

export default SUPABASE_SCHEMA;
