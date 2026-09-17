import React from 'react'

interface BrandMarkProps {
  name?: string | null
  className?: string
}

export function BrandMark({ name, className = '' }: BrandMarkProps) {
  const display = (name || 'Ozer Auto Detailing').trim()
  const [first, ...rest] = display.split(/\s+/)

  return (
    <span className={`font-display font-bold tracking-wider text-white ${className}`.trim()}>
      {first.toUpperCase()}
      {rest.length > 0 && <span className="text-brand-cyan"> {rest.join(' ')}</span>}
    </span>
  )
}
