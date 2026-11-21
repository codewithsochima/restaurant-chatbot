
const express = require("express");
const { processMessage } = require("../services/chatService");

const router = express.Router();

// Receive and process chatbot messages
router.post("/", async (req, res) => {
  try {
    const { deviceId, message } = req.body;

    if (!deviceId || !message) {
      return res.status(400).json({
        success: false,
        message: "Device ID and message are required.",
      });
    }

    const reply = await processMessage(deviceId, message);

    return res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error("Chat error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
});

module.exports = router;
