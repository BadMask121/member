import qr from "qrcode";
import { sendEmail } from "./sendEmail";

// Function to generate QR code
async function generateQRCodeDataURL(data: string): Promise<string> {
  try {
    const url = await qr.toDataURL(data);
    console.log("QR code generated successfully");
    return url;
  } catch (err) {
    console.error("Error generating QR code:", err);
    throw err;
  }
}

// Main function to orchestrate the process
export async function sendQRCodeEmail(qrData: string, recipientEmail: string): Promise<void> {
  // Generate QR code image
  const qrCodeDataURL = await generateQRCodeDataURL(qrData);

  // Send email with QR code

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your QR Code</title>
    </head>
    <body>
      <h1>Here's your QR Code</h1>
      <p>Scan the QR code below:</p>
      <img src="${qrCodeDataURL}" alt="QR Code" style="width: 200px; height: 200px;">
    </body>
    </html>
  `;

  await sendEmail({
    to: recipientEmail,
    subject: "Scan whatsapp code",
    html: htmlContent,
  });
}
