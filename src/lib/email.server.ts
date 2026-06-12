import { Resend } from "resend";

const FROM_EMAIL = "noreply@pbtw.in"; // Update this to your domain
const ADMIN_EMAIL = "skylooperr@gmail.com";

// Lazy initialize Resend client
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY || "re_dev_mode";
  return new Resend(apiKey);
}

interface OrderDetails {
  orderCode: string;
  customerName: string;
  driverName?: string;
  driverPhone?: string;
  waterType: string;
  size: number;
  totalAmount: number;
  deliveryDate: string;
  deliverySlot: string;
  address: string;
  orderStatus?: string;
}

export async function sendSignupConfirmation(email: string, name: string) {
  try {
    const resend = getResendClient();
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Welcome to PAPPU BHAI TANKER WALE (PBTW)",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0A3D62 0%, #1B5E8A 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0; font-size: 28px;">Welcome to PBTW!</h2>
          </div>
          <div style="padding: 30px; border: 1px solid #ddd; border-top: none;">
            <p>Hi ${name},</p>
            <p>Welcome to PAPPU BHAI TANKER WALE (PBTW)! Your account has been successfully created.</p>
            <p>You can now:</p>
            <ul>
              <li>Book water tankers with just a few taps</li>
              <li>Track your orders in real-time</li>
              <li>Save money with our 15% wallet discount</li>
              <li>Download GST invoices automatically</li>
            </ul>
            <p style="margin-top: 30px;">
              <a href="https://pbtw.in" style="background: #0A3D62; color: white; padding: 12px 24px; border-radius: 5px; text-decoration: none; display: inline-block;">
                Get Started
              </a>
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              Questions? Contact us at 9214775938 or reply to this email.
            </p>
          </div>
        </div>
      `,
    });
    return result;
  } catch (error) {
    console.error("Error sending signup confirmation:", error);
    throw error;
  }
}

export async function sendOrderConfirmation(email: string, details: OrderDetails) {
  try {
    const resend = getResendClient();
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Order Confirmed: ${details.orderCode} - PBTW`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0A3D62 0%, #1B5E8A 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0; font-size: 28px;">Order Confirmed ✓</h2>
          </div>
          <div style="padding: 30px; border: 1px solid #ddd; border-top: none;">
            <p>Hi ${details.customerName},</p>
            <p>Your water tanker order has been confirmed!</p>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0 0 15px 0;"><strong>Order Details</strong></p>
              <table style="width: 100%; font-size: 14px;">
                <tr><td style="padding: 5px 0;"><strong>Order Code:</strong></td><td>${details.orderCode}</td></tr>
                <tr><td style="padding: 5px 0;"><strong>Water Type:</strong></td><td>${details.waterType}</td></tr>
                <tr><td style="padding: 5px 0;"><strong>Tank Size:</strong></td><td>${details.size} Liters</td></tr>
                <tr><td style="padding: 5px 0;"><strong>Total Amount:</strong></td><td style="color: #0A3D62; font-weight: bold;">₹${details.totalAmount}</td></tr>
                <tr><td style="padding: 5px 0;"><strong>Delivery Date:</strong></td><td>${details.deliveryDate} · ${details.deliverySlot}</td></tr>
                <tr><td style="padding: 5px 0;"><strong>Delivery Address:</strong></td><td>${details.address}</td></tr>
              </table>
            </div>
            
            <p>Your order will be delivered by our verified driver. You'll receive a message with driver details soon!</p>
            
            <p style="margin-top: 30px;">
              <a href="https://pbtw.in/dashboard" style="background: #0A3D62; color: white; padding: 12px 24px; border-radius: 5px; text-decoration: none; display: inline-block;">
                Track Order
              </a>
            </p>
            
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              Questions? Contact us at 9214775938 or reply to this email.
            </p>
          </div>
        </div>
      `,
    });
    return result;
  } catch (error) {
    console.error("Error sending order confirmation:", error);
    throw error;
  }
}

export async function sendOrderStatusUpdate(email: string, details: OrderDetails) {
  try {
    const resend = getResendClient();
    const statusMessages: Record<string, string> = {
      confirmed: "Your order has been confirmed by our team.",
      assigned: "Your order has been assigned to a driver.",
      on_the_way: "Your tanker is on the way to your location!",
      reached: "The tanker has reached your location.",
      delivered: "Your order has been successfully delivered. Thank you!",
      cancelled: "Your order has been cancelled.",
    };

    const statusMessage = statusMessages[details.orderStatus || ""] || "Your order status has been updated.";

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Order Update: ${details.orderCode} - ${details.orderStatus?.toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0A3D62 0%, #1B5E8A 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0; font-size: 28px;">Order Update</h2>
          </div>
          <div style="padding: 30px; border: 1px solid #ddd; border-top: none;">
            <p>Hi ${details.customerName},</p>
            <p>${statusMessage}</p>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Order: ${details.orderCode}</strong></p>
              <p style="margin: 0; color: #0A3D62; font-weight: bold; font-size: 16px;">${details.orderStatus?.toUpperCase()}</p>
            </div>
            
            ${
              details.driverName
                ? `
              <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0;"><strong>Driver Details</strong></p>
                <p style="margin: 5px 0;"><strong>Name:</strong> ${details.driverName}</p>
                <p style="margin: 5px 0;"><strong>Phone:</strong> <a href="tel:${details.driverPhone}">${details.driverPhone}</a></p>
              </div>
            `
                : ""
            }
            
            <p style="margin-top: 30px;">
              <a href="https://pbtw.in/dashboard" style="background: #0A3D62; color: white; padding: 12px 24px; border-radius: 5px; text-decoration: none; display: inline-block;">
                View Order
              </a>
            </p>
            
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              Questions? Contact us at 9214775938 or reply to this email.
            </p>
          </div>
        </div>
      `,
    });
    return result;
  } catch (error) {
    console.error("Error sending order status update:", error);
    throw error;
  }
}

export async function sendNewMessageNotification(email: string, customerName: string, driverName: string) {
  try {
    const resend = getResendClient();
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `New Message from ${driverName} - PBTW`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0A3D62 0%, #1B5E8A 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0; font-size: 28px;">New Message</h2>
          </div>
          <div style="padding: 30px; border: 1px solid #ddd; border-top: none;">
            <p>Hi ${customerName},</p>
            <p>You have received a new message from your assigned driver, <strong>${driverName}</strong>.</p>
            
            <p style="margin-top: 30px;">
              <a href="https://pbtw.in/dashboard" style="background: #0A3D62; color: white; padding: 12px 24px; border-radius: 5px; text-decoration: none; display: inline-block;">
                View Message
              </a>
            </p>
            
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              Questions? Contact us at 9214775938 or reply to this email.
            </p>
          </div>
        </div>
      `,
    });
    return result;
  } catch (error) {
    console.error("Error sending message notification:", error);
    throw error;
  }
}

export async function sendAdminNewOrderNotification(orderCode: string, customerName: string, totalAmount: number) {
  try {
    const resend = getResendClient();
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `🚨 New Order: ${orderCode} - ₹${totalAmount}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ff6b00 0%, #ff8500 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0; font-size: 28px;">🔔 New Order Alert</h2>
          </div>
          <div style="padding: 30px; border: 1px solid #ddd; border-top: none;">
            <p>A new order has been placed!</p>
            
            <div style="background: #fff3cd; padding: 20px; border-left: 4px solid #ff6b00; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Order: ${orderCode}</strong></p>
              <p style="margin: 5px 0;"><strong>Customer:</strong> ${customerName}</p>
              <p style="margin: 5px 0;"><strong>Amount:</strong> ₹${totalAmount}</p>
            </div>
            
            <p>Go to the admin dashboard to view details and assign a driver.</p>
            
            <p style="margin-top: 30px;">
              <a href="https://pbtw.in/admin/orders" style="background: #ff6b00; color: white; padding: 12px 24px; border-radius: 5px; text-decoration: none; display: inline-block;">
                View in Admin
              </a>
            </p>
          </div>
        </div>
      `,
    });
    return result;
  } catch (error) {
    console.error("Error sending admin notification:", error);
    throw error;
  }
}

export async function logNotification(
  userId: string,
  recipientEmail: string,
  notificationType: string,
  subject: string,
  orderId?: string,
  status: "sent" | "failed" = "sent",
  errorMessage?: string
) {
  // This function is for logging - it will be called from the server side
  // In a real app, this would save to the database
  console.log("Notification sent:", {
    userId,
    recipientEmail,
    notificationType,
    subject,
    orderId,
    status,
    errorMessage,
  });
}
