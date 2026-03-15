import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

/*
CORS middleware
*/
const allowedOrigins = [
  process.env.LOCAL,
  process.env.GITHUB_PATH
].filter(Boolean);

// Debug (optional but useful)
app.use((req, res, next) => {
  console.log("Request Origin:", req.headers.origin);
  next();
});

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  }
}));

app.use(express.json());

/*
Nodemailer transporter
Using Gmail App Password
*/
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

/*
Send email route
*/
app.post("/send-email", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).send("Missing required fields");
  }

  try {
    console.log("Sending email to self...");
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      replyTo: email,
      subject: `Message from ${name}`,
      text: message,
    });
    console.log("Email to self sent!");

    console.log("Sending confirmation to user...");
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Thanks for contacting us!",
      html: `<p>Hi ${name},</p><p>Thanks for reaching out! I got your message.</p>`,
    });
    console.log("Confirmation email sent!");

    res.status(200).send("Emails sent successfully!");
  } catch (err) {
    console.error("Nodemailer Error:", err);
    res.status(500).send(`Failed to send emails: ${err.message}`);
  }
});

/*
Health check route (useful for Render)
*/
app.get("/", (req, res) => {
  res.send("Email API running");
});

/*
Start server
*/
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});