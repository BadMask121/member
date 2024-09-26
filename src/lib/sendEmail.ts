import nodemailer from "nodemailer";

// Function to send email with QR code attachment
export async function sendEmail({
  text,
  subject,
  to,
  html,
  attachments,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: { filename: string; path: string }[];
}): Promise<void> {
  const authEmail = process.env.SMTP_EMAIL;
  const authPassword = process.env.SMTP_PASSWORD;
  const smptHost = process.env.SMTP_HOST;
  const mailerConfig = {
    host: smptHost,
    port: 587,
    secure: false, // Use TLS
    auth: {
      user: authEmail,
      pass: authPassword,
    },
  };

  // Create a transporter using SMTP
  const transporter = nodemailer.createTransport(mailerConfig);

  // Email options
  const mailOptions = {
    from: authEmail,
    to,
    subject,
    text,
    html,
    attachments,
    attachDataUrls: true,
  };

  // Send email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
    console.log("Message ID:", info.messageId);
  } catch (err) {
    console.error("Error sending email:", err);
  }
}
