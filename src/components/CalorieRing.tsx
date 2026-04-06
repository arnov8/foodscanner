"use client";

interface Props {
  consumed: number;
  goal: number;
  label: string;
  color: string;
  size?: number;
}

export default function CalorieRing({
  consumed,
  goal,
  label,
  color,
  size = 120,
}: Props) {
  const percentage = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0;
  const radius = (size - 14) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const isOver = consumed > goal;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(0,0,0,0.05)"
            strokeWidth="10"
          />
          {/* Glow effect */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={isOver ? "#ef4444" : color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700"
            style={{
              filter: `drop-shadow(0 0 6px ${isOver ? "rgba(239,68,68,0.4)" : color + "55"})`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-bold tracking-tight ${isOver ? "text-red-500" : "text-gray-800"}`}
            style={{ fontSize: size > 100 ? "1.5rem" : "1rem" }}
          >
            {Math.round(consumed)}
          </span>
          <span
            className="text-gray-400 font-medium"
            style={{ fontSize: size > 100 ? "0.7rem" : "0.6rem" }}
          >
            / {goal}
          </span>
        </div>
      </div>
      <span className="text-xs font-semibold text-gray-500 tracking-wide">
        {label}
      </span>
    </div>
  );
}
