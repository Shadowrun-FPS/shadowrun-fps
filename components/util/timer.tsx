import React, { useState, useEffect } from "react";

interface TimerProps {
  initialCount: number;
  status: "start" | "stop";
}

const Timer: React.FC<TimerProps> = ({ initialCount, status }) => {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    let timerId: NodeJS.Timeout;

    if (status === "start") {
      timerId = setInterval(() => {
        setCount((prevCount) => prevCount - 1);
      }, 1000);
    }

    return () => {
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [status]);

  return <span>{count}</span>;
};

export default Timer;
