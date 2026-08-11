import {
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from "chart.js";
import { Radar } from "react-chartjs-2";
import { RadarDataset } from "../types";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

/** Read a resolved CSS token so the chart matches the active (dark/light) theme. */
function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

interface Props {
  labels: string[];
  datasets: RadarDataset[];
}

// 33 = ~20% alpha for the area wash.
export function RadarChart({ labels, datasets }: Props) {
  const series = [token("--team-a"), token("--team-b")];
  const grid = token("--grid");
  const text2 = token("--text-2");
  const muted = token("--muted");

  const data = {
    labels,
    datasets: datasets.map((dataset, i) => ({
      label: dataset.label,
      data: dataset.data,
      borderColor: series[i % series.length],
      backgroundColor: `${series[i % series.length]}33`,
      pointBackgroundColor: series[i % series.length],
      borderWidth: 2,
      pointRadius: 3,
    })),
  };

  return (
    <div className="tl-card p-5">
      <h2 className="tl-card-title mb-2">Rating Profile</h2>
      <div className="h-96">
        <Radar
          data={data}
          options={{
            maintainAspectRatio: false,
            scales: {
              r: {
                suggestedMin: 0,
                suggestedMax: 100,
                grid: { color: grid },
                angleLines: { color: grid },
                pointLabels: { color: text2, font: { size: 12, weight: 600 } },
                ticks: { color: muted, backdropColor: "transparent", showLabelBackdrop: false, stepSize: 25 },
              },
            },
            plugins: {
              legend: { labels: { color: text2, usePointStyle: true, boxWidth: 8 } },
            },
          }}
        />
      </div>
    </div>
  );
}
