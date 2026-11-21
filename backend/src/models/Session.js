const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
    },

    currentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    conversationState: {
      type: String,
      enum: [
        "main_menu",
        "selecting_item",
        "awaiting_quantity",
        "awaiting_email",
        "awaiting_payment",
      ],
      default: "main_menu",
    },

    pendingMenuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Session", sessionSchema);
