const nodemailer = require('nodemailer');

let transporter;

const initMailer = () => {
  if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_PASSWORD) {
    console.warn('⚠️ Mailer credentials not found in .env. Email notifications will be disabled.');
    return;
  }
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_EMAIL,
      pass: process.env.GMAIL_PASSWORD, // Use a Gmail "App Password"
    },
  });
};

const verifyTransporter = async () => {
  if (!transporter) return;
  try {
    await transporter.verify();
    console.log('✅ Mailer is ready to send emails.');
  } catch (error) {
    console.error('❌ Mailer verification failed:', error);
    throw new Error('Could not connect to Gmail SMTP server.');
  }
};

const sendReportEmail = async (report) => {
  if (!transporter) {
    console.log('Mailer not initialized, skipping admin notification email.');
    return;
  }

  const mailOptions = {
    from: `"Civics App" <${process.env.GMAIL_EMAIL}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `New Report Submitted: "${report.title}"`,
    html: `
      <h1>New Report Received</h1>
      <p>A new civic issue has been reported.</p>
      <ul>
        <li><strong>ID:</strong> ${report.id}</li>
        <li><strong>Title:</strong> ${report.title}</li>
        <li><strong>Description:</strong> ${report.description}</li>
        <li><strong>Reported By:</strong> ${report.reporterEmail}</li>
        <li><strong>Time:</strong> ${new Date(report.createdAt).toLocaleString()}</li>
      </ul>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Notification email sent to admin for report ${report.id}`);
  } catch (error) {
    console.error(`Failed to send report email for ${report.id}:`, error);
  }
};

const sendStatusUpdateEmail = async (originalReport, update) => {
  if (!transporter) {
    console.log('Mailer not initialized, skipping status update email.');
    return;
  }

  const mailOptions = {
    from: `"Civics App" <${process.env.GMAIL_EMAIL}>`,
    to: originalReport.reporterEmail,
    subject: `Update on your report: "${originalReport.title}"`,
    html: `
      <h1>Report Status Updated</h1>
      <p>Hello, the status of your report has been updated.</p>
      <ul>
        <li><strong>Title:</strong> ${originalReport.title}</li>
        <li><strong>New Status:</strong> <strong>${update.status}</strong></li>
        ${update.remarks ? `<li><strong>Remarks:</strong> ${update.remarks}</li>` : ''}
      </ul>
      <p>Thank you for your contribution to our community.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Status update email sent to ${originalReport.reporterEmail} for report ${originalReport.id}`);
  } catch (error) {
    console.error(`Failed to send status update email for ${originalReport.id}:`, error);
  }
};

module.exports = { initMailer, verifyTransporter, sendReportEmail, sendStatusUpdateEmail };