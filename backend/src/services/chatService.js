
const Session = require("../models/Session");
const MenuItem = require("../models/menuItem");
const Order = require("../models/Order");

// Format prices in Nigerian Naira
const formatPrice = (amount) => {
  return `₦${amount.toLocaleString("en-NG")}`;
};

// Display the chatbot's main menu
const getMainMenu = () => {
  return `
Welcome to FoodBot! 🍽️

How can we help you today?

1. Place an order
99. Checkout order
98. Order history
97. Current order
0. Cancel order

Enter a number to continue.
`;
};

// Display available restaurant meals
const getRestaurantMenu = async (session) => {
  const menuItems = await MenuItem.find({ available: true }).sort({
    name: 1,
  });

  if (menuItems.length === 0) {
    session.conversationState = "main_menu";
    await session.save();

    return "Sorry, our menu is currently unavailable.";
  }

  session.conversationState = "selecting_item";
  await session.save();

  let response = "🍽️ OUR RESTAURANT MENU\n\n";

  menuItems.forEach((item, index) => {
    response += `${index + 1}. ${item.name} - ${formatPrice(item.price)}\n`;
    response += `   ${item.description}\n\n`;
  });

  response += "Enter the number of the meal you want to order.";
  response += "\nEnter 0 to cancel.";

  return response;
};

// Display the customer's current order
const getCurrentOrder = async (session) => {
  if (!session.currentOrder) {
    return "You don't have an active order.";
  }

  const order = await Order.findById(session.currentOrder);

  if (!order || order.status !== "pending") {
    session.currentOrder = null;
    await session.save();

    return "You don't have an active order.";
  }

  let response = "🛒 YOUR CURRENT ORDER\n\n";

  order.items.forEach((item) => {
    response += `${item.name} x ${item.quantity}`;
    response += ` = ${formatPrice(item.price * item.quantity)}\n`;
  });

  response += `\nTotal: ${formatPrice(order.totalAmount)}`;
  response += "\n\nEnter 99 to checkout.";
  response += "\nEnter 0 to cancel your order.";

  return response;
};

// Display the customer's previous orders
const getOrderHistory = async (session) => {
  const orders = await Order.find({
    session: session._id,
    status: { $in: ["placed", "cancelled"] },
  }).sort({ createdAt: -1 });

  if (orders.length === 0) {
    return "You haven't placed any orders yet.";
  }

  let response = "📋 YOUR ORDER HISTORY\n\n";

  orders.forEach((order, index) => {
    response += `Order ${index + 1}\n`;

    order.items.forEach((item) => {
      response += `- ${item.name} x ${item.quantity}\n`;
    });

    response += `Total: ${formatPrice(order.totalAmount)}\n`;
    response += `Status: ${order.status}\n\n`;
  });

  return response;
};

// Cancel the customer's current order
const cancelOrder = async (session) => {
  if (!session.currentOrder) {
    return "You don't have an active order to cancel.";
  }

  const order = await Order.findById(session.currentOrder);

  if (!order || order.status !== "pending") {
    session.currentOrder = null;
    await session.save();

    return "You don't have an active order to cancel.";
  }

  order.status = "cancelled";
  await order.save();

  session.currentOrder = null;
  session.pendingMenuItem = null;
  session.conversationState = "main_menu";
  await session.save();

  return "Your order has been cancelled successfully.";
};

// Add a selected meal to the customer's order
const addMealToOrder = async (session, menuItem, quantity) => {
  let order = null;

  if (session.currentOrder) {
    order = await Order.findById(session.currentOrder);
  }

  if (!order || order.status !== "pending") {
    order = await Order.create({
      session: session._id,
      items: [],
      totalAmount: 0,
      status: "pending",
    });

    session.currentOrder = order._id;
  }

  const existingItem = order.items.find(
    (item) => item.menuItem.toString() === menuItem._id.toString()
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    order.items.push({
      menuItem: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      quantity,
    });
  }

  order.totalAmount = order.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  await order.save();

  session.currentOrder = order._id;
  session.pendingMenuItem = null;
  session.conversationState = "main_menu";
  await session.save();

  return `${quantity} x ${menuItem.name} added successfully!\n\nOrder total: ${formatPrice(order.totalAmount)}\n\n${getMainMenu()}`;
};

// Main chatbot message processor
const processMessage = async (deviceId, message) => {
  const userMessage = String(message || "").trim();

  if (!deviceId || !userMessage) {
    return "Please provide a valid message.";
  }

  // Find or create a session for this device
  let session = await Session.findOne({ deviceId });

  if (!session) {
    session = await Session.create({ deviceId });
  }

  // Handle cancellation at any conversation stage
  if (userMessage === "0") {
    return await cancelOrder(session);
  }

  // Handle quantity selection
  if (session.conversationState === "awaiting_quantity") {
    const quantity = Number(userMessage);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
      return "Please enter a valid quantity between 1 and 50.";
    }

    const menuItem = await MenuItem.findById(session.pendingMenuItem);

    if (!menuItem || !menuItem.available) {
      session.pendingMenuItem = null;
      session.conversationState = "selecting_item";
      await session.save();

      return "Sorry, that meal is no longer available. Please select another meal.";
    }

    return await addMealToOrder(session, menuItem, quantity);
  }

  // Handle meal selection
  if (session.conversationState === "selecting_item") {
    if (!/^\d+$/.test(userMessage)) {
      return "Please select a meal using its menu number.";
    }

    const selectedNumber = Number(userMessage);

    const menuItems = await MenuItem.find({ available: true }).sort({
      name: 1,
    });

    const selectedItem = menuItems[selectedNumber - 1];

    if (!selectedItem) {
      return "Invalid menu number. Please select a meal from the menu.";
    }

    session.pendingMenuItem = selectedItem._id;
    session.conversationState = "awaiting_quantity";
    await session.save();

    return `You selected ${selectedItem.name}.\n\nHow many would you like?`;
  }

  // Handle main chatbot commands
  switch (userMessage) {
    case "1":
      return await getRestaurantMenu(session);

    case "97":
      return await getCurrentOrder(session);

    case "98":
      return await getOrderHistory(session);

    case "99": {
      if (!session.currentOrder) {
        return "No order to place. Please place an order first.";
      }

      const order = await Order.findById(session.currentOrder);

      if (!order || order.status !== "pending" || order.items.length === 0) {
        session.currentOrder = null;
        await session.save();

        return "No order to place. Please place an order first.";
      }

      order.status = "placed";
      order.paymentStatus = "pending";
      await order.save();

      session.currentOrder = null;
      session.conversationState = "main_menu";
      await session.save();

      return `Your order has been placed successfully! 🎉\n\nOrder total: ${formatPrice(order.totalAmount)}\n\nPlease proceed to payment.\n\n${getMainMenu()}`;
    }

    default:
      return `Sorry, I didn't understand that command.\n\n${getMainMenu()}`;
  }
};

module.exports = {
  processMessage,
};
