import { Alert, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useMemo } from "react";

interface RiskGaugeProps {
  readonly score: number; // 0-100
  readonly level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export function RiskGauge({ score, level }: RiskGaugeProps) {
  const {
    color,
    bgColor,
    icon: IconComponent,
    label,
  } = useMemo(() => {
    const normalized = Math.max(0, Math.min(100, score));

    switch (level) {
      case "CRITICAL":
        return {
          color: "#ff2d55",
          bgColor: "rgba(255, 45, 85, 0.1)",
          icon: AlertCircle,
          label: "⚠️ CRITICAL",
        };
      case "HIGH":
        return {
          color: "#ff9500",
          bgColor: "rgba(255, 149, 0, 0.1)",
          icon: AlertTriangle,
          label: "🔴 HIGH",
        };
      case "MEDIUM":
        return {
          color: "#ffcc00",
          bgColor: "rgba(255, 204, 0, 0.1)",
          icon: Alert,
          label: "🟡 MEDIUM",
        };
      default: // LOW
        return {
          color: "#34c759",
          bgColor: "rgba(52, 199, 89, 0.1)",
          icon: Info,
          label: "🟢 LOW",
        };
    }
  }, [level]);

  const rotation = (score / 100) * 270 - 135; // Convert 0-100 to gauge rotation

  return (
    <div
      className="flex flex-col items-center gap-4 p-6 rounded-lg border"
      style={{ backgroundColor: bgColor }}
    >
      {/* Circular Gauge */}
      <div className="relative w-32 h-32">
        {/* Background circle */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="4"
          />
          {/* Gauge arc */}
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={`${(score / 100) * 314} 314`}
            strokeDashoffset="0"
            transform="rotate(-90 60 60)"
          />
        </svg>

        {/* Center display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold" style={{ color }}>
            {score.toFixed(0)}
          </div>
          <div className="text-xs text-gray-600">/100</div>
        </div>
      </div>

      {/* Level label */}
      <div className="flex items-center gap-2">
        <IconComponent size={20} color={color} />
        <span className="font-semibold">{label}</span>
      </div>

      {/* Status bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
