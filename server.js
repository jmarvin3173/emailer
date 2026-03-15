import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const allowedOrigins = [
  process.env.LOCAL,
  process.env.GITHUB_PATH
];

// Allow frontend
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (e.g., Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed for this origin"));
    }
  }
}));
app.use(express.json());

// Nodemailer transporter (Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS, // App Password
  },
});

app.post("/send-email", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).send("Missing required fields");
  }

  try {
    // Email to yourself
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      replyTo: email, // allows replying to the user
      subject: `Message from ${name}`,
      text: message,
    });

    // Confirmation to user
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Thanks for contacting us!",
      html: `<p>Hi ${name},</p><p>Thanks for reaching out! I got your message.</p>`,
    });

    res.status(200).send("Emails sent successfully!");
  } catch (err) {
    console.error("Nodemailer Error:", err);
    res.status(500).send("Failed to send emails.");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));