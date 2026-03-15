import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

/*
Allowed origins
IMPORTANT:
Origins must NOT contain paths or trailing slashes
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

/*
CORS middleware
*/
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests or Postman
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked: ${origin}`));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
  })
);

/*
Handle preflight requests
*/
app.options("*", cors());

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
    // Email to yourself
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      replyTo: email,
      subject: `Message from ${name}`,
      text: message
    });

    // Confirmation email to sender
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Thanks for contacting me!",
      html: `
        <p>Hi ${name},</p>
        <p>Thanks for reaching out! I received your message and will get back to you soon.</p>
      `
    });

    res.status(200).send("Emails sent successfully!");
  } catch (err) {
    console.error("Nodemailer Error:", err);
    res.status(500).send("Failed to send emails.");
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