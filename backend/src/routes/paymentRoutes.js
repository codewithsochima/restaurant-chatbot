
const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const Order = require("../models/Order");
const Session = require("../models/Session");

const router = express.Router();

const PAYSTACK_URL = "https://api.paystack.co";

// Initialize a Paystack transaction
router.post("/initialize", async (req, res) => {
  let reference;

  try {
    const { deviceId, email } = req.body;

    if (!deviceId || !email) {
      return res.status(400).json({
        success: false,
        message: "Device ID and email are required.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      return res.status(500).json({
        success: false,
        message: "Paystack has not been configured on the server.",
      });
    }

    // Find this customer's session.
    const session = await Session.findOne({ deviceId });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Customer session could not be found.",
      });
    }

    // Find this customer's latest order awaiting payment.
    const order = await Order.findOne({
      session: session._id,
      status: "placed",
      paymentStatus: "pending",
    }).sort({ createdAt: -1 });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "No order awaiting payment was found.",
      });
    }

    if (!order.items.length || order.totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "This order cannot be paid for.",
      });
    }

    reference = `foodbot_${Date.now()}_${crypto
      .randomBytes(6)
      .toString("hex")}`;

    order.paymentReference = reference;
    await order.save();

    const callbackUrl = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/?payment=callback`;

    const response = await axios.post(
      `${PAYSTACK_URL}/transaction/initialize`,
      {
        email,
        amount: Math.round(order.totalAmount * 100),
        currency: "NGN",
        reference,
        callback_url: callbackUrl,
        metadata: {
          deviceId,
          orderId: order._id.toString(),
          customerEmail: email,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    if (!response.data.status || !response.data.data.authorization_url) {
      throw new Error("Paystack could not initialize the transaction.");
    }

    return res.status(200).json({
      success: true,
      authorizationUrl: response.data.data.authorization_url,
      reference,
      message: "Payment initialized successfully.",
    });
  } catch (error) {
    console.error(
      "Payment initialization error:",
      error.response?.data || error.message
    );

    if (reference) {
      await Order.updateOne(
        { paymentReference: reference, paymentStatus: "pending" },
        { $set: { paymentReference: null } }
      ).catch((updateError) => {
        console.error("Could not reset payment reference:", updateError.message);
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error.response?.data?.message ||
        "Unable to initialize payment. Please try again.",
    });
  }
});

// Verify a Paystack transaction
router.post("/verify", async (req, res) => {
  try {
    const { deviceId, reference } = req.body;

    if (!deviceId || !reference) {
      return res.status(400).json({
        success: false,
        message: "Device ID and payment reference are required.",
      });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      return res.status(500).json({
        success: false,
        message: "Paystack has not been configured on the server.",
      });
    }

    const order = await Order.findOne({
      paymentReference: reference,
    }).populate("session");

    if (!order || !order.session || order.session.deviceId !== deviceId) {
      return res.status(404).json({
        success: false,
        message: "Payment order could not be found.",
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(200).json({
        success: true,
        paid: true,
        message: "Your payment has already been confirmed. Thank you!",
        orderTotal: order.totalAmount,
      });
    }

    const response = await axios.get(
      `${PAYSTACK_URL}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
        timeout: 15000,
      }
    );

    const transaction = response.data.data;
    const expectedAmount = Math.round(order.totalAmount * 100);

    const paymentIsValid =
      response.data.status === true &&
      transaction.status === "success" &&
      transaction.reference === reference &&
      transaction.amount === expectedAmount &&
      transaction.currency === "NGN";

    if (!paymentIsValid) {
      if (
        transaction.status === "failed" ||
        transaction.status === "abandoned"
      ) {
        order.paymentStatus = "failed";
        await order.save();
      }

      return res.status(400).json({
        success: false,
        paid: false,
        message:
          "Payment has not been confirmed. If you completed payment, please contact the restaurant.",
      });
    }

    order.paymentStatus = "paid";
    await order.save();

    return res.status(200).json({
      success: true,
      paid: true,
      message:
        "Payment successful! 🎉 Your order has been confirmed. Thank you for ordering with FoodBot!",
      orderTotal: order.totalAmount,
    });
  } catch (error) {
    console.error(
      "Payment verification error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to verify your payment right now. Please try again.",
    });
  }
});

module.exports = router;
