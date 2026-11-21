
import { useState } from "react";

const COMMANDS = [
  { number: "1", label: "Place an order" },
  { number: "99", label: "Checkout order" },
  { number: "98", label: "Order history" },
  { number: "97", label: "Current order" },
  { number: "0", label: "Cancel order" }
];

export default function ChatPanel({
  inputRef,
  messages = [],
  onSend,
  loading = false
}) {
  const [input, setInput] = useState("");

  const sendMessage = (message) => {
    const text = message.trim();

    if (!text || loading) return;

    onSend?.(text);
    setInput("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="chat">
      <div className="chat-head">
        <div className="avatar">🍽️</div>

        <div>
          <strong>FoodBot Assistant</strong>
          <div className="status">
            <i />
            Online and ready to help
          </div>
        </div>
      </div>

      <div className="chat-list">
        {messages.length === 0 && (
          <div className="row bot">
            <div className="bubble">
              Welcome to FoodBot! 👋
              {"\n\n"}
              I'm here to help you order delicious meals.
              {"\n\n"}
              Choose one of the options below to get started.
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={message.id ?? index}
            className={`row ${message.sender === "user" ? "user" : "bot"}`}
          >
            <div className={`bubble ${message.error ? "err" : ""}`}>
              {message.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="row bot">
            <div className="bubble typing">
              <i />
              <i />
              <i />
            </div>
          </div>
        )}
      </div>

      <div className="quick">
        {COMMANDS.map((command) => (
          <button
            key={command.number}
            type="button"
            disabled={loading}
            onClick={() => sendMessage(command.number)}
          >
            <b>{command.number}</b> {command.label}
          </button>
        ))}
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a message or command..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />

        <button type="submit" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
