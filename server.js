import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const PORT = 5000;

// Create transporter once
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

app.post("/send-email", async (req, res) => {
  const { name, email, message } = req.body;

  try {
    // 1️⃣ Send email to your Gmail
    await transporter.sendMail({
      from: email,
      to: process.env.GMAIL_USER,
      subject: `Message from ${name}`,
      text: message,
    });

    // 2️⃣ Send automatic response to the user
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Thanks for contacting us!",
      html: `
        <p>Hi ${name},</p>
        <p>Thank you for reaching out. We have received your message and will get back to you soon.</p>
        <p>Best regards,<br/>Your Company</p>
      `,
    });

    res.status(200).send("Email sent and response delivered to user!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to send emails.");
  }
});

app.listen(PORT, () => console.log("Server running on port 5000"));