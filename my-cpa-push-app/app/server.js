const express = require("express");
const fetch = require("node-fetch"); // যদি Node 18+ হয়, built-in fetch আছে
const path = require("path");

const app = express();
app.use(express.json());

// Static files serve করবে (index.html, admin.html ইত্যাদি)
app.use(express.static(path.join(__dirname, "public")));

// Env variables (Render → Environment এ সেট করবে)
const APP_ID = process.env.ONESIGNAL_APP_ID;
const REST_KEY = process.env.ONESIGNAL_REST_API_KEY;

// Test route
app.get("/ping", (req, res) => {
  res.send("Server is running ✅");
});

// Admin থেকে নোটিফিকেশন পাঠানোর জন্য endpoint
app.post("/send", async (req, res) => {
  try {
    const message = req.body.message || "Hello from my CPA app!";

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Basic ${REST_KEY}`, // OneSignal REST API key
      },
      body: JSON.stringify({
        app_id: APP_ID,
        included_segments: ["All"],
        contents: { en: message }
      })
    });

    const data = await response.json();
    res.json(data);

  } catch (err) {
    console.error("Error sending notification:", err);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

// Render / Railway এ PORT dynamic হবে
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
