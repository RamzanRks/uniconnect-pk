const nodemailer = require('nodemailer');

// Works with Gmail App Password. If not configured, logs emails to console (dev mode).
const isConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

const transporter = isConfigured
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    })
  : null;

const sendMail = async ({ to, subject, text }) => {
  if (!transporter) {
    console.log(`📧 [DEV EMAIL] to=${to} | ${subject} | ${text}`);
    return { dev: true };
  }
  await transporter.sendMail({
    from: `"UniConnect PK" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  });
  return { dev: false };
};

module.exports = { sendMail, isConfigured };