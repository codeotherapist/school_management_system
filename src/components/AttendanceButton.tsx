

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

type AttendanceButtonProps = {
  initial?: boolean;
  onToggle?: (present: boolean) => void;
};

export function AttendanceButton({ initial = false, onToggle }: AttendanceButtonProps) {
  const [present, setPresent] = useState(initial);

  const handleClick = () => {
    const newState = !present;
    setPresent(newState);
    if (onToggle) onToggle(newState);
  };

  return (
    <Button
      onClick={handleClick}
      className={present ? "bg-green-600 text-white hover:bg-green-700" : "bg-red-600 text-white hover:bg-red-700"}
    >
      {present ? "Present" : "Absent"}
    </Button>
  );
}