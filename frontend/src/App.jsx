
import { useEffect, useRef, useState } from "react";
import FoodShowcase from "./components/FoodShowcase";
import ChatPanel from "./components/ChatPanel";
import { FOODS, formatPrice } from "./data/foods";
import {
  sendChatMessage,
  initializePayment,
  verifyPayment,
} from "./services/chatService";
import "./App.css";

const INTERVAL = 2000;

export default function App() {
  const [tick, setTick] = useState(0);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentRequired, setPaymentRequired] = useState(false);

  const chatInput = useRef(null);
  const chatWrap = useRef(null);
  const welcomeRequested = useRef(false);
  const paymentCallbackHandled = useRef(false);

  const foodCount = FOODS.length;
  const food = FOODS[tick % foodCount];

  // Automatically welcome the customer when FoodBot opens.
  useEffect(() => {
    if (welcomeRequested.current) return;

    welcomeRequested.current = true;

    const loadWelcomeMessage = async () => {
      try {
        const reply = await sendChatMessage("WELCOME");

        setMessages([
          {
            id: Date.now(),
            sender: "bot",
            text: reply,
          },
        ]);
      } catch (error) {
        setMessages([
          {
            id: Date.now(),
            sender: "bot",
            text: error.message,
            error: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadWelcomeMessage();
  }, []);

  // Verify payment when Paystack redirects the customer back.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("payment") !== "callback") return;
    if (paymentCallbackHandled.current) return;

    paymentCallbackHandled.current = true;

    const reference = params.get("reference");

    // Remove payment details from the browser address bar.
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );

    const checkPayment = async () => {
      setLoading(true);

      if (!reference) {
        setMessages((current) => [
          ...current,
          {
            id: Date.now(),
            sender: "bot",
            text: "We couldn't find your payment reference. Please contact the restaurant.",
            error: true,
          },
        ]);

        setLoading(false);
        return;
      }

      try {
        const result = await verifyPayment(reference);

        setPaymentRequired(false);

        setMessages((current) => [
          ...current,
          {
            id: Date.now() + 1,
            sender: "bot",
            text: result.message,
          },
        ]);
      } catch (error) {
        setMessages((current) => [
          ...current,
          {
            id: Date.now() + 1,
            sender: "bot",
            text: error.message,
            error: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    checkPayment();
  }, []);

  // Rotate food images every two seconds.
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((current) => (current + 1) % foodCount);
    }, INTERVAL);

    return () => clearInterval(timer);
  }, [foodCount]);

  const selectFood = (index) => {
    setTick(index);
  };

  // Scroll to the chatbot when the customer starts ordering.
  const startOrder = () => {
    chatWrap.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    chatInput.current?.focus({ preventScroll: true });
  };

  // Send customer messages to the backend.
  const handleSend = async (message) => {
    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: message,
    };

    setMessages((current) => [...current, userMessage]);
    setLoading(true);

    try {
      const reply = await sendChatMessage(message);

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: reply,
        },
      ]);

      // Show the payment email form after checkout.
      if (
        message.trim() === "99" &&
        reply.includes("Please proceed to payment.")
      ) {
        setPaymentRequired(true);
      } else if (message.trim() === "0") {
        setPaymentRequired(false);
      }
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: error.message,
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Initialize payment and redirect the customer to Paystack.
  const handlePayment = async (email) => {
    setLoading(true);

    try {
      const result = await initializePayment(email);

      window.location.assign(result.authorizationUrl);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: error.message,
          error: true,
        },
      ]);

      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <span className="brand">FOODBOT</span>

        <nav className="chips">
          <span className="on">Explore our menu</span>
          <span>Freshly prepared</span>
          <span>Simple ordering</span>
          <span>Secure payments</span>
        </nav>
      </header>

      <main className="stage">
        <section className="intro">
          <svg
            className="blob"
            viewBox="0 0 600 800"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M0 0H430C470 40 560 20 580 100C600 180 520 200 540 280C560 360 600 400 540 470C480 540 420 520 400 600C380 680 300 760 200 740C120 725 80 700 0 720Z" />
          </svg>

          <div className="intro-body">
            <h1>Delicious meals. Easy ordering.</h1>

            <p className="lead">
              Discover delicious meals, explore our menu and
              place your order through our smart restaurant
              assistant. Your next favourite meal is just a
              conversation away.
            </p>

            <h2>
              {food.name}
              <span>({formatPrice(food.price)})</span>
            </h2>

            <p className="small">{food.description}</p>

            <div className="thumbs">
              {FOODS.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={item.id === food.id ? "on" : ""}
                  onClick={() => selectFood(index)}
                  aria-label={`Show ${item.name}`}
                  title={item.name}
                >
                  {item.image ? (
                    <img src={item.image} alt={item.name} />
                  ) : (
                    <span>🍽️</span>
                  )}
                </button>
              ))}
            </div>

            <span className="pill">Click to Select Food ↑</span>
          </div>
        </section>

        <section className="showcase-wrap">
          <FoodShowcase foods={FOODS} tick={tick} />

          <button
            type="button"
            className="cta"
            onClick={startOrder}
          >
            Start Your Order
          </button>
        </section>

        <section className="chat-wrap" ref={chatWrap}>
          <ChatPanel
            inputRef={chatInput}
            messages={messages}
            onSend={handleSend}
            onPay={handlePayment}
            paymentRequired={paymentRequired}
            loading={loading}
          />
        </section>
      </main>
    </div>
  );
}
