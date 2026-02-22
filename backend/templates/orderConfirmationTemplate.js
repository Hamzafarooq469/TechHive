const generateOrderConfirmationEmail = ({ userName, orderNumber, trackingNumber, orderDate, orderItems, couponCode, cashbackAmount, totalAmount, shipping }) => {
  const orderItemsList = orderItems.map(item => 
    `<tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: 500;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>`
  ).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">🎉 Order Confirmed!</h1>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; color: #333;">Hi <strong>${userName}</strong>,</p>
        <p style="color: #666;">Thank you for your order! We're excited to let you know that your order has been successfully placed.</p>
        
        <div style="background-color: white; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h2 style="color: #007bff; margin-top: 0;">Order Details</h2>
          <p style="margin: 5px 0;"><strong>Order Number:</strong> #${orderNumber}</p>
          <p style="margin: 5px 0;"><strong>Tracking Number:</strong> ${trackingNumber}</p>
          <p style="margin: 5px 0;"><strong>Order Date:</strong> ${orderDate}</p>
        </div>

        <h3 style="color: #333; margin-top: 25px;">Order Items:</h3>
        <table style="width: 100%; background-color: white; border-collapse: collapse; border-radius: 6px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 12px 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Item</th>
              <th style="padding: 12px 10px; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
              <th style="padding: 12px 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Price</th>
              <th style="padding: 12px 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${orderItemsList}
          </tbody>
        </table>

        <div style="background-color: white; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: right;">
          ${couponCode ? `<p style="margin: 5px 0; color: #28a745;"><strong>Coupon Applied:</strong> ${couponCode}</p>` : ''}
          ${cashbackAmount > 0 ? `<p style="margin: 5px 0; color: #28a745;"><strong>Cashback:</strong> $${cashbackAmount.toFixed(2)}</p>` : ''}
          <p style="margin: 5px 0; font-size: 18px; color: #007bff;"><strong>Total Amount:</strong> $${totalAmount.toFixed(2)}</p>
        </div>

        <div style="background-color: white; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Shipping Address:</h3>
          <p style="margin: 5px 0; color: #666;">${shipping.name}</p>
          <p style="margin: 5px 0; color: #666;">${shipping.address}</p>
          <p style="margin: 5px 0; color: #666;">${shipping.city}, ${shipping.postalCode}</p>
          <p style="margin: 5px 0; color: #666;">Phone: ${shipping.phone}</p>
        </div>

        <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;">📦 <strong>What's Next?</strong></p>
          <p style="margin: 10px 0 0 0; color: #856404;">We'll send you another email once your order ships with tracking details.</p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="color: #666; font-size: 14px;">Thank you for shopping with TechHive!</p>
          <p style="color: #999; font-size: 12px; margin-top: 10px;">If you have any questions, please don't hesitate to contact us.</p>
          <p style="color: #999; font-size: 12px; margin-top: 10px;"> Customer Support: support@techhive.com, UAN: 111-01010101, Whatsapp: 0300-5860101</p>
        </div>
      </div>
    </div>
  `;

  const text = `
Order Confirmed!

Hi ${userName},

Thank you for your order! Your order has been successfully placed.

Order Details:
Order Number: #${orderNumber}
Tracking Number: ${trackingNumber}
Order Date: ${orderDate}

Order Items:
${orderItems.map(item => `${item.name} - Qty: ${item.quantity} - $${item.price.toFixed(2)} each = $${(item.price * item.quantity).toFixed(2)}`).join('\n')}

${couponCode ? `Coupon Applied: ${couponCode}\n` : ''}${cashbackAmount > 0 ? `Cashback: $${cashbackAmount.toFixed(2)}\n` : ''}Total Amount: $${totalAmount.toFixed(2)}

Shipping Address:
${shipping.address}
${shipping.city}, ${shipping.postalCode}
Phone: ${shipping.phone}

We'll send you another email once your order ships with tracking details.

Thank you for shopping with TechHive!
  `;

  return { html, text };
};

module.exports = generateOrderConfirmationEmail;
