/**
 * File: src/components/NeuralChart.tsx
 * Role: Modern Black & Emerald Latency Telemetry Chart
 */

import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { Activity, FileCode } from 'lucide-react';

Chart.register(...registerables);

interface NeuralChartProps {
  activePath: string | null;
  latencyHistory: number[];
  latestLatency: number;
}

export const NeuralChart: React.FC<NeuralChartProps> = ({
  activePath,
  latencyHistory,
  latestLatency,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Create modern emerald gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 220);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const labels = Array(latencyHistory.length).fill('');

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Latency (ms)',
            data: [...latencyHistory],
            borderColor: '#10b981',
            borderWidth: 2,
            backgroundColor: gradient,
            fill: true,
            tension: 0.35,
            pointRadius: (context) => {
              const index = context.dataIndex;
              const count = context.dataset.data.length;
              return index === count - 1 ? 5 : 2;
            },
            pointBackgroundColor: '#34d399',
            pointBorderColor: '#064e3b',
            pointBorderWidth: 1.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 250,
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#070e0a',
            titleColor: '#10b981',
            bodyColor: '#e2f7ea',
            borderColor: 'rgba(16, 185, 129, 0.3)',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: (context) => `${context.parsed.y} ms`,
            },
          },
        },
        scales: {
          x: {
            display: false,
            grid: { display: false },
          },
          y: {
            display: true,
            position: 'right',
            suggestedMin: 0,
            suggestedMax: 1500,
            grid: {
              color: 'rgba(16, 185, 129, 0.08)',
            },
            ticks: {
              color: 'rgba(52, 211, 153, 0.7)',
              font: { size: 10, family: 'monospace' },
              callback: (value) => `${value}ms`,
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  // Update chart data whenever latencyHistory changes
  useEffect(() => {
    if (chartInstanceRef.current && chartInstanceRef.current.data.datasets[0]) {
      chartInstanceRef.current.data.labels = Array(latencyHistory.length).fill('');
      chartInstanceRef.current.data.datasets[0].data = [...latencyHistory];
      chartInstanceRef.current.update('none');
    }
  }, [latencyHistory]);

  const maxVal = Math.max(...latencyHistory, 0);
  const minVal = latencyHistory.filter((v) => v > 0).length
    ? Math.min(...latencyHistory.filter((v) => v > 0))
    : 0;

  return (
    <div
      id="emg-neural-chart"
      className="cyber-card p-5 md:p-6 rounded-2xl flex flex-col gap-4 bg-[#070e0a]/80 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-950 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-tight">
            Neural Latency Stream
          </h3>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-zinc-400">
            Min: <strong className="text-emerald-300 font-semibold">{minVal}ms</strong>
          </span>
          <span className="text-zinc-400">
            Peak: <strong className="text-amber-300 font-semibold">{maxVal}ms</strong>
          </span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-bold text-[11px]">
            Live: {latestLatency}ms
          </span>
        </div>
      </div>

      {activePath && (
        <div className="flex items-center gap-2 text-xs font-mono bg-[#050b07] border border-emerald-900/60 px-3.5 py-2 rounded-xl text-zinc-200">
          <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-zinc-400 font-semibold">TARGET:</span>
          <span className="text-zinc-200 font-medium truncate">{activePath}</span>
        </div>
      )}

      <div className="w-full h-44 md:h-52 relative">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};
