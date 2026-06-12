-- Phase 1, 2, 4: Admin features, order management, invoicing, driver dashboard

-- 1. Admin user setup (skylooperr@gmail.com)
-- This should be done via Supabase Auth UI, but we'll create the role entry
INSERT INTO user_roles (user_id, role) 
SELECT auth.users.id, 'admin' 
FROM auth.users 
WHERE email = 'skylooperr@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Coupon codes table
CREATE TABLE IF NOT EXISTS coupon_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_percent DECIMAL(5,2) NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_coupon_codes_code ON coupon_codes(code);
CREATE INDEX idx_coupon_codes_active ON coupon_codes(active);

-- 3. Order messages (real-time chat)
CREATE TABLE IF NOT EXISTS order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  sender_type VARCHAR(20) CHECK (sender_type IN ('customer', 'driver')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_order_messages_order_id ON order_messages(order_id);
CREATE INDEX idx_order_messages_sender_id ON order_messages(sender_id);
CREATE INDEX idx_order_messages_created_at ON order_messages(created_at DESC);
CREATE INDEX idx_order_messages_is_read ON order_messages(is_read);

-- 4. Driver location tracking
CREATE TABLE IF NOT EXISTS driver_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_driver_locations_driver_id ON driver_locations(driver_id);
CREATE INDEX idx_driver_locations_order_id ON driver_locations(order_id);
CREATE INDEX idx_driver_locations_created_at ON driver_locations(created_at DESC);

-- 5. Notification logs (for tracking sent emails/messages)
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  order_id UUID REFERENCES orders(id),
  notification_type VARCHAR(50) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_order_id ON notification_logs(order_id);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_logs_created_at ON notification_logs(created_at DESC);

-- 6. Driver earnings (more detailed than current)
-- This might already exist, but we ensure it has all needed fields
ALTER TABLE driver_earnings ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id);
ALTER TABLE driver_earnings ADD COLUMN IF NOT EXISTS incentive_bonus DECIMAL(10,2) DEFAULT 0;

-- 7. RLS Policies for new tables

-- Coupon codes: Only admins can create, anyone can read active codes
ALTER TABLE coupon_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_can_create_coupons" ON coupon_codes
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "anyone_can_read_active_coupons" ON coupon_codes
  FOR SELECT TO authenticated
  USING (active = true);

CREATE POLICY "admins_can_update_coupons" ON coupon_codes
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Order messages: Customers and drivers can read their order messages
ALTER TABLE order_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_read_own_order_messages" ON order_messages
  FOR SELECT TO authenticated
  USING (
    sender_id = auth.uid() OR
    order_id IN (
      SELECT id FROM orders WHERE customer_id = auth.uid() OR driver_id = auth.uid()
    )
  );

CREATE POLICY "users_can_insert_order_messages" ON order_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "users_can_update_own_messages" ON order_messages
  FOR UPDATE TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Driver locations: Driver can insert own, admin and assigned customer can read
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drivers_can_insert_own_location" ON driver_locations
  FOR INSERT TO authenticated
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "users_can_read_assigned_driver_location" ON driver_locations
  FOR SELECT TO authenticated
  USING (
    driver_id = auth.uid() OR
    order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid() OR driver_id = auth.uid())
  );

-- Notification logs: Users can read their own, admins can read all
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_read_own_notifications" ON notification_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 8. Update orders table to include coupon reference if not exists
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupon_codes(id);

-- 9. Function to get driver statistics
CREATE OR REPLACE FUNCTION get_driver_stats(driver_id_param UUID)
RETURNS TABLE(
  total_deliveries BIGINT,
  total_earnings DECIMAL,
  hours_online DECIMAL,
  current_status VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM orders WHERE driver_id = driver_id_param AND status = 'delivered'),
    COALESCE((SELECT SUM(amount) FROM driver_earnings WHERE driver_id = driver_id_param), 0),
    COALESCE(
      (SELECT 
        EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) / 3600
        FROM driver_locations 
        WHERE driver_id = driver_id_param AND created_at > NOW() - INTERVAL '7 days'
      ), 0
    ),
    (SELECT status FROM drivers WHERE user_id = driver_id_param LIMIT 1)::VARCHAR;
END;
$$ LANGUAGE plpgsql;

-- 10. Function to find nearest drivers
CREATE OR REPLACE FUNCTION find_nearest_drivers(
  order_lat DECIMAL,
  order_lng DECIMAL,
  radius_km DECIMAL DEFAULT 15
)
RETURNS TABLE(
  driver_id UUID,
  driver_name VARCHAR,
  vehicle_no VARCHAR,
  distance_km DECIMAL,
  latitude DECIMAL,
  longitude DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.user_id,
    d.name,
    d.vehicle_no,
    ROUND(
      (6371 * 2 * ASIN(SQRT(
        POWER(SIN((order_lat - dl.latitude) * PI() / 180 / 2), 2) +
        COS(dl.latitude * PI() / 180) * COS(order_lat * PI() / 180) *
        POWER(SIN((order_lng - dl.longitude) * PI() / 180 / 2), 2)
      )))::NUMERIC, 2
    ),
    dl.latitude,
    dl.longitude
  FROM drivers d
  LEFT JOIN driver_locations dl ON d.user_id = dl.driver_id
  WHERE d.status = 'active' AND d.verified = true
  AND dl.created_at > NOW() - INTERVAL '10 minutes'
  ORDER BY
    ASIN(SQRT(
      POWER(SIN((order_lat - dl.latitude) * PI() / 180 / 2), 2) +
      COS(dl.latitude * PI() / 180) * COS(order_lat * PI() / 180) *
      POWER(SIN((order_lng - dl.longitude) * PI() / 180 / 2), 2)
    )) ASC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;
