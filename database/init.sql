-- 铜雀台医美 AI 智能管家 — 数据库初始化脚本
-- PostgreSQL

-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'consultant')),
    real_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- 咨询师扩展信息表
CREATE TABLE consultant_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    employee_no VARCHAR(50),
    speciality TEXT[] DEFAULT '{}',
    customer_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMP DEFAULT NOW(),
    left_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- 客户画像表
CREATE TABLE customer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    consultant_id UUID NOT NULL REFERENCES users(id),
    budget_sensitivity VARCHAR(10) DEFAULT 'medium' CHECK (budget_sensitivity IN ('high', 'medium', 'low')),
    source VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'lost')),
    last_contact_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- 标签表
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 私人喜好备忘录表
CREATE TABLE preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    importance VARCHAR(20) DEFAULT 'normal' CHECK (importance IN ('normal', 'important', 'critical')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 项目时间轴表
CREATE TABLE project_timelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    project_name VARCHAR(200) NOT NULL,
    project_type VARCHAR(100),
    date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'follow_up')),
    notes TEXT,
    consultant_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 面诊会话表
CREATE TABLE consultation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customer_profiles(id),
    consultant_id UUID NOT NULL REFERENCES users(id),
    audio_url VARCHAR(500),
    transcript TEXT DEFAULT '',
    summary TEXT DEFAULT '',
    key_points JSONB DEFAULT '[]',
    blockers JSONB DEFAULT '[]',
    decision_makers TEXT[] DEFAULT '{}',
    follow_up_strategy JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'transcribing', 'completed', 'failed')),
    duration INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- 任务提醒表
CREATE TABLE task_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customer_profiles(id),
    consultant_id UUID NOT NULL REFERENCES users(id),
    project_id UUID REFERENCES project_timelines(id),
    task_type VARCHAR(20) NOT NULL CHECK (task_type IN ('follow_up', 'recheck', 'care', 'promotion')),
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    trigger_date TIMESTAMP NOT NULL,
    trigger_rule TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'overdue')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    care_message TEXT,
    channel VARCHAR(20) DEFAULT 'system' CHECK (channel IN ('system', 'wecom', 'sms')),
    reminder_sent BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    result TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- 跟进策略模板表
CREATE TABLE follow_up_strategy_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    applicable_project_types TEXT[] DEFAULT '{}',
    applicable_blocker_types TEXT[] DEFAULT '{}',
    steps JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- SOP模板表
CREATE TABLE sop_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    project_type VARCHAR(100) NOT NULL,
    nodes JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- 金牌话术表
CREATE TABLE golden_scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) NOT NULL,
    scenario VARCHAR(255) NOT NULL,
    script TEXT NOT NULL,
    conversion_rate FLOAT DEFAULT 0,
    usage_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    source_session_id UUID REFERENCES consultation_sessions(id),
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- 营销活动表
CREATE TABLE marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('upgrade', 'promotion', 'new_product', 'anniversary')),
    description TEXT DEFAULT '',
    target_product VARCHAR(200) NOT NULL,
    related_products TEXT[] DEFAULT '{}',
    discount VARCHAR(100),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- 精准触达记录表
CREATE TABLE targeted_outreaches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id),
    customer_id UUID NOT NULL REFERENCES customer_profiles(id),
    consultant_id UUID NOT NULL REFERENCES users(id),
    matched_reason TEXT,
    match_score FLOAT DEFAULT 0,
    generated_message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'responded', 'converted')),
    sent_at TIMESTAMP,
    channel VARCHAR(20) DEFAULT 'system',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 默认管理员账号（密码: admin123456 的 bcrypt 哈希）
INSERT INTO users (username, password, role, real_name, phone)
VALUES ('admin', '$2b$10$placeholder_hash_for_admin123456', 'admin', '系统管理员', '13800000000');

-- 索引
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_customer_profiles_consultant ON customer_profiles(consultant_id);
CREATE INDEX idx_customer_profiles_status ON customer_profiles(status);
CREATE INDEX idx_consultation_sessions_customer ON consultation_sessions(customer_id);
CREATE INDEX idx_consultation_sessions_consultant ON consultation_sessions(consultant_id);
CREATE INDEX idx_task_reminders_consultant ON task_reminders(consultant_id);
CREATE INDEX idx_task_reminders_status ON task_reminders(status);
CREATE INDEX idx_task_reminders_trigger_date ON task_reminders(trigger_date);
CREATE INDEX idx_golden_scripts_category ON golden_scripts(category);
CREATE INDEX idx_golden_scripts_approved ON golden_scripts(is_approved);
CREATE INDEX idx_targeted_outreaches_campaign ON targeted_outreaches(campaign_id);
CREATE INDEX idx_targeted_outreaches_consultant ON targeted_outreaches(consultant_id);
