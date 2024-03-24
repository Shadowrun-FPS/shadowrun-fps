import React, { useState, useEffect } from "react";

interface TimerProps {
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  status: "start" | "stop";
}

const Timer: React.FC<TimerProps> = ({ timeLeft, setTimeLeft, status }) => {
  useEffect(() => {
    let timerId: NodeJS.Timeout;

    if (status === "start") {
      timerId = setInterval(() => {
        setTimeLeft((prevTimeLeft) => prevTimeLeft - 1);
      }, 1000);
    }

    return () => {
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [status, setTimeLeft]);
  if (timeLeft < 0) {
    return null;
  }
  return <span>{timeLeft}</span>;
};

export default Timer;
