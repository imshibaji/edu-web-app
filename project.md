Here is a production-ready **PostgreSQL database architecture** tailored for your 7-day **LeafPHP** build.

> **Note:** The live schema is now `app/database/*.yml` (Leaf Schema, applied by `php leaf app:init`), with `app/database/schema.sqlite.sql`/root `schema.sql` removed. This section remains as the original design reference.

To keep you on track for the 1-week timeline while ensuring structural integrity for money handling, this schema implements a clean relational structure: **Identity & Profiles**, **Availability & Bookings**, and **Payments & Escrow Audit Logs**.

---

## 1. Complete Entity-Relationship (ER) Schema

```
   ┌─────────────────────────────────────────────────────────────┐
   │                          users                              │
   │  (id, email, password_hash, role: STUDENT|TUTOR|ADMIN)       │
   └──────────────┬──────────────────────────────┬───────────────┘
                  │ 1                            │ 1
                  │                              │
                  ▼ 1                            ▼ 1
   ┌─────────────────────────────┐┌──────────────────────────────┐
   │       student_profiles      ││        tutor_profiles        │
   │  (user_id, full_name, phone)││ (user_id, bio, hourly_rate)  │
   └─────────────────────────────┘└──────────────┬───────────────┘
                                                 │ 1
                                                 │
                                                 ▼ N
                                  ┌──────────────────────────────┐
                                  │      availability_slots      │
                                  │ (id, tutor_id, start/end)    │
                                  └──────────────┬───────────────┘
                                                 │ 1
                                                 │
                                                 ▼ 0..1
                                  ┌──────────────────────────────┐
                                  │           bookings           │
                                  │ (id, student_id, slot_id)    │
                                  └──────────────┬───────────────┘
                                                 │ 1
                                                 │
                                                 ▼ 1..N
                                  ┌──────────────────────────────┐
                                  │         transactions         │
                                  │ (id, booking_id, amount)     │
                                  └──────────────────────────────┘

```

---

## 2. SQL DDL Migration Script (`schema.sql`)

Copy and execute this script directly into PostgreSQL. It includes table structures, strict dynamic constraints, `UUID` default generation, indexes for instant search filtering, and timestamp triggers.

```sql
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

```

---

## 3. LeafPHP Eloquent Model Setup

Using Leaf's native `leafs/eloquent` package (`composer require leafs/eloquent`), set up these relationship models to cleanly query your database in controllers.

#### A. User Model (`app/models/User.php`)

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model {
    protected $table = 'users';
    protected $keyType = 'string';
    public $incrementing = false;
    protected $hidden = ['password_hash'];

    public function tutorProfile() {
        return $this->hasOne(TutorProfile::class, 'user_id');
    }

    public function studentProfile() {
        return $this->hasOne(StudentProfile::class, 'user_id');
    }

    public function bookings() {
        return $this->hasMany(Booking::class, 'student_id');
    }
}

```

#### B. AvailabilitySlot Model (`app/models/AvailabilitySlot.php`)

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AvailabilitySlot extends Model {
    protected $table = 'availability_slots';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = ['id', 'tutor_id', 'start_time', 'end_time', 'is_booked'];

    public function booking() {
        return $this->hasOne(Booking::class, 'slot_id');
    }
}

```

#### C. Booking Model (`app/models/Booking.php`)

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model {
    protected $table = 'bookings';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['id', 'student_id', 'tutor_id', 'slot_id', 'amount_charged', 'status', 'meeting_link'];

    public function slot() {
        return $this->belongsTo(AvailabilitySlot::class, 'slot_id');
    }

    public function transactions() {
        return $this->hasMany(Transaction::class, 'booking_id');
    }
}

```

---

## 4. Query Workflow for Day 3-5 Development

Here is how your LeafPHP routes will interact with this database during the main user journey:

```
[Student selects slot]
      │
      ▼
Leaf Controller fetches slot + checks `is_booked == false`
      │
      ▼
Create `bookings` record (status = 'PENDING_PAYMENT')
Create `transactions` record (status = 'PENDING', gateway_session_id = Stripe ID)
      │
      ▼
[Stripe Webhook fires on payment success]
      │
      ▼
DB Transaction Scope:
  1. UPDATE bookings SET status = 'CONFIRMED', meeting_link = 'https://jitsi.member/...'
  2. UPDATE availability_slots SET is_booked = true
  3. UPDATE transactions SET status = 'SUCCESS'

```

---