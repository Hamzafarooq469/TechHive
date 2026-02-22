const generateWelcomeEmail = ({ userName, userEmail }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">🎉 Welcome to TechHive!</h1>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 30px; border: 1px solid #dee2e6; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Hi <strong>${userName}</strong>,</p>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          Thank you for joining TechHive! We're thrilled to have you as part of our community. 
          Your account has been successfully created and you're all set to start shopping.
        </p>

        <div style="background-color: white; padding: 20px; border-radius: 6px; margin: 25px 0; border-left: 4px solid #28a745;">
          <h3 style="color: #28a745; margin-top: 0;">What's Next?</h3>
          <ul style="color: #666; line-height: 1.8; padding-left: 20px;">
            <li>Browse our wide selection of products</li>
            <li>Add items to your wishlist</li>
            <li>Enjoy exclusive deals and offers</li>
            <li>Track your orders in real-time</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" 
             style="display: inline-block; padding: 14px 30px; background-color: #28a745; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
            Start Shopping
          </a>
        </div>

        <div style="background-color: #e7f3ff; border: 1px solid #b3d9ff; padding: 15px; border-radius: 6px; margin: 25px 0;">
          <p style="margin: 0; color: #004085;">
            💡 <strong>Tip:</strong> Complete your profile to get personalized recommendations and faster checkout!
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="color: #666; font-size: 14px; margin-bottom: 10px;">Need help? We're here for you!</p>
          <p style="color: #999; font-size: 12px;">
            Contact us anytime at <a href="mailto:support@techhive.com" style="color: #007bff;">support@techhive.com</a>
          </p>
        </div>

        <div style="text-align: center; margin-top: 20px;">
          <p style="color: #999; font-size: 12px;">
            © ${new Date().getFullYear()} TechHive. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  `;

  const text = `
Welcome to TechHive!

Hi ${userName},

Thank you for joining TechHive! We're thrilled to have you as part of our community. 
Your account has been successfully created and you're all set to start shopping.

What's Next?
- Browse our wide selection of products
- Add items to your wishlist
- Enjoy exclusive deals and offers
- Track your orders in real-time

Visit our store: ${process.env.FRONTEND_URL || 'http://localhost:5173'}

Tip: Complete your profile to get personalized recommendations and faster checkout!

Need help? Contact us at support@techhive.com

© ${new Date().getFullYear()} TechHive. All rights reserved.
  `;

  return { html, text };
};

module.exports = generateWelcomeEmail;
