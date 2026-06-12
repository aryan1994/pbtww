# PBTW Setup Guide - Phase 1, 2, 4

## Quick Start

### 1. Environment Setup

Create a `.env.local` file in the project root:

```env
# Resend Email API
RESEND_API_KEY=your_resend_api_key_here

# Supabase (should already be set)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Lovable Auth
LOVABLE_API_KEY=your_lovable_api_key
```

**Note on Development Mode:** The app will work without Supabase and Resend API keys during development with graceful fallbacks:
- Missing Supabase credentials will log warnings but allow the app to load with stub auth
- Missing Resend API key will use a development mode that prevents errors on import
- Features requiring these services (auth, email, database) will show warnings when accessed

### 2. Database Setup

Apply the migration to your Supabase project:

```bash
# Option 1: Via Supabase CLI
supabase migration up

# Option 2: Manual - Copy-paste migration SQL into Supabase SQL Editor
# File: supabase/migrations/20260609_110000_phase_features.sql
```

### 3. Create Admin User

In Supabase Auth, create a new user:
- Email: `skylooperr@gmail.com`
- Password: `admin@123`

Then manually insert the admin role:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ((SELECT id FROM auth.users WHERE email = 'skylooperr@gmail.com'), 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

### 4. Install Dependencies

```bash
npm install resend
# or
yarn add resend
# or
pnpm add resend
```

### 5. Start Development Server

```bash
npm run dev
# Visit http://localhost:5173
```

---

## Feature Walkthrough

### Admin Panel Access

1. Go to `/auth` and sign up with your admin account (skylooperr@gmail.com)
2. Navigate to `/admin/orders` to see order management
3. Navigate to `/admin/coupons` to create discount codes
4. Navigate to `/admin/drivers` to review driver applications
5. Navigate to `/admin/recharges` to approve wallet recharges

### Driver Portal

1. Visit `/driver-auth`
2. Click "Apply now" for new drivers
3. Fill in:
   - Full name
   - Mobile number (10 digits)
   - Vehicle number (e.g., RJ14XX0000)
   - Email
   - Password (minimum 6 characters)
4. Submit application
5. Admin reviews and approves in `/admin/drivers`
6. Driver logs in and sees `/driver` dashboard

### Customer Features

1. Existing customer auth at `/auth`
2. Dashboard at `/dashboard` with:
   - Active orders and live tracking
   - Invoice display
   - Wallet balance
   - Offers and promotions

---

## Testing Workflows

### Test 1: Admin Order Notification

1. Sign in as admin
2. Open `/admin/orders` in one tab
3. In another window/device, create a test order at `/book`
4. Watch notification popup appear in admin panel
5. Click "Assign Driver" to assign a driver
6. Driver receives order in their dashboard

### Test 2: Coupon Creation

1. Sign in as admin
2. Go to `/admin/coupons`
3. Click "New Coupon"
4. Create coupon:
   - Code: `SUMMER20`
   - Discount: `20%`
   - Max Uses: `100` (optional)
5. Click "Create Coupon"
6. See coupon in list with usage tracking

### Test 3: Email Notifications

1. Sign up as new customer at `/auth`
2. Check email for welcome message
3. Place an order at `/book`
4. Check email for order confirmation
5. As admin, update order status
6. Customer receives status update email

### Test 4: Driver Dashboard

1. Create driver account at `/driver-auth`
2. Go to admin `/admin/drivers`
3. Approve the driver application
4. Driver logs in at `/driver`
5. Verify stats display:
   - Today's earnings: ₹0 (no deliveries yet)
   - Last 7 days earnings: ₹0
   - Hours online: (time since login)
   - Active orders: (assigned orders)

---

## File Reference

### Pages
| Route | Description | Access |
|-------|-------------|--------|
| `/auth` | Customer signup/login | Public |
| `/driver-auth` | Driver signup/login | Public |
| `/dashboard` | Customer dashboard | Authenticated users |
| `/driver` | Driver dashboard | Drivers only |
| `/admin/orders` | Order management | Admins only |
| `/admin/coupons` | Coupon management | Admins only |
| `/admin/drivers` | Driver applications | Admins only |
| `/admin/recharges` | Wallet recharge approvals | Admins only |

### Backend Files
| File | Purpose |
|------|---------|
| `src/lib/email.server.ts` | Email templates and sending logic |
| `src/routes/api/send-email.ts` | Email API endpoint |
| `supabase/migrations/20260609_110000_phase_features.sql` | Database schema |

### Component Files
| File | Purpose |
|------|---------|
| `src/routes/driver-auth.tsx` | Driver login page |
| `src/routes/_authenticated/admin.orders.tsx` | Order management UI |
| `src/routes/_authenticated/admin.coupons.tsx` | Coupon management UI |
| `src/routes/_authenticated/driver.tsx` | Enhanced driver dashboard |

---

## Troubleshooting

### Email Not Sending

**Problem:** Emails don't arrive
**Solution:**
1. Check `RESEND_API_KEY` is valid in environment
2. Verify email address is correct
3. Check Resend dashboard for delivery logs
4. Verify email domain is configured in Resend

### Admin Can't See Orders

**Problem:** `/admin/orders` shows "Admin access required"
**Solution:**
1. Verify user has `admin` role in `user_roles` table:
   ```sql
   SELECT * FROM user_roles WHERE user_id = 'YOUR_USER_ID';
   ```
2. If missing, insert:
   ```sql
   INSERT INTO user_roles (user_id, role) VALUES ('YOUR_USER_ID', 'admin');
   ```

### Driver Application Not Submitted

**Problem:** Driver signup doesn't create application
**Solution:**
1. Check `driver_applications` table for entries
2. Check browser console for errors
3. Verify user exists in `auth.users`
4. May need to trigger migration

### Coupons Not Appearing

**Problem:** Created coupons don't show in list
**Solution:**
1. Ensure `coupon_codes` table exists:
   ```sql
   SELECT * FROM coupon_codes;
   ```
2. Check RLS policies are enabled:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'coupon_codes';
   ```
3. Verify current user has admin role

---

## Customization

### Change Admin Email
1. In Supabase, create/update user to different email
2. Run SQL to grant admin role to that user:
   ```sql
   INSERT INTO user_roles (user_id, role)
   VALUES ((SELECT id FROM auth.users WHERE email = 'newemail@example.com'), 'admin');
   ```

### Change Email Sender
Edit `src/lib/email.server.ts`:
```typescript
const FROM_EMAIL = "your-email@yourdomain.com"; // Change this
```

### Update Email Templates
Each email type has a template in `src/lib/email.server.ts`:
- `sendSignupConfirmation()`
- `sendOrderConfirmation()`
- `sendOrderStatusUpdate()`
- `sendNewMessageNotification()`
- `sendAdminNewOrderNotification()`

Edit the HTML in the template string to customize.

### Adjust Notification Polling
In `src/routes/_authenticated/admin.orders.tsx`:
```typescript
// Change this line to adjust polling interval (in milliseconds)
const interval = setInterval(() => load(), 10000); // 10 seconds
```

---

## Monitoring

### Check Recent Orders
```sql
SELECT id, order_code, customer_name, status, created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;
```

### Check Coupon Usage
```sql
SELECT code, discount_percent, current_uses, max_uses,
  ROUND((current_uses::numeric / NULLIF(max_uses, 0)) * 100, 2) AS usage_percent
FROM coupon_codes
WHERE active = true
ORDER BY created_at DESC;
```

### Check Email Logs
```sql
SELECT notification_type, status, COUNT(*) as count, MAX(created_at)
FROM notification_logs
GROUP BY notification_type, status
ORDER BY MAX(created_at) DESC;
```

### Check Driver Stats
```sql
SELECT name, total_deliveries, total_earnings, status
FROM drivers
ORDER BY total_deliveries DESC;
```

---

## Performance Tips

1. **Real-time Updates:** WebSocket subscriptions are active but polling happens every 10s. For high-traffic environments, consider reducing interval.

2. **Email Delivery:** Resend handles async delivery. For bulk operations, consider rate limiting.

3. **Location Tracking:** `driver_locations` table grows quickly. Archive old records periodically:
   ```sql
   DELETE FROM driver_locations 
   WHERE created_at < NOW() - INTERVAL '30 days';
   ```

4. **Notification Logs:** Similarly, clean up old notification logs for storage efficiency.

---

## Next Steps

For Phase 3 (Real-Time Features):

1. **Implement Live Chat:**
   - Use WebSocket for real-time messages
   - UI component for message interface
   - Email notifications when messages received

2. **Implement Location Tracking:**
   - Location update API endpoint
   - Map component for live driver tracking
   - Use `find_nearest_drivers()` function for assignment

3. **Smart Driver Assignment:**
   - API to find nearest drivers
   - Driver acceptance/decline system
   - Incentive tracking (₹5 for declining)

---

## Support

For issues or questions:
1. Check logs in browser console
2. Check Supabase logs in dashboard
3. Check email delivery in Resend dashboard
4. Review implementation summary: `IMPLEMENTATION_SUMMARY.md`

---

**Last Updated:** June 9, 2026
**Version:** Phase 1, 2, 4 Complete
