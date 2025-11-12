-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role TEXT CHECK (role IN ('driver','admin','mechanic')) NOT NULL,
    name TEXT NOT NULL,
    phone TEXT UNIQUE,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vehicles table
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fleet_code TEXT UNIQUE NOT NULL,
    registration TEXT UNIQUE NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER,
    vin TEXT UNIQUE,
    engine_number TEXT,
    fuel_type TEXT CHECK (fuel_type IN ('petrol','diesel','electric','hybrid')),
    capacity INTEGER, -- passenger capacity
    department TEXT,
    status TEXT CHECK (status IN ('active','maintenance','retired','out_of_service')) DEFAULT 'active',
    last_service_date DATE,
    next_service_due DATE,
    insurance_expiry DATE,
    roadworthy_expiry DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Form schemas table (for dynamic inspection forms)
CREATE TABLE form_schemas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    description TEXT,
    json_schema JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(name, version)
);

-- Inspections table
CREATE TABLE inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schema_id UUID REFERENCES form_schemas(id),
    schema_version TEXT NOT NULL,
    driver_id UUID REFERENCES users(id) NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
    inspection_type TEXT DEFAULT 'pre-trip',
    shift_type TEXT CHECK (shift_type IN ('morning','afternoon','evening','night')),
    route_name TEXT,
    destination TEXT,
    odometer NUMERIC,
    fuel_level NUMERIC CHECK (fuel_level >= 0 AND fuel_level <= 100),
    location GEOGRAPHY(Point,4326),
    location_name TEXT,
    weather_conditions TEXT,
    temperature NUMERIC,
    started_at TIMESTAMPTZ NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT now(),
    duration_minutes INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (submitted_at - started_at)) / 60
    ) STORED,
    overall_status TEXT CHECK (overall_status IN ('PASS','FAIL','NEEDS_ATTENTION')) NOT NULL,
    signature_url TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inspection items table (stores individual checklist responses)
CREATE TABLE inspection_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE NOT NULL,
    section TEXT NOT NULL,
    item_key TEXT NOT NULL,
    item_label TEXT NOT NULL,
    status TEXT CHECK (status IN ('OK','NOT_OK','NA')) NOT NULL,
    comment TEXT,
    photo_url TEXT,
    priority TEXT CHECK (priority IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    requires_immediate_attention BOOLEAN DEFAULT false,
    sort_order INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    INDEX(inspection_id, section),
    INDEX(status),
    INDEX(priority)
);

-- Defects table (workflow for NOT_OK items)
CREATE TABLE defects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_item_id UUID REFERENCES inspection_items(id) ON DELETE CASCADE NOT NULL,
    defect_code TEXT, -- standardized defect codes
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')) NOT NULL,
    state TEXT CHECK (state IN ('OPEN','IN_PROGRESS','RESOLVED','CLOSED')) DEFAULT 'OPEN',
    category TEXT, -- electrical, mechanical, safety, etc.
    estimated_cost NUMERIC,
    actual_cost NUMERIC,
    estimated_time_hours NUMERIC,
    actual_time_hours NUMERIC,
    assigned_to UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    resolution_notes TEXT,
    parts_required JSONB DEFAULT '[]',
    work_order_number TEXT,
    vendor_contact TEXT,
    vehicle_out_of_service BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Audit log table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT CHECK (action IN ('INSERT','UPDATE','DELETE')) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMPTZ DEFAULT now(),
    ip_address INET,
    user_agent TEXT
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID REFERENCES users(id) NOT NULL,
    type TEXT NOT NULL, -- email, sms, push, whatsapp
    channel TEXT NOT NULL, -- critical_defect, inspection_overdue, etc.
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending','sent','failed','delivered')) DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);

CREATE INDEX idx_vehicles_fleet_code ON vehicles(fleet_code);
CREATE INDEX idx_vehicles_registration ON vehicles(registration);
CREATE INDEX idx_vehicles_status ON vehicles(status);

CREATE INDEX idx_inspections_driver_id ON inspections(driver_id);
CREATE INDEX idx_inspections_vehicle_id ON inspections(vehicle_id);
CREATE INDEX idx_inspections_submitted_at ON inspections(submitted_at DESC);
CREATE INDEX idx_inspections_overall_status ON inspections(overall_status);
CREATE INDEX idx_inspections_location ON inspections USING GIST(location);

CREATE INDEX idx_inspection_items_inspection_id ON inspection_items(inspection_id);
CREATE INDEX idx_inspection_items_status ON inspection_items(status);
CREATE INDEX idx_inspection_items_section ON inspection_items(section);

CREATE INDEX idx_defects_state ON defects(state);
CREATE INDEX idx_defects_severity ON defects(severity);
CREATE INDEX idx_defects_assigned_to ON defects(assigned_to);
CREATE INDEX idx_defects_created_at ON defects(created_at DESC);

CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_schemas_updated_at BEFORE UPDATE ON form_schemas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON inspections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_defects_updated_at BEFORE UPDATE ON defects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();