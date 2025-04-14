import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const socket = io("https://trivia-oepz.onrender.com");

const Button = ({ children, className = "", ...props }) => (
  <button
    className={`bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-8 text-2xl font-semibold rounded-2xl shadow-md transition duration-300 ease-in-out disabled:opacity-50 ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Card = ({ children }) => (
  <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border border-gray-200 flex flex-col items-center text-center">{children}</div>
);

const CardContent = ({ children }) => <div className="w-full">{children}</div>;

export default function TriviaGame() {
  // ... no changes in logic/code above this point

  const progressPercentage = (questionTimer / 15) * 100;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
      <div className="p-6 max-w-3xl w-full text-center">
        <h1 className="text-4xl font-extrabold mb-6 text-indigo-700">Multiplayer Trivia Game</h1>
        <Card>
          <CardContent>
            <p className="text-2xl font-semibold mb-4 text-gray-800">{question.question}</p>
            <p className="text-base text-gray-500 mb-2">⏳ Time left: {questionTimer}s</p>
            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-indigo-500 transition-all duration-500 ease-linear"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 justify-center">
              {question.options.map((option) => {
                const highlight = showCorrect && option === question.answer ? "bg-green-600" : "";
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
              <p className="mt-8 text-green-700 font-bold text-xl">
                ✅ Correct Answer: {question.answer}
              </p>
            )}
            {countdown !== null && (
              <p className="mt-4 text-base text-indigo-600">
                Next question in {countdown}...
              </p>
            )}
          </CardContent>
        </Card>
        <div className="mb-6">
          <h2 className="font-bold text-2xl text-blue-800 mb-2">Players</h2>
          <ul className="space-y-2">
            {players.map((player) => (
              <li key={player.id} className="text-lg text-gray-700">
                {player.name} - {scores[player.id] || 0} points
                {answers[player.id] && ` (answered)`}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
