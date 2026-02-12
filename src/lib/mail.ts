import nodemailer from "nodemailer";

export async function sendOTP(email: string, otp: string) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false, // TLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Test connection
    await transporter.verify();

    const mailOptions = {
      from: `"SmartNote AI" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Access Code: " + otp,
      html: `<div style="font-family: sans-serif; padding: 20px; border: 2px solid black;">
        <h2>Access Code</h2>
        <p style="font-size: 24px; font-weight: bold; color: #fb7185;">${otp}</p>
        <p>This code will expire in 10 minutes.</p>
      </div>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("SMTP ERROR:", error);
    throw error;
  }
}
