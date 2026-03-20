import { Resend } from "resend";
import type { Order } from "@/types";
import { formatPrice } from "./utils";

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderConfirmationEmail(order: Order): Promise<void> {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #1A2540;">${item.product.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #1A2540; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #1A2540; text-align: right;">${formatPrice(item.price * item.quantity)}</td>
      </tr>
    `
    )
    .join("");

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "noreply@chasethepulls.com",
    to: order.email,
    subject: `Order Confirmed! #${order.id.slice(-8).toUpperCase()} - Chase The Pulls`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #080C14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="font-size: 32px; font-weight: 900; color: #FFD700; margin: 0; letter-spacing: 2px;">
                CHASE THE PULLS
              </h1>
              <p style="color: #8898AA; margin: 8px 0 0;">Your Order is Confirmed!</p>
            </div>

            <!-- Order Card -->
            <div style="background: #0E1520; border: 1px solid #1A2540; border-radius: 16px; padding: 32px; margin-bottom: 24px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <div>
                  <p style="color: #8898AA; margin: 0; font-size: 14px;">Order Number</p>
                  <p style="color: #FFD700; font-size: 20px; font-weight: 700; margin: 4px 0 0;">
                    #${order.id.slice(-8).toUpperCase()}
                  </p>
                </div>
                <div style="text-align: right;">
                  <p style="color: #8898AA; margin: 0; font-size: 14px;">Status</p>
                  <span style="background: rgba(16, 185, 129, 0.2); color: #10B981; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600;">
                    Confirmed
                  </span>
                </div>
              </div>

              <!-- Items Table -->
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr>
                    <th style="padding: 12px; text-align: left; color: #8898AA; font-weight: 500; font-size: 14px; border-bottom: 1px solid #1A2540;">Item</th>
                    <th style="padding: 12px; text-align: center; color: #8898AA; font-weight: 500; font-size: 14px; border-bottom: 1px solid #1A2540;">Qty</th>
                    <th style="padding: 12px; text-align: right; color: #8898AA; font-weight: 500; font-size: 14px; border-bottom: 1px solid #1A2540;">Total</th>
                  </tr>
                </thead>
                <tbody style="color: #F0F4FF;">
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Totals -->
              <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #1A2540;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #8898AA;">Subtotal</span>
                  <span style="color: #F0F4FF;">${formatPrice(order.subtotal)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #8898AA;">Shipping</span>
                  <span style="color: #F0F4FF;">${order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #8898AA;">Tax</span>
                  <span style="color: #F0F4FF;">${formatPrice(order.tax)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 1px solid #1A2540; margin-top: 12px;">
                  <span style="color: #FFD700; font-weight: 700; font-size: 18px;">Total</span>
                  <span style="color: #FFD700; font-weight: 700; font-size: 18px;">${formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div style="text-align: center; color: #8898AA; font-size: 14px;">
              <p>We'll send another email when your order ships.</p>
              <p>Questions? Email us at <a href="mailto:support@chasethepulls.com" style="color: #FFD700;">support@chasethepulls.com</a></p>
              <p style="margin-top: 24px; font-size: 12px;">© ${new Date().getFullYear()} Chase The Pulls. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendOrderShippedEmail(
  order: Order,
  trackingNumber: string
): Promise<void> {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "noreply@chasethepulls.com",
    to: order.email,
    subject: `Your Order Has Shipped! #${order.id.slice(-8).toUpperCase()} - Chase The Pulls`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #080C14; font-family: sans-serif;">
        <h1 style="color: #FFD700; text-align: center;">Your Order is On Its Way!</h1>
        <div style="background: #0E1520; border: 1px solid #1A2540; border-radius: 16px; padding: 32px; text-align: center;">
          <p style="color: #8898AA;">Order #${order.id.slice(-8).toUpperCase()}</p>
          <p style="color: #F0F4FF;">Tracking Number: <strong style="color: #FFD700;">${trackingNumber}</strong></p>
        </div>
      </div>
    `,
  });
}
