import express from "express";

import cors from "cors";
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";

dotenv.config();

const app = express();

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Allowed origins for CORS
const allowedOrigins = [
  process.env.LOCAL,
  process.env.GITHUB_PATH
].filter(Boolean);



app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("Email API running");
});

// Send email route
app.post("/send-email", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Email to yourself
    await sgMail.send({
      to: process.env.SENDGRID_FROM,
      from: process.env.SENDGRID_FROM,
      replyTo: email,
      subject: `Message from ${name}`,
      text: message
    });


    // Confirmation to sender
    await sgMail.send({
      to: email,
      from: process.env.SENDGRID_FROM,
      subject: "Thanks for contacting us!",
      html: `<p>Hi ${name},</p><p>Thanks for reaching out! I got your message.</p>`
    });


    res.status(200).json({ message: "Emails sent successfully!" });
  } catch (err) {
    console.error("SendGrid Error:", err);
    res.status(500).json({ error: `Failed to send emails: ${err.message}` });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));