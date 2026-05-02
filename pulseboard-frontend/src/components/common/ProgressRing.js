import React from "react";

export default function ProgressRing({ percentage = 0, size = 120, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const center = size / 2;

  // Color based on percentage
  let color = "#ef4444";
  if (percentage >= 75) color = "#22c55e";
  else if (percentage >= 40) color = "#00f0ff";
  else if (percentage >= 20) color = "#fb923c";

  return (
    <div className="progress-ring-container" style={{ width: size, height: size }}>
      <svg className="progress-ring-svg" width={size} height={size}>
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <circle
          className="progress-ring-bg"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="progress-ring-fill"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="url(#ringGradient)"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            filter: `drop-shadow(0 0 6px ${color}40)`,
          }}
        />
      </svg>
      <span className="progress-ring-text">{percentage}%</span>
    </div>
  );
}
