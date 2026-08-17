-- Enable UUID extension for secure non-sequential IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define Enums
CREATE TYPE user_role AS ENUM ('STUDENT', 'TUTOR', 'ADMIN');
CREATE TYPE booking_status AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'DISPUTED');
CREATE TYPE transaction_type AS ENUM ('LESSON_PAYMENT', 'ESCROW_RELEASE', 'REFUND', 'PLATFORM_FEE');
CREATE TYPE transaction_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- -------------------------------------------------------------
-- 1. USERS & IDENTITY
-- -------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'STUDENT',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE student_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tutor_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    headline VARCHAR(255),
    bio TEXT,
    hourly_rate NUMERIC(10, 2) NOT NULL CHECK (hourly_rate >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Taxonomy / Tags (For Tutor Search filtering)
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE tutor_subjects (
    tutor_id UUID REFERENCES tutor_profiles(user_id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    PRIMARY KEY (tutor_id, subject_id)
);

-- -------------------------------------------------------------
-- 2. AVAILABILITY & BOOKING ENGINE
-- -------------------------------------------------------------
CREATE TABLE availability_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id UUID NOT NULL REFERENCES tutor_profiles(user_id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_booked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_valid_timespan CHECK (end_time > start_time)
);

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    slot_id UUID UNIQUE NOT NULL REFERENCES availability_slots(id) ON DELETE RESTRICT,
    
    amount_charged NUMERIC(10, 2) NOT NULL,
    status booking_status DEFAULT 'PENDING_PAYMENT',
    meeting_link VARCHAR(512), -- Auto-populated Jitsi/Zoom/Google Meet link
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- 3. PAYMENTS & ESCROW AUDIT LOGS
-- -------------------------------------------------------------
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    
    amount NUMERIC(10, 2) NOT NULL,
    type transaction_type NOT NULL,
    status transaction_status DEFAULT 'PENDING',
    
    -- Gateway Integrations (Stripe / Razorpay)
    payment_gateway VARCHAR(50) DEFAULT 'STRIPE',
    gateway_session_id VARCHAR(255), -- checkout.session.id
    gateway_payment_intent VARCHAR(255), -- pi_xxxxxxxx
    
    metadata JSONB, -- Flexible JSON bucket for raw gateway responses
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- 4. PERFORMANCE INDEXES
-- -------------------------------------------------------------
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_availability_tutor_lookup ON availability_slots(tutor_id, is_booked, start_time);
CREATE INDEX idx_bookings_student ON bookings(student_id);
CREATE INDEX idx_bookings_tutor ON bookings(tutor_id);
CREATE INDEX idx_transactions_session ON transactions(gateway_session_id);

-- Auto-update updated_at timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tutors_modtime BEFORE UPDATE ON tutor_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_bookings_modtime BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- -------------------------------------------------------------
-- 5. CURRENCY SETTINGS (Admin-configurable exchange rates)
-- -------------------------------------------------------------
CREATE TABLE currency_settings (
    code VARCHAR(3) PRIMARY KEY,
    rate NUMERIC(12, 6) NOT NULL DEFAULT 1.0,
    symbol VARCHAR(10) NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_base BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_currency_settings_modtime BEFORE UPDATE ON currency_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();