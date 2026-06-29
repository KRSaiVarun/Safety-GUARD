import { RiskDetails } from "@/types";
import { Info } from "lucide-react";

interface RiskFactorsCardProps {
  readonly factors: RiskDetails["factors"];
}

const FACTOR_DESCRIPTIONS: Record<
  keyof RiskDetails["factors"],
  { label: string; max: number; description: string }
> = {
  time_of_day: {
    label: "Time of Day",
    max: 25,
    description: "Higher risk during night hours (22:00-06:00)",
  },
  unsafe_area: {
    label: "Unsafe Area",
    max: 25,
    description: "User currently in unsafe geofence zone",
  },
  inactivity: {
    label: "Inactivity",
    max: 15,
    description: "No location updates for extended period",
  },
  emergency_frequency: {
    label: "Emergency Frequency",
    max: 15,
    description: "Multiple emergencies in 24 hours",
  },
  battery_level: {
    label: "Battery Level",
    max: 10,
    description: "Device battery critically low (<20%)",
  },
  network_status: {
    label: "Network Status",
    max: 10,
    description: "Poor or unstable connection",
  },
};

export function RiskFactorsCard({ factors }: RiskFactorsCardProps) {
  const entries = Object.entries(factors) as [
    keyof RiskDetails["factors"],
    number,
  ][];

  return (
    <div className="flex flex-col gap-4 p-6 rounded-lg border bg-white">
      <div className="flex items-center gap-2">
        <Info size={20} className="text-blue-600" />
        <h3 className="font-semibold">Risk Factors</h3>
      </div>

      <div className="flex flex-col gap-4">
        {entries.map(([key, value]) => {
          const config = FACTOR_DESCRIPTIONS[key];
          const percentage = (value / config.max) * 100;

          return (
            <div key={key} className="flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium">{config.label}</p>
                  <p className="text-xs text-gray-600">{config.description}</p>
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  {value.toFixed(1)}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor:
                      percentage > 80
                        ? "#ff2d55"
                        : percentage > 60
                          ? "#ff9500"
                          : percentage > 40
                            ? "#ffcc00"
                            : "#34c759",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Total factors */}
      <div className="pt-4 border-t">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Total Factor Points</span>
          <span className="font-semibold">
            {Object.values(factors)
              .reduce((a, b) => a + b, 0)
              .toFixed(1)}{" "}
            / 100
          </span>
        </div>
      </div>
    </div>
  );
}
