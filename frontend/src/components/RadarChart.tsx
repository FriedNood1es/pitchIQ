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
  // Read per render, not memoized: tokens follow the live theme toggle and
  // this renders rarely enough that caching saves nothing measurable.
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
    <details className="tl-card px-5 py-4">
      <summary className="tl-card-title cursor-pointer">Rating Profile</summary>
      <table className="sr-only">
        <caption>Rating profile values by team</caption>
        <thead>
          <tr>
            <th scope="col">Metric</th>
            {datasets.map((d) => (
              <th key={d.label} scope="col">{d.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((label, i) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              {datasets.map((d) => (
                <td key={d.label}>{d.data[i]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 h-72 sm:h-80">
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
    </details>
  );
}
