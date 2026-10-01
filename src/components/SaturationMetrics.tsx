/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-132 [2026-09-20T06:00:00.000Z] */
/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/components/SaturationMetrics.tsx
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import React, { memo } from 'react';
import type { SaturationMetrics } from '@/lib/types';
import { COLORS, SATURATION_THRESHOLDS } from '@/lib/constants';
import { BarChart3 } from 'lucide-react';

export interface SaturationMetricsPanelProps {
  readonly metrics: SaturationMetrics | null | undefined;
}

interface MetricConfig {
  readonly key: keyof SaturationMetrics;
  readonly label: string;
  readonly max: number;
  readonly warning: number;
  readonly critical: number;
  readonly format: (val: number) => string;
  readonly inverted?: boolean;
}

const METRIC_CONFIGS: readonly MetricConfig[] = [
  {
    key: 'structuralChange',
    label: 'STRUCTURAL CHANGE',
    max: SATURATION_THRESHOLDS.structuralChange.max,
    warning: SATURATION_THRESHOLDS.structuralChange.warning,
    critical: SATURATION_THRESHOLDS.structuralChange.critical,
    format: (v: number): string => `${v.toFixed(1)}/5`,
  },
  {
    key: 'semanticSaturation',
    label: 'SEMANTIC SATURATION',
    max: SATURATION_THRESHOLDS.semanticSaturation.max,
    warning: SATURATION_THRESHOLDS.semanticSaturation.warning,
    critical: SATURATION_THRESHOLDS.semanticSaturation.critical,
    format: (v: number): string => `${v.toFixed(3)}/0.35`,
  },
  {
    key: 'velocity',
    label: 'VELOCITY',
    max: SATURATION_THRESHOLDS.velocity.max,
    warning: SATURATION_THRESHOLDS.velocity.warning,
    critical: SATURATION_THRESHOLDS.velocity.critical,
    format: (v: number): string => `${v.toFixed(1)}/5`,
  },
  {
    key: 'identityPreservation',
    label: 'IDENTITY PRESERVATION',
    max: SATURATION_THRESHOLDS.identityPreservation.max,
    warning: SATURATION_THRESHOLDS.identityPreservation.warning,
    critical: SATURATION_THRESHOLDS.identityPreservation.critical,
    format: (v: number): string => `${v.toFixed(2)}/1`,
    inverted: true,
  },
  {
    key: 'capabilityAlignment',
    label: 'CAPABILITY ALIGNMENT',
    max: SATURATION_THRESHOLDS.capabilityAlignment.max,
    warning: SATURATION_THRESHOLDS.capabilityAlignment.warning,
    critical: SATURATION_THRESHOLDS.capabilityAlignment.critical,
    format: (v: number): string => `${v.toFixed(1)}/5`,
  },
  {
    key: 'crossFileImpact',
    label: 'CROSS-FILE IMPACT',
    max: SATURATION_THRESHOLDS.crossFileImpact.max,
    warning: SATURATION_THRESHOLDS.crossFileImpact.warning,
    critical: SATURATION_THRESHOLDS.crossFileImpact.critical,
    format: (v: number): string => `${v.toFixed(1)}/3`,
  },
] as const;

const LABEL_STYLE = {
  fontSize: '8px',
  color: COLORS.textMuted,
  fontFamily: 'var(--font-orbitron), sans-serif',
  letterSpacing: '0.1em',
} as const;

const STATUS_STYLE_BASE = {
  fontSize: '7px',
  fontFamily: 'var(--font-orbitron), sans-serif',
  letterSpacing: '0.05em',
} as const;

const VALUE_STYLE_BASE = {
  fontSize: '10px',
  fontWeight: 600,
} as const;

const PANEL_CONTAINER_CLASS = 'dalek-panel rounded-lg p-4 space-y-4';

function resolveMetricColor(
  value: number,
  warning: number,
  critical: number,
  inverted?: boolean
): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  
  if (inverted) {
    if (safeValue <= critical) return COLORS.dalekRed;
    if (safeValue <= warning) return COLORS.gold;
    return COLORS.cyan;
  }

  if (safeValue >= critical) return COLORS.dalekRed;
  if (safeValue >= warning) return COLORS.gold;
  return COLORS.cyan;
}

function resolveStatusLabel(
  value: number,
  warning: number,
  critical: number,
  inverted?: boolean
): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  
  if (inverted) {
    if (safeValue <= critical) return '[CRITICAL]';
    if (safeValue <= warning) return '[WARNING]';
    return '[OK]';
  }

  if (safeValue >= critical) return '[OVER THRESHOLD]';
  if (safeValue >= warning) return '[WARNING]';
  return '[OK]';
}

interface PanelHeaderProps {
  readonly title: string;
}

const PanelHeader = memo(function PanelHeader({ title }: PanelHeaderProps) {
  return (
    <div className="dalek-panel-header py-2 px-1 flex items-center gap-2">
      <BarChart3 size={14} style={{ color: COLORS.dalekRed }} />
      <span style={{ fontSize: '11px' }}>{title}</span>
    </div>
  );
});

interface MetricBarProps {
  readonly config: MetricConfig;
  readonly rawValue: unknown;
}

const MetricBar = memo(function MetricBar({ config, rawValue }: MetricBarProps) {
  const value = typeof rawValue === 'number' && Number.isFinite(rawValue) ? rawValue : 0;
  const denominator = config.max > 0 ? config.max : 1;
  const percentage = Math.min(100, Math.max(0, (value / denominator) * 100));
  const barColor = resolveMetricColor(value, config.warning, config.critical, config.inverted);
  const statusLabel = resolveStatusLabel(value, config.warning, config.critical, config.inverted);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span style={LABEL_STYLE}>
          {config.label}
        </span>
        <div className="flex items-center gap-2">
          <span style={{ ...STATUS_STYLE_BASE, color: barColor }}>
            {statusLabel}
          </span>
          <span style={{ ...VALUE_STYLE_BASE, color: barColor }}>
            {config.format(value)}
          </span>
        </div>
      </div>
      <div className="dalek-progress rounded-sm h-2">
        <div
          className="dalek-progress-fill h-full rounded-sm transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: barColor,
            boxShadow: `0 0 6px ${barColor}40`,
          }}
        />
      </div>
    </div>
  );
});

function SaturationMetricsPanelComponent({ metrics }: SaturationMetricsPanelProps) {
  if (!metrics) {
    return (
      <div className={PANEL_CONTAINER_CLASS}>
        <PanelHeader title="COGNITIVE DOMINANCE METRICS" />
        <div style={{ fontSize: '10px', color: COLORS.textMuted }}>NO METRICS DATA AVAILABLE</div>
      </div>
    );
  }

  return (
    <div className={PANEL_CONTAINER_CLASS}>
      <PanelHeader title="COGNITIVE DOMINANCE METRICS" />
      <div className="space-y-3">
        {METRIC_CONFIGS.map((config) => (
          <MetricBar 
            key={config.key} 
            config={config} 
            rawValue={metrics[config.key]} 
          />
        ))}
      </div>
    </div>
  );
}

export const SaturationMetricsPanel = memo(SaturationMetricsPanelComponent);
export default SaturationMetricsPanel;

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 130,
  timestamp: "2026-09-20T06:00:00.000Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});