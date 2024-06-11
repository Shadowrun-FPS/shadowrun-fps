import React, { useEffect } from "react";

interface TimerProps {
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  status: "start" | "stop";
}

const ReadyTimer: React.FC<TimerProps> = ({
  timeLeft,
  setTimeLeft,
  status,
}) => {
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
  return <span>You have {timeLeft} seconds to mark yourself as ready.</span>;
};

export default ReadyTimer;
