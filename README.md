
# FoodBot – Restaurant Chatbot

FoodBot is a full-stack restaurant chatbot application that allows customers to browse available meals, place food orders, manage their orders, and make secure online payments through Paystack.

The application provides a conversational ordering experience without requiring customers to create an account.

## Features

- Interactive chatbot interface.
- Automatic customer sessions using unique device IDs.
- Restaurant menu with meal descriptions and prices.
- Place orders and select meal quantities.
- Add multiple meals to one order.
- View current orders.
- View previous orders.
- Cancel pending orders.
- Automatic order total calculation.
- Paystack payment integration.
- Payment verification after checkout.
- MongoDB database integration.
- Responsive frontend design.
- Input validation and error handling.

## Chatbot Commands

| Command | Description |
|---|---|
| `1` | Place an order |
| `99` | Checkout order |
| `98` | View order history |
| `97` | View current order |
| `0` | Cancel current order |

## Technologies Used

### Frontend
- React
- Vite
- JavaScript
- CSS
- HTML

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- Axios

### Payment Integration
- Paystack API (Test Mode)

## Project Structure

```text
restaurant-chatbo/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── seed/
│   │   ├── services/
│   │   └── server.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── public/
│   │   └── foods/
│   ├── src/
│   │   ├── components/
│   │   ├── data/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   └── package.json
│
└── README.md
```

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/codewithsochima/restaurant-chatbot.git
```

Navigate into the project folder:

```bash
cd restaurant-chatbot
```

### 2. Backend Setup

Navigate into the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the backend directory and configure:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
PAYSTACK_SECRET_KEY=your_paystack_test_secret_key
FRONTEND_URL=http://localhost:5173
```

Replace the placeholder values with your actual MongoDB connection string and Paystack test secret key.

**Never upload your `.env` file or expose your secret keys publicly.**

Start the backend server:

```bash
npm run dev
```

The backend runs at:

```text
http://localhost:5000
```

### 3. Frontend Setup

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the frontend development server:

```bash
npm run dev
```

Open the local URL displayed by Vite, usually:

```text
http://localhost:5173
```

## Database Setup

FoodBot uses MongoDB to store:

- Restaurant menu items.
- Customer sessions.
- Customer orders.
- Order quantities and totals.
- Payment references and payment statuses.

To populate the restaurant menu, run the seed script from the backend directory:

```bash
npm run seed
```

## Payment Integration

FoodBot uses the Paystack API to process customer payments.

The payment workflow:

1. Customer creates an order.
2. Customer checks out.
3. FoodBot initializes a Paystack transaction.
4. Customer is redirected to Paystack checkout.
5. Paystack processes the payment.
6. FoodBot verifies the transaction.
7. The customer is redirected back to the chatbot and receives a payment confirmation.

The application uses Paystack Test Mode for development and testing.

## Running the Application

To run FoodBot locally, start both servers:

**Terminal 1 – Backend**

```bash
cd backend
npm run dev
```

**Terminal 2 – Frontend**

```bash
cd frontend
npm run dev
```

Then open the frontend URL in your browser.

## Security

- Customer sessions are identified using unique device IDs.
- Paystack secret keys are stored in environment variables.
- Payment transactions are verified through the backend.
- Customers do not need authentication to use the chatbot.

## Author

**CodeWithSochima**

GitHub: [@codewithsochima](https://github.com/codewithsochima)

## Project

FoodBot – Restaurant Chatbot Application.
