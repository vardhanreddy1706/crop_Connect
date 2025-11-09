const Subscription = require("../models/Subscription");

const isValidEmail = (email) => /^(?:[a-zA-Z0-9_'^&+{}-]+(?:\.[a-zA-Z0-9_'^&+{}-]+)*)@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(email);

exports.subscribe = async (req, res) => {
  try {
    const { email, source } = req.body || {};
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Please provide a valid email" });
    }

    const existing = await Subscription.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.json({ success: true, message: "You're already subscribed" });
    }

    const sub = await Subscription.create({
      email: email.toLowerCase(),
      source: source || req.headers["x-sub-source"] || "footer",
      userId: req.user?._id || null,
    });

    // Email confirmation (if transporter is configured)
    if (req.emailTransporter) {
      try {
        // Send confirmation to subscriber
        await req.emailTransporter.sendMail({
          from: `"Crop Connect" <${process.env.EMAIL_USER}>`,
          to: sub.email,
          subject: "You're subscribed to CropConnect updates!",
          html: `
            <div style="font-family:Arial,sans-serif;padding:24px;background:#f7fff9">
              <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;border:1px solid #e5f5eb">
                <h1 style="color:#059669;margin:0 0 12px">Welcome to CropConnect 🌾</h1>
                <p style="color:#111827;font-size:15px;line-height:1.6">Thanks for subscribing! You will receive updates on new features, market prices, and farming tips.</p>
                <p style="color:#6b7280;font-size:12px;margin-top:24px">If you did not request this, you can ignore this email.</p>
              </div>
            </div>
          `,
        });

        // Notify admin/support
        if (process.env.EMAIL_USER) {
          await req.emailTransporter.sendMail({
            from: `"Crop Connect" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: "New newsletter subscription",
            text: `New subscriber: ${sub.email} (source: ${sub.source})`,
          });
        }
      } catch (e) {
        console.log("Email confirmation/notify failed:", e.message);
      }
    }

    return res.status(201).json({ success: true, message: "Successfully subscribed" });
  } catch (error) {
    if (error.code === 11000) {
      return res.json({ success: true, message: "You're already subscribed" });
    }
    console.error("Subscription error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.list = async (_req, res) => {
  const items = await Subscription.find().sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, subscribers: items });
};
