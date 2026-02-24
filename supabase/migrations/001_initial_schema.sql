-- ==========================================
-- Saphire AI - Initial Database Schema
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- Users Table (extends Supabase auth.users)
-- ==========================================
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- ==========================================
-- Interviews Table
-- ==========================================
CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_role TEXT NOT NULL,
    company TEXT NOT NULL,
    experience_level TEXT NOT NULL CHECK (experience_level IN ('entry', 'mid', 'senior', 'executive')),
    interview_type TEXT NOT NULL CHECK (interview_type IN ('technical', 'behavioral', 'mixed')),
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
    overall_score INTEGER CHECK (overall_score >= 1 AND overall_score <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- Users can CRUD their own interviews
CREATE POLICY "Users can read own interviews" ON interviews
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own interviews" ON interviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interviews" ON interviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own interviews" ON interviews
    FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- Questions Table (for Interviews)
-- ==========================================
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT,
    feedback TEXT,
    score INTEGER CHECK (score >= 1 AND score <= 10),
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Users can CRUD questions for their own interviews
CREATE POLICY "Users can read own questions" ON questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM interviews 
            WHERE interviews.id = questions.interview_id 
            AND interviews.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own questions" ON questions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM interviews 
            WHERE interviews.id = questions.interview_id 
            AND interviews.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own questions" ON questions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM interviews 
            WHERE interviews.id = questions.interview_id 
            AND interviews.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own questions" ON questions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM interviews 
            WHERE interviews.id = questions.interview_id 
            AND interviews.user_id = auth.uid()
        )
    );

-- ==========================================
-- Presentations Table
-- ==========================================
CREATE TABLE presentations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
    overall_score INTEGER CHECK (overall_score >= 1 AND overall_score <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;

-- Users can CRUD their own presentations
CREATE POLICY "Users can read own presentations" ON presentations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own presentations" ON presentations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presentations" ON presentations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own presentations" ON presentations
    FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- Panel Questions Table (for Presentations)
-- ==========================================
CREATE TABLE panel_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    presentation_id UUID NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
    persona_id TEXT NOT NULL,
    persona_name TEXT NOT NULL,
    persona_role TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT,
    feedback TEXT,
    score INTEGER CHECK (score >= 1 AND score <= 10),
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE panel_questions ENABLE ROW LEVEL SECURITY;

-- Users can CRUD panel questions for their own presentations
CREATE POLICY "Users can read own panel questions" ON panel_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM presentations 
            WHERE presentations.id = panel_questions.presentation_id 
            AND presentations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own panel questions" ON panel_questions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM presentations 
            WHERE presentations.id = panel_questions.presentation_id 
            AND presentations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own panel questions" ON panel_questions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM presentations 
            WHERE presentations.id = panel_questions.presentation_id 
            AND presentations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own panel questions" ON panel_questions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM presentations 
            WHERE presentations.id = panel_questions.presentation_id 
            AND presentations.user_id = auth.uid()
        )
    );

-- ==========================================
-- Indexes for Performance
-- ==========================================
CREATE INDEX idx_interviews_user_id ON interviews(user_id);
CREATE INDEX idx_interviews_status ON interviews(status);
CREATE INDEX idx_questions_interview_id ON questions(interview_id);
CREATE INDEX idx_presentations_user_id ON presentations(user_id);
CREATE INDEX idx_presentations_status ON presentations(status);
CREATE INDEX idx_panel_questions_presentation_id ON panel_questions(presentation_id);

-- ==========================================
-- Updated At Trigger Function
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON interviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_presentations_updated_at BEFORE UPDATE ON presentations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
