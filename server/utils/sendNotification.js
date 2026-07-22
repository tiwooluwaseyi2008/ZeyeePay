const sendEmail = require('./sendEmail');

const sendNotification = {
  
  // Notify admin of new funding request
  newFundingRequest(fundingRequest, user) {
    // Fire and forget - don't await
    sendEmail({
      email: process.env.ADMIN_EMAIL || 'admin@payswift.com',
      subject: `🔔 New Funding Request - ${fundingRequest.reference}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #0066cc; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">PaySwift VTU</h1>
          </div>
          <div style="background-color: #ffffff; padding: 25px; border: 1px solid #eee;">
            <h2 style="color: #333;">New Wallet Funding Request</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">User:</td><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: 600;">${user.firstName} ${user.lastName}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">Email:</td><td style="padding: 10px; border-bottom: 1px solid #eee;">${user.email}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">Phone:</td><td style="padding: 10px; border-bottom: 1px solid #eee;">${user.phone}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">Amount:</td><td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 18px; color: #0066cc; font-weight: 700;">₦${fundingRequest.amount.toLocaleString()}</td></tr>
              <tr><td style="padding: 10px; color: #666;">Reference:</td><td style="padding: 10px; font-family: monospace; font-size: 16px;">${fundingRequest.reference}</td></tr>
            </table>
            <div style="margin-top: 20px; text-align: center;">
              <a href="${process.env.CLIENT_URL}/admin/funding" 
                 style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Review Request
              </a>
            </div>
          </div>
        </div>
      `
    }).catch(err => console.error('Admin notification failed:', err.message));
  },

  // Notify user of approval
  fundingApproved(fundingRequest, user) {
    sendEmail({
      email: user.email,
      subject: `✅ Wallet Funded - ₦${fundingRequest.amount.toLocaleString()} Credited`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #28a745; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">✅ Payment Approved!</h1>
          </div>
          <div style="background-color: #ffffff; padding: 25px; border: 1px solid #eee;">
            <h2 style="color: #333;">Wallet Credited Successfully</h2>
            <p>Hi ${user.firstName},</p>
            <p>Your wallet funding request has been approved and your wallet has been credited.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr><td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">Amount Credited:</td><td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 20px; color: #28a745; font-weight: 700;">₦${fundingRequest.amount.toLocaleString()}</td></tr>
              <tr><td style="padding: 10px; color: #666;">Reference:</td><td style="padding: 10px; font-family: monospace;">${fundingRequest.reference}</td></tr>
            </table>
            <div style="margin-top: 20px; text-align: center;">
              <a href="${process.env.CLIENT_URL}/dashboard" 
                 style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Go to Dashboard
              </a>
            </div>
            <p style="margin-top: 20px; color: #888; font-size: 13px;">Thank you for using PaySwift VTU!</p>
          </div>
        </div>
      `
    }).catch(err => console.error('Approval notification failed:', err.message));
  },

  // Notify user of rejection
  fundingRejected(fundingRequest, user) {
    sendEmail({
      email: user.email,
      subject: `❌ Funding Request Rejected - ${fundingRequest.reference}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #dc3545; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Funding Request Rejected</h1>
          </div>
          <div style="background-color: #ffffff; padding: 25px; border: 1px solid #eee;">
            <h2 style="color: #333;">Payment Not Confirmed</h2>
            <p>Hi ${user.firstName},</p>
            <p>Your wallet funding request for <strong>₦${fundingRequest.amount.toLocaleString()}</strong> (Ref: ${fundingRequest.reference}) could not be verified.</p>
            <p>Please try again or contact support if you believe this is an error.</p>
            <div style="margin-top: 20px;">
              <a href="https://wa.me/2348105002814" 
                 style="background-color: #25D366; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                📞 Contact Support
              </a>
            </div>
          </div>
        </div>
      `
    }).catch(err => console.error('Rejection notification failed:', err.message));
  },

  // Notify user when they submit payment confirmation
  paymentConfirmationReceived(fundingRequest, user) {
    sendEmail({
      email: user.email,
      subject: `⏳ Payment Confirmation Received - ${fundingRequest.reference}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #ffc107; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: #333; margin: 0;">⏳ Payment Under Review</h1>
          </div>
          <div style="background-color: #ffffff; padding: 25px; border: 1px solid #eee;">
            <h2 style="color: #333;">Your Payment is Being Verified</h2>
            <p>Hi ${user.firstName},</p>
            <p>We've received your payment confirmation for <strong>₦${fundingRequest.amount.toLocaleString()}</strong>.</p>
            <p>Your wallet will be credited once the payment is verified (usually within a few minutes).</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr><td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">Reference:</td><td style="padding: 10px; border-bottom: 1px solid #eee; font-family: monospace; font-weight: 600;">${fundingRequest.reference}</td></tr>
              <tr><td style="padding: 10px; color: #666;">Status:</td><td style="padding: 10px; color: #ffc107; font-weight: 600;">⏳ Pending Approval</td></tr>
            </table>
            <p style="color: #888; font-size: 13px;">If you have any questions, WhatsApp us at 08105002814</p>
          </div>
        </div>
      `
    }).catch(err => console.error('Confirmation notification failed:', err.message));
  }
};

module.exports = sendNotification;