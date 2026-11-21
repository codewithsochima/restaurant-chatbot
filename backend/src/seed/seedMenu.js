
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const MenuItem = require("../models/menuItem");

// Restaurant menu
const menuItems = [
  {
    name: "Jollof Rice",
    description: "Delicious Nigerian party jollof rice",
    price: 3500,
    category: "Rice",
    available: true,
  },
  {
    name: "Fried Rice",
    description: "Tasty Nigerian fried rice",
    price: 4000,
    category: "Rice",
    available: true,
  },
  {
    name: "White Rice and Stew",
    description: "White rice served with tomato stew",
    price: 3000,
    category: "Rice",
    available: true,
  },
  {
    name: "Grilled Chicken",
    description: "Well-seasoned grilled chicken",
    price: 2500,
    category: "Protein",
    available: true,
  },
  {
    name: "Fried Turkey",
    description: "Crispy fried turkey",
    price: 4500,
    category: "Protein",
    available: true,
  },
  {
    name: "Beef",
    description: "Deliciously seasoned beef",
    price: 1500,
    category: "Protein",
    available: true,
  },
  {
    name: "Beef Burger",
    description: "Burger with beef and fresh vegetables",
    price: 5000,
    category: "Fast Food",
    available: true,
  },
  {
    name: "Shawarma",
    description: "Chicken shawarma with creamy sauce",
    price: 4000,
    category: "Fast Food",
    available: true,
  },
  {
    name: "Soft Drink",
    description: "Chilled soft drink",
    price: 500,
    category: "Drinks",
    available: true,
  },
  {
    name: "Fresh Juice",
    description: "Freshly prepared fruit juice",
    price: 2000,
    category: "Drinks",
    available: true,
  },
];

// Save menu items to MongoDB
const seedMenu = async () => {
  try {
    await connectDB();

    for (const item of menuItems) {
      await MenuItem.updateOne(
        { name: item.name },
        { $set: item },
        { upsert: true }
      );
    }

    console.log("Restaurant menu added successfully!");
    console.log(`${menuItems.length} menu items available.`);
  } catch (error) {
    console.error("Error adding restaurant menu:", error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
};

seedMenu();
