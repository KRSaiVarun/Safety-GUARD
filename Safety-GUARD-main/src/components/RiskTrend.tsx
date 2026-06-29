import { RiskDetails } from "@/types";
import { TrendingUp } from "lucide-react";
import { useMemo } from "react";

interface RiskTrendProps {
  readonly history: RiskDetails[];
  readonly maxPoints?: number;
}

export function RiskTrend({ history, maxPoints = 20 }: RiskTrendProps) {
  const data = useMemo(() => {
    // Take most recent points
    const recent = history.slice(0, maxPoints).reverse();
    return recent;
  }, [history, maxPoints]);

  if (data.length === 0) {
    return (
      <div className="p-6 rounded-lg border bg-gray-50 text-center text-gray-500">
        <p>No risk history data available</p>
      </div>
    );
  }

  const minScore = Math.min(...data.map((d) => d.score));
  const maxScore = Math.max(...data.map((d) => d.score));
  const range = Math.max(maxScore - minScore, 20); // Ensure minimum range for visualization

  // Create SVG line path
  const points = data.map((_, idx) => {
    const x = (idx / (data.length - 1)) * 100;
    const normalized = (data[idx].score - minScore) / range;
    const y = 100 - normalized * 80; // Leave 10% margin top/bottom
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;

  return (
    <div className="flex flex-col gap-4 p-6 rounded-lg border bg-white">
      <div className="flex items-center gap-2">
        <TrendingUp size={20} className="text-blue-600" />
        <h3 className="font-semibold">Risk Trend</h3>
      </div>

      {/* Chart */}
      <svg
        className="w-full h-48 bg-gray-50 rounded"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        <line
          x1="0"
          y1="20"
          x2="100"
          y2="20"
          stroke="#e5e7eb"
          strokeWidth="0.5"
        />
        <line
          x1="0"
          y1="40"
          x2="100"
          y2="40"
          stroke="#e5e7eb"
          strokeWidth="0.5"
        />
        <line
          x1="0"
          y1="60"
          x2="100"
          y2="60"
          stroke="#e5e7eb"
          strokeWidth="0.5"
        />
        <line
          x1="0"
          y1="80"
          x2="100"
          y2="80"
          stroke="#e5e7eb"
          strokeWidth="0.5"
        />

        {/* Path */}
        <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="1" />

        {/* Data points */}
        {points.map((point, idx) => {
          const [x, y] = point.split(",").map(Number);
          const score = data[idx].score;
          const level = data[idx].level;

          const color =
            level === "CRITICAL"
              ? "#ff2d55"
              : level === "HIGH"
                ? "#ff9500"
                : level === "MEDIUM"
                  ? "#ffcc00"
                  : "#34c759";

          return (
            <circle
              key={idx}
              cx={x}
              cy={y}
              r="1.5"
              fill={color}
              className="hover:r-3 transition-all cursor-pointer"
            >
              <title>{`${score.toFixed(1)} (${level})`}</title>
            </circle>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "#34c759" }}
          />
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "#ffcc00" }}
          />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "#ff9500" }}
          />
          <span>High</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "#ff2d55" }}
          />
          <span>Critical</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t text-xs">
        <div>
          <div className="text-gray-600">Min</div>
          <div className="font-semibold">{minScore.toFixed(0)}</div>
        </div>
        <div>
          <div className="text-gray-600">Max</div>
          <div className="font-semibold">{maxScore.toFixed(0)}</div>
        </div>
        <div>
          <div className="text-gray-600">Latest</div>
          <div className="font-semibold">
            {data[data.length - 1].score.toFixed(0)}
          </div>
        </div>
      </div>
    </div>
  );
}
