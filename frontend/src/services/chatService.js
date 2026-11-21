
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const CHAT_URL =
  import.meta.env.VITE_API_URL || `${API_BASE_URL}/chat`;

// Give each customer's browser its own device ID.
function getDeviceId() {
  let deviceId = localStorage.getItem("foodbot-device-id");

  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("foodbot-device-id", deviceId);
  }

  return deviceId;
}

// Send a customer's message to the chatbot backend.
export async function sendChatMessage(message) {
  const response = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      deviceId: getDeviceId(),
      message,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.error || data.message || data.reply || "Unable to contact FoodBot."
    );
  }

  return data.reply;
}

// Initialize a Paystack payment.
export async function initializePayment(email) {
  const response = await fetch(`${API_BASE_URL}/payment/initialize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      deviceId: getDeviceId(),
      email,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Unable to start payment.");
  }

  return data;
}

// Verify payment after Paystack redirects the customer back.
export async function verifyPayment(reference) {
  const response = await fetch(`${API_BASE_URL}/payment/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      deviceId: getDeviceId(),
      reference,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success || !data.paid) {
    throw new Error(data.message || "Payment could not be verified.");
  }

  return data;
}
