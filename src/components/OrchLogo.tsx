'use client'

interface Props {
  size?: number
  animated?: boolean
  className?: string
}

const NODES = [
  { cx: 36, cy: 14, delay: 0 },
  { cx: 54, cy: 20, delay: 0.3 },
  { cx: 58, cy: 40, delay: 0.6 },
  { cx: 36, cy: 58, delay: 0.9 },
  { cx: 14, cy: 40, delay: 1.2 },
  { cx: 18, cy: 20, delay: 1.5 },
]

export default function OrchLogo({ size = 72, animated = false, className }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none" className={className}>
      {/* Fond */}
      <circle cx="36" cy="36" r="34" fill="var(--bg-alt)" />

      {/* Halo pulsant centre (animé seulement) */}
      {animated && (
        <circle cx="36" cy="36" r="6" fill="#cf7d56" opacity="0.15">
          <animate attributeName="r" values="6;16;6" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.15;0;0.15" dur="2.4s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Lignes de connexion */}
      {NODES.map((node, i) => (
        <line key={`line-${i}`} x1="36" y1="36" x2={node.cx} y2={node.cy}
          stroke="#cf7d56" strokeWidth="1.5" opacity={animated ? 0.25 : 0.4} />
      ))}

      {/* Dots voyageurs (animé seulement) */}
      {animated && NODES.map((node, i) => (
        <circle key={`dot-${i}`} r="2.2" fill="#cf7d56">
          <animateMotion dur="1.8s" repeatCount="indefinite" begin={`${node.delay}s`}
            path={`M 36 36 L ${node.cx} ${node.cy}`} />
          <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.05;0.15;0.85;1"
            dur="1.8s" repeatCount="indefinite" begin={`${node.delay}s`} />
        </circle>
      ))}

      {/* Nœuds satellites */}
      {NODES.map((node, i) => (
        <g key={`node-${i}`}>
          {animated && (
            <circle cx={node.cx} cy={node.cy} r="3.5" fill="#cf7d56" opacity="0">
              <animate attributeName="r" values="3.5;8;3.5" dur="1.8s" repeatCount="indefinite" begin={`${node.delay + 1.5}s`} />
              <animate attributeName="opacity" values="0;0.3;0" dur="1.8s" repeatCount="indefinite" begin={`${node.delay + 1.5}s`} />
            </circle>
          )}
          <circle cx={node.cx} cy={node.cy} r="3.5" fill="var(--bg-alt)" stroke="#cf7d56" strokeWidth="1.5"
            strokeOpacity={animated ? undefined : 0.7}>
            {animated && (
              <animate attributeName="stroke-opacity" values="0.4;1;0.4"
                dur="1.8s" repeatCount="indefinite" begin={`${node.delay + 1.5}s`} />
            )}
          </circle>
        </g>
      ))}

      {/* Nœud central */}
      <circle cx="36" cy="36" r="6" fill="#cf7d56" />
      <circle cx="36" cy="36" r="3" fill="#e8a07a" />
    </svg>
  )
}
