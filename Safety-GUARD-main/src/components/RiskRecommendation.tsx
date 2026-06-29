import { AlertCircle, AlertTriangle, Lightbulb } from "lucide-react";

interface RiskRecommendationProps {
  readonly recommendation: string;
  readonly level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export function RiskRecommendation({
  recommendation,
  level,
}: RiskRecommendationProps) {
  const {
    icon: IconComponent,
    bgColor,
    borderColor,
    textColor,
  } = {
    CRITICAL: {
      icon: AlertCircle,
      bgColor: "rgba(255, 45, 85, 0.1)",
      borderColor: "#ff2d55",
      textColor: "#c41e3a",
    },
    HIGH: {
      icon: AlertTriangle,
      bgColor: "rgba(255, 149, 0, 0.1)",
      borderColor: "#ff9500",
      textColor: "#b85d00",
    },
    MEDIUM: {
      icon: AlertTriangle,
      bgColor: "rgba(255, 204, 0, 0.1)",
      borderColor: "#ffcc00",
      textColor: "#b39d00",
    },
    LOW: {
      icon: Lightbulb,
      bgColor: "rgba(52, 199, 89, 0.1)",
      borderColor: "#34c759",
      textColor: "#0a7e3a",
    },
  }[level];

  return (
    <div
      className="flex gap-3 p-4 rounded-lg border"
      style={{ backgroundColor: bgColor, borderColor, borderWidth: 1 }}
    >
      <IconComponent size={20} style={{ color: borderColor, flexShrink: 0 }} />
      <p style={{ color: textColor }} className="text-sm font-medium">
        {recommendation}
      </p>
    </div>
  );
}
