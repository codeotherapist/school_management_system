"use client";

import Image from "next/image";
import { Pie, PieChart, ResponsiveContainer } from "recharts";

const MAX_SCORE = 10;

type PerformanceProps = {
  value: number; // average score 0–10
};

const Performance = ({ value }: PerformanceProps) => {
  const clamped = Math.min(Math.max(value, 0), MAX_SCORE);

  const data = [
    { name: "Score", value: clamped, fill: "#C3EBFA" },
    { name: "Rest", value: MAX_SCORE - clamped, fill: "#FAE27C" },
  ];

  return (
    <div className="bg-white p-4 rounded-md h-80 relative">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Performance</h1>
        <Image src="/moreDark.png" alt="" width={16} height={16} />
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            dataKey="value"
            startAngle={180}
            endAngle={0}
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center text */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <h1 className="text-3xl font-bold">{clamped.toFixed(1)}</h1>
        <p className="text-xs text-gray-300">of {MAX_SCORE} max score</p>
      </div>

      <h2 className="font-medium absolute bottom-16 left-0 right-0 m-auto text-center">
        1st Semester - 2nd Semester
      </h2>
    </div>
  );
};

export default Performance;
