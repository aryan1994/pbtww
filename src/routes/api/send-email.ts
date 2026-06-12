import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/send-email")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          // Dynamically import email functions to avoid loading Resend at boot time
          const {
            sendSignupConfirmation,
            sendOrderConfirmation,
            sendOrderStatusUpdate,
            sendNewMessageNotification,
            sendAdminNewOrderNotification,
          } = await import("@/lib/email.server");

          const body = (await request.json()) as {
            type: string;
            email?: string;
            name?: string;
            orderDetails?: {
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
            };
            customerName?: string;
            driverName?: string;
            totalAmount?: number;
          };

          if (!body.type) {
            return new Response(JSON.stringify({ error: "Missing type" }), { status: 400 });
          }

          let result;

          switch (body.type) {
            case "signup-confirmation":
              if (!body.email || !body.name) {
                return new Response(
                  JSON.stringify({ error: "Missing email or name" }),
                  { status: 400 }
                );
              }
              result = await sendSignupConfirmation(body.email, body.name);
              break;

            case "order-confirmation":
              if (!body.email || !body.orderDetails) {
                return new Response(
                  JSON.stringify({ error: "Missing email or orderDetails" }),
                  { status: 400 }
                );
              }
              result = await sendOrderConfirmation(body.email, body.orderDetails);
              break;

            case "order-status-update":
              if (!body.email || !body.orderDetails) {
                return new Response(
                  JSON.stringify({ error: "Missing email or orderDetails" }),
                  { status: 400 }
                );
              }
              result = await sendOrderStatusUpdate(body.email, body.orderDetails);
              break;

            case "new-message":
              if (!body.email || !body.customerName || !body.driverName) {
                return new Response(
                  JSON.stringify({ error: "Missing required fields" }),
                  { status: 400 }
                );
              }
              result = await sendNewMessageNotification(
                body.email,
                body.customerName,
                body.driverName
              );
              break;

            case "admin-new-order":
              if (!body.orderDetails?.orderCode || !body.orderDetails?.customerName || body.totalAmount === undefined) {
                return new Response(
                  JSON.stringify({ error: "Missing required fields" }),
                  { status: 400 }
                );
              }
              result = await sendAdminNewOrderNotification(
                body.orderDetails.orderCode,
                body.orderDetails.customerName,
                body.totalAmount
              );
              break;

            default:
              return new Response(JSON.stringify({ error: "Unknown email type" }), { status: 400 });
          }

          return new Response(
            JSON.stringify({ success: true, result }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (error) {
          console.error("Email API error:", error);
          return new Response(
            JSON.stringify({
              error: error instanceof Error ? error.message : "Failed to send email",
            }),
            { status: 500 }
          );
        }
      },
    },
  },
});
