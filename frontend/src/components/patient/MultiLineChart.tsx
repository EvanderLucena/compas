import { useState, useRef } from 'react';
import type { BiometricEntry } from '../../types/patient';

interface MultiLineChartProps {
  data: BiometricEntry[];
  metrics: { key: string; color: string; label: string; unit: string }[];
}

export function MultiLineChart({ data, metrics }: MultiLineChartProps) {
  const width = 900;
  const height = 200;
  const padL = 36;
  const padR = 12;
  const padT = 8;
  const padB = 24;
  const w = width - padL - padR;
  const h = height - padT - padB;
  const n = data.length;
  const step = n > 1 ? w / (n - 1) : w;
  const [hover, setHover] = useState<{ idx: number; mx: number; my: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const series = metrics.map((m) => {
    const vals = data.map((d) => d[m.key as keyof BiometricEntry] as number);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;
    const pts = vals.map(
      (v, i) => [padL + i * step, padT + h - ((v - min) / range) * h] as [number, number],
    );
    return { ...m, pts, vals, min, max };
  });

  const path = (pts: [number, number][]) =>
    pts
      .map((p, i) =>
        i === 0
          ? `M${p[0].toFixed(1)},${p[1].toFixed(1)}`
          : `L${p[0].toFixed(1)},${p[1].toFixed(1)}`,
      )
      .join(' ');

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!svgRef.current || !wrapRef.current) return;
    const svgRect = svgRef.current.getBoundingClientRect();
    const wrapRect = wrapRef.current.getBoundingClientRect();
    const svgX = (e.clientX - svgRect.left) * (width / svgRect.width);
    const idx = Math.round((svgX - padL) / step);
    const mx = e.clientX - wrapRect.left;
    const my = e.clientY - wrapRect.top;
    if (idx >= 0 && idx < n) setHover({ idx, mx, my });
    else setHover(null);
  };

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHover(null)}
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ display: 'block', maxWidth: '100%', cursor: 'crosshair' }}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
          <line
            key={i}
            x1={padL}
            x2={padL + w}
            y1={padT + t * h}
            y2={padT + t * h}
            stroke="var(--border)"
            strokeDasharray="1 3"
          />
        ))}
        {data.map((d, i) => (
          <text
            key={i}
            x={padL + i * step}
            y={height - 6}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="9.5"
            fill="var(--fg-subtle)"
          >
            {d.date}
          </text>
        ))}
        {series.map((m) => (
          <g key={m.key}>
            <path
              d={path(m.pts)}
              stroke={m.color}
              strokeWidth="2"
              fill="none"
              strokeLinejoin="round"
            />
            {m.pts.map((p, i) => (
              <circle key={i} cx={p[0]} cy={p[1]} r={hover?.idx === i ? 5 : 3} fill={m.color} />
            ))}
          </g>
        ))}
        {hover && (
          <line
            x1={padL + hover.idx * step}
            x2={padL + hover.idx * step}
            y1={padT}
            y2={padT + h}
            stroke="var(--fg)"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.4"
          />
        )}
      </svg>

      {hover && (
        <div
          style={{
            position: 'absolute',
            left: hover.mx + 14,
            top: hover.my - 10,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
            padding: '10px 13px',
            pointerEvents: 'none',
            zIndex: 10,
            whiteSpace: 'nowrap',
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: 10,
              color: 'var(--fg-subtle)',
              marginBottom: 8,
              letterSpacing: '0.06em',
            }}
          >
            {data[hover.idx].date}
          </div>
          {series.map((m) => (
            <div
              key={m.key}
              style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: m.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 12, color: 'var(--fg-muted)', flex: 1 }}>{m.label}</span>
              <span className="mono tnum" style={{ fontSize: 13, fontWeight: 600, color: m.color }}>
                {m.vals[hover.idx]}
                {m.unit}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, paddingLeft: padL, paddingTop: 8, flexWrap: 'wrap' }}>
        {series.map((m) => (
          <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
            <span
              style={{
                width: 10,
                height: 3,
                borderRadius: 2,
                background: m.color,
                display: 'inline-block',
              }}
            />
            <span style={{ color: 'var(--fg-muted)' }}>{m.label}</span>
            <span className="mono tnum" style={{ color: 'var(--fg-subtle)', fontSize: 10 }}>
              {m.min}
              {m.unit}–{m.max}
              {m.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
