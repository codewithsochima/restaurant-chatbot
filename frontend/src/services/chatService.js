
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/chat";

// Give each customer's browser its own device ID.
function getDeviceId() {
  let deviceId = localStorage.getItem("foodbot-device-id");

  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("foodbot-device-id", deviceId);
  }

  return deviceId;
}

// Send a customer's message to our backend.
export async function sendChatMessage(message) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      deviceId: getDeviceId(),
      message
    })
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.error || data.reply || "Unable to contact FoodBot."
    );
  }

  return data.reply;
}
