const functions = require("firebase-functions");
const nodemailer = require("nodemailer");

// Gmail config (use environment variables in real project)
const gmailEmail = process.env.GMAIL_EMAIL;
const gmailPassword = process.env.GMAIL_PASSWORD;
const adminEmail = "admin@civics.app";

// Nodemailer transport
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

async function sendMail(mailOptions) {
  return transporter.sendMail(mailOptions);
}

// 1) Forward new reports
exports.forwardReport = functions.firestore
    .document("reports/{reportId}")
    .onCreate(async (snapshot, context) => {
      const report = snapshot.data() || {};
      const reportId = context.params.reportId;

      const mailOptions = {
        from: `"Civics App" <${gmailEmail || adminEmail}>`,
        to: adminEmail,
        subject: `New Report Submitted: ${report.title || reportId}`,
        html: `
        <p><strong>Title:</strong> ${report.title || "N/A"}</p>
        <p><strong>Description:</strong> ${report.description || "N/A"}</p>
        <p><strong>Reporter Email:</strong> ${report.reporterEmail || report.userEmail || "N/A"}</p>
        <p>Open report id: ${reportId}</p>
      `,
      };

      try {
        await sendMail(mailOptions);
        console.log("Forwarded report:", reportId);
      } catch (err) {
        console.error("Failed to forward report:", err);
      }

      return null;
    });

// 2) Send status update emails
exports.sendStatusUpdate = functions.firestore
    .document("reports/{reportId}")
    .onUpdate(async (change, context) => {
      const before = change.before.data() || {};
      const after = change.after.data() || {};
      const reportId = context.params.reportId;

      // Only act if status changed
      if (before.status === after.status) return null;

      const recipient = after.reporterEmail || after.userEmail;
      if (!recipient) {
        console.log("No recipient email for report", reportId);
        return null;
      }

      const mailOptions = {
        from: `"Civics App" <${gmailEmail || adminEmail}>`,
        to: recipient,
        subject: `Update on your report: ${after.title || reportId}`,
        html: `
        <p>Your report status changed from <strong>${before.status || "N/A"}</strong> to <strong>${after.status || "N/A"}</strong>.</p>
        <p>Remarks: ${after.remarks || "No remarks"}</p>
        <p>Report ID: ${reportId}</p>
      `,
      };

      try {
        await sendMail(mailOptions);
        console.log("Status email sent to", recipient);
      } catch (err) {
        console.error("Failed to send status email:", err);
      }

      return null;
    });
