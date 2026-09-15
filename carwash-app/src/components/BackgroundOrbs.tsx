'use client'

import { useEffect, useRef } from 'react'

export function BackgroundOrbs() {
  const orb1Ref = useRef<HTMLDivElement>(null)
  const orb2Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY
          if (orb1Ref.current) {
            orb1Ref.current.style.transform = `translateY(${scrollY * 0.15}px)`
          }
          if (orb2Ref.current) {
            orb2Ref.current.style.transform = `translateY(${-scrollY * 0.1}px)`
          }
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <div
        ref={orb1Ref}
        className="fixed top-10 left-1/4 w-[420px] h-[420px] bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none -z-10 transition-transform duration-300 ease-out"
      />
      <div
        ref={orb2Ref}
        className="fixed bottom-10 right-10 w-[480px] h-[480px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none -z-10 transition-transform duration-300 ease-out"
      />
    </>
  )
}
