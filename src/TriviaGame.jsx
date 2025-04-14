import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { io } from "socket.io-client";

const socket = io("https://trivia-oepz.onrender.com"); // Updated to your actual deployed backend URL

export default function TriviaGame() {
  const [players, setPlayers] = useState([]);
  const [question, setQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [scores, setScores] = useState({});
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ Connected to backend");
      socket.emit("getQuestion");
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
    });
    socket.on("answerSubmitted", (data) => {
      setAnswers((prev) => ({ ...prev, [data.player]: data.answer }));
    });
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
      <Card className="mb-4">
        <CardContent>
          <p className="text-lg font-semibold mb-2">
            {question.question}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {question.options.map((option) => (
              <Button
                key={option}
                onClick={() => submitAnswer(option)}
                disabled={!!selectedAnswer}
              >
                {option}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
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
