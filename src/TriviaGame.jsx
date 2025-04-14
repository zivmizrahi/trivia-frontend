import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("https://trivia-backend.onrender.com"); // Updated to deployed backend URL

export default function TriviaGame() {
  const [players, setPlayers] = useState([]);
  const [question, setQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [scores, setScores] = useState({});
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    socket.on("players", (updatedPlayers) => setPlayers(updatedPlayers));
    socket.on("scores", (updatedScores) => setScores(updatedScores));
    socket.on("newQuestion", (newQ) => {
      setQuestion(newQ);
      setSelectedAnswer(null);
      setAnswers({});
    });
    socket.on("answerSubmitted", (data) => {
      setAnswers((prev) => ({ ...prev, [data.player]: data.answer }));
    });

    // Request the first question on load
    socket.emit("getQuestion");
  }, []);

  const submitAnswer = (option) => {
    if (!selectedAnswer) {
      setSelectedAnswer(option);
      socket.emit("submitAnswer", { answer: option });
    }
  };

  if (!question) return <div className="text-center mt-10">Loading question...</div>;

  return (
    <div className="p-4 max-w-xl mx-auto text-center">
      <h1 className="text-2xl font-bold mb-4">Multiplayer Trivia Game</h1>
      <div className="mb-4 bg-white p-4 rounded shadow">
        <p className="text-lg font-semibold mb-2">{question.question}</p>
        <div className="grid grid-cols-2 gap-2">
          {question.options.map((option) => (
            <button
              key={option}
              onClick={() => submitAnswer(option)}
              disabled={!!selectedAnswer}
              className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <h2 className="font-bold text-lg">Players</h2>
        <ul>
          {players.map((player) => (
            <li key={player}>
              {player} - {scores[player] || 0} points
              {answers[player] && ` (answered)`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
