import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("https://trivia-oepz.onrender.com");

const Button = ({ children, className = "", ...props }) => (
  <button
    className={`bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Card = ({ children }) => (
  <div className="bg-white rounded shadow p-4 mb-4">{children}</div>
);

const CardContent = ({ children }) => <div>{children}</div>;

export default function TriviaGame() {
  const [players, setPlayers] = useState([]);
  const [question, setQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [scores, setScores] = useState({});
  const [answers, setAnswers] = useState({});
  const [showCorrect, setShowCorrect] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [name, setName] = useState("");
  const [submittedName, setSubmittedName] = useState(false);

  useEffect(() => {
    if (!submittedName) return;

    socket.on("connect", () => {
      console.log("✅ Connected to backend");
      socket.emit("join", name);
      setTimeout(() => socket.emit("getQuestion"), 100);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Connection error:", err.message);
    });

    socket.on("players", (updatedPlayers) => setPlayers(updatedPlayers));
    socket.on("scores", (updatedScores) => setScores(updatedScores));
    socket.on("newQuestion", (newQ) => {
      setQuestion(newQ);
      setSelectedAnswer(null);
      setAnswers({});
      setShowCorrect(false);
      setCountdown(null);
    });

    socket.on("answerSubmitted", (data) => {
      setAnswers((prev) => {
        const updated = { ...prev, [data.player]: data.answer };
        if (Object.keys(updated).length === players.length) {
          setShowCorrect(true);
          let seconds = 3;
          setCountdown(seconds);
          const interval = setInterval(() => {
            seconds -= 1;
            if (seconds === 0) {
              clearInterval(interval);
              setCountdown(null);
              socket.emit("getQuestion");
            } else {
              setCountdown(seconds);
            }
          }, 1000);
        }
        return updated;
      });
    });
  }, [players.length, submittedName]);

  const submitAnswer = (option) => {
    if (!selectedAnswer) {
      setSelectedAnswer(option);
      socket.emit("submitAnswer", { answer: option });
    }
  };

  if (!submittedName) {
    return (
      <div className="p-4 max-w-xl mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">Enter Your Name</h1>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border px-4 py-2 rounded mb-2 w-full"
        />
        <Button onClick={() => name && setSubmittedName(true)}>Start Game</Button>
      </div>
    );
  }

  if (!question) return <div className="text-center mt-10">Loading question...</div>;

  return (
    <div className="p-4 max-w-xl mx-auto text-center">
      <h1 className="text-2xl font-bold mb-4">Multiplayer Trivia Game</h1>
      <Card className="mb-4">
        <CardContent>
          <p className="text-lg font-semibold mb-2">{question.question}</p>
          <div className="grid grid-cols-2 gap-2">
            {question.options.map((option) => {
              const highlight = showCorrect && option === question.answer ? "bg-green-500" : "";
              return (
                <Button
                  key={option}
                  onClick={() => submitAnswer(option)}
                  disabled={!!selectedAnswer}
                  className={highlight}
                >
                  {option}
                </Button>
              );
            })}
          </div>
          {showCorrect && (
            <p className="mt-4 text-green-600 font-semibold">
              ✅ Correct Answer: {question.answer}
            </p>
          )}
          {countdown !== null && (
            <p className="mt-2 text-sm text-gray-500">
              Next question in {countdown}...
            </p>
          )}
        </CardContent>
      </Card>
      <div className="mb-4">
        <h2 className="font-bold text-lg">Players</h2>
        <ul>
          {players.map((player) => (
            <li key={player.id}>
              {player.name} - {scores[player.id] || 0} points
              {answers[player.id] && ` (answered)`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
