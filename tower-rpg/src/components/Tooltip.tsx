import type { ReactNode } from 'react'

export function Tooltip({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <span className="tooltip" style={{position:'relative', display:'inline-flex'}}>
      {children}
      <span className="tooltip-content" style={{top:'calc(100% + 6px)'}}>{label}</span>
    </span>
  )
}

