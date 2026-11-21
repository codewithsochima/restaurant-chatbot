
const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const Order = require("../models/Order");
const Session = require("../models/Session");

const router = express.Router();

const PAYSTACK_BASE_URL = "https://api.paystack.co";

const getPaystackHeaders = () => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Paystack secret key is not configured.");
  }

  return {
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/json",
  };
};

// Initialize Paystack payment
router.post("/initialize", async (req, res) => {
  let order = null;
  let reference = null;

  try {
    const { deviceId, email } = req.body;

    if (!deviceId || !email) {
      return res.status(400).json({
        success: false,
        message: "Device ID and email address are required.",
      });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    // Find the customer's session
    const session = await Session.findOne({ deviceId });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Customer session not found.",
      });
    }

    // Find the customer's latest unpaid placed order
    order = await Order.findOne({
      session: session._id,
      status: "placed",
      paymentStatus: "pending",
    }).sort({ createdAt: -1 });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "No unpaid order was found. Please place an order first.",
      });
    }

    if (order.totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order amount.",
      });
    }

    // Generate a unique payment reference
    reference = `foodbot_${Date.now()}_${crypto
      .randomBytes(6)
      .toString("hex")}`;

    order.paymentReference = reference;
    await order.save();

    // Use the deployed frontend URL in production
    const frontendUrl = (
      process.env.FRONTEND_URL || "http://localhost:5173"
    ).replace(/\/+$/, "");

    const callbackUrl = `${frontendUrl}/?payment=callback`;

    // Initialize transaction with Paystack
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email: email.trim(),
        amount: Math.round(order.totalAmount * 100),
        currency: "NGN",
        reference,
        callback_url: callbackUrl,
        metadata: {
          deviceId,
          orderId: order._id.toString(),
          email: email.trim(),
        },
      },
      {
        headers: getPaystackHeaders(),
      }
    );

    if (
      !response.data.status ||
      !response.data.data.authorization_url
    ) {
      throw new Error("Paystack could not initialize the transaction.");
    }

    return res.status(200).json({
      success: true,
      message: "Payment initialized successfully.",
      authorizationUrl: response.data.data.authorization_url,
      reference: response.data.data.reference,
    });
  } catch (error) {
    console.error(
      "Payment initialization error:",
      error.response?.data || error.message
    );

    // Clear the unused reference if initialization failed
    if (order && reference && order.paymentReference === reference) {
      order.paymentReference = null;
      await order.save().catch((saveError) => {
        console.error("Could not reset payment reference:", saveError);
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        "Unable to initialize payment. Please try again.",
    });
  }
});

// Verify Paystack payment
router.post("/verify", async (req, res) => {
  try {
    const { deviceId, reference } = req.body;

    if (!deviceId || !reference) {
      return res.status(400).json({
        success: false,
        paid: false,
        message: "Device ID and payment reference are required.",
      });
    }

    // Find the order using its payment reference
    const order = await Order.findOne({
      paymentReference: reference,
    }).populate("session");

    if (!order || !order.session) {
      return res.status(404).json({
        success: false,
        paid: false,
        message: "Payment order not found.",
      });
    }

    // Make sure the payment belongs to this customer
    if (order.session.deviceId !== deviceId) {
      return res.status(403).json({
        success: false,
        paid: false,
        message: "You are not authorized to verify this payment.",
      });
    }

    // Avoid verifying an already completed payment again
    if (order.paymentStatus === "paid") {
      return res.status(200).json({
        success: true,
        paid: true,
        message: "Your payment has already been confirmed. Thank you!",
        orderTotal: order.totalAmount,
      });
    }

    if (order.paymentStatus !== "pending") {
      return res.status(400).json({
        success: false,
        paid: false,
        message: "This order is not awaiting payment.",
      });
    }

    // Verify transaction directly with Paystack
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: getPaystackHeaders(),
      }
    );

    const payment = response.data.data;

    // Confirm that Paystack reports a successful transaction
    if (
      !response.data.status ||
      payment.status !== "success" ||
      payment.reference !== reference
    ) {
      return res.status(400).json({
        success: false,
        paid: false,
        message: "Payment was not successful. Please try again.",
      });
    }

    // Verify the amount paid
    const expectedAmount = Math.round(order.totalAmount * 100);

    if (
      payment.amount !== expectedAmount ||
      payment.currency !== "NGN"
    ) {
      return res.status(400).json({
        success: false,
        paid: false,
        message: "Payment amount could not be verified.",
      });
    }

    // Update order payment status
    order.paymentStatus = "paid";
    await order.save();

    return res.status(200).json({
      success: true,
      paid: true,
      message: "Payment successful! Your order has been confirmed. Thank you for ordering with FoodBot! 🎉",
      orderTotal: order.totalAmount,
    });
  } catch (error) {
    console.error(
      "Payment verification error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      paid: false,
      message:
        error.response?.data?.message ||
        "Unable to verify payment. Please try again.",
    });
  }
});

module.exports = router;
