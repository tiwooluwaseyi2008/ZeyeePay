const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 5000,  // 5 second timeout
      greetingTimeout: 5000,
      socketTimeout: 5000
    });

    await transporter.sendMail({
      from: `PaySwift VTU <${process.env.SMTP_EMAIL}>`,
      to: options.email,
      subject: options.subject,
      html: options.html
    });
    
    console.log('Email sent successfully');
    return true;
  } catch (error) {
    console.error('Email error (non-blocking):', error.message);
    return false;  // Don't throw, just return false
  }
};

module.exports = sendEmail;