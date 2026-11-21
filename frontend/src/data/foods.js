
export const FOODS = [
  {
    id: 1,
    name: "Jollof Rice",
    price: 3500,
    image: "/foods/jollof-rice.jpg",
    description: "Delicious Nigerian jollof rice."
  },
  {
    id: 2,
    name: "Fried Rice",
    price: 4000,
    image: "/foods/fried-rice.jpg",
    description: "Freshly prepared fried rice."
  },
  {
    id: 3,
    name: "Grilled Chicken",
    price: 2500,
    image: "/foods/grilled-chicken.jpg",
    description: "Juicy and flavourful grilled chicken."
  },
  {
    id: 4,
    name: "Beef Burger",
    price: 5000,
    image: "/foods/beef-burger.jpg",
    description: "A delicious, freshly prepared burger."
  },
  {
    id: 5,
    name: "Shawarma",
    price: 4000,
    image: "/foods/shawarma.jpg",
    description: "Tasty chicken shawarma."
  },
  {
    id: 6,
    name: "Fresh Juice",
    price: 2000,
    image: null,
    description: "Refreshing fresh fruit juice."
  },
  {
    id: 7,
    name: "Fried Turkey",
    price: 4500,
    image: "/foods/fried-turkey.jpg",
    description: "Delicious fried turkey."
  },
  {
    id: 8,
    name: "White Rice and Stew",
    price: 3000,
    image: null,
    description: "White rice served with tasty stew."
  },
  {
    id: 9,
    name: "Beef",
    price: 1500,
    image: null,
    description: "Tasty beef serving."
  },
  {
    id: 10,
    name: "Soft Drink",
    price: 500,
    image: "/foods/soft-drink.jpg",
    description: "A refreshing soft drink."
  }
];

export const formatPrice = (price) =>
  `₦${price.toLocaleString("en-NG")}`;
