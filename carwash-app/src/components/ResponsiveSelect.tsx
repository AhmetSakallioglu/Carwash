'use client'

import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'

export interface ResponsiveSelectOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

interface ResponsiveSelectProps {
  value: string
  onChange: (value: string) => void
  options: ResponsiveSelectOption[]
  placeholder?: string
  title?: string
  ariaLabel?: string
  disabled?: boolean
  className?: string
  triggerClassName?: string
}

const MOBILE_QUERY = '(max-width: 639px)'

function lockBodyScroll() {
  const scrollY = window.scrollY
  const { body } = document
  body.dataset.dropdownScrollY = String(scrollY)
  body.style.position = 'fixed'
  body.style.top = `-${scrollY}px`
  body.style.left = '0'
  body.style.right = '0'
  body.style.width = '100%'
  body.style.overflow = 'hidden'
}

function unlockBodyScroll() {
  const { body } = document
  const scrollY = Number(body.dataset.dropdownScrollY || '0')
  delete body.dataset.dropdownScrollY
  body.style.position = ''
  body.style.top = ''
  body.style.left = ''
  body.style.right = ''
  body.style.width = ''
  body.style.overflow = ''
  window.scrollTo(0, scrollY)
}

function scrollOptionIntoMenu(menu: HTMLElement, option: HTMLElement) {
  const menuRect = menu.getBoundingClientRect()
  const optionRect = option.getBoundingClientRect()
  if (optionRect.top < menuRect.top) {
    menu.scrollTop -= menuRect.top - optionRect.top
  } else if (optionRect.bottom > menuRect.bottom) {
    menu.scrollTop += optionRect.bottom - menuRect.bottom
  }
}

export function ResponsiveSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  title,
  ariaLabel,
  disabled = false,
  className = '',
  triggerClassName = '',
}: ResponsiveSelectProps) {
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    top: 0,
    left: 0,
    visibility: 'hidden',
  })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)
  const listId = useId()

  const selected = options.find(option => option.value === value)

  useEffect(() => {
    setMounted(true)
    const media = window.matchMedia(MOBILE_QUERY)
    const sync = () => setIsMobile(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || window.matchMedia(MOBILE_QUERY).matches) return

    const rect = triggerRef.current.getBoundingClientRect()
    const gutter = 12
    const width = Math.min(Math.max(rect.width, 220), window.innerWidth - gutter * 2)
    const left = Math.min(Math.max(gutter, rect.left), window.innerWidth - width - gutter)
    const spaceBelow = window.innerHeight - rect.bottom - gutter
    const openUpward = spaceBelow < 220 && rect.top > spaceBelow

    setMenuStyle({
      position: 'fixed',
      left,
      width,
      maxHeight: Math.min(320, window.innerHeight - gutter * 2),
      top: openUpward ? undefined : rect.bottom + 8,
      bottom: openUpward ? window.innerHeight - rect.top + 8 : undefined,
      visibility: 'visible',
      zIndex: 80,
    })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
    const menu = menuRef.current
    const option = selectedRef.current
    if (menu && option) scrollOptionIntoMenu(menu, option)
  }, [open, updatePosition, options, value])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    window.addEventListener('resize', updatePosition)

    if (window.matchMedia(MOBILE_QUERY).matches) {
      lockBodyScroll()
    }

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      window.removeEventListener('resize', updatePosition)
      if (document.body.dataset.dropdownScrollY !== undefined) {
        unlockBodyScroll()
      }
    }
  }, [open, updatePosition])

  const handleSelect = (option: ResponsiveSelectOption) => {
    if (option.disabled) return
    onChange(option.value)
    setOpen(false)
  }

  const optionButtons = options.map(option => {
    const isSelected = option.value === value
    return (
      <button
        key={option.value}
        ref={isSelected ? selectedRef : undefined}
        type="button"
        role="option"
        aria-selected={isSelected}
        disabled={option.disabled}
        onClick={() => handleSelect(option)}
        className={`w-full min-h-12 flex items-start justify-between gap-3 rounded-xl px-3.5 py-3 text-left transition ${
          option.disabled
            ? 'opacity-40 cursor-not-allowed'
            : isSelected
              ? 'bg-cyan-500/15 text-white'
              : 'text-slate-200 hover:bg-slate-800 active:bg-slate-800 cursor-pointer'
        }`}
      >
        <span className="min-w-0">
          <span className="block text-sm font-medium break-words">{option.label}</span>
          {option.description && (
            <span className="block text-[11px] text-slate-400 mt-0.5 leading-relaxed break-words">
              {option.description}
            </span>
          )}
        </span>
        {isSelected && <Check className="w-4 h-4 shrink-0 text-brand-neon mt-0.5" />}
      </button>
    )
  })

  const menu =
    open && mounted
      ? createPortal(
          isMobile ? (
            <div className="fixed inset-0 z-[80] overscroll-none">
              <button
                type="button"
                className="absolute inset-0 bg-black/65"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              />
              <div
                ref={menuRef}
                className="absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-y-auto overscroll-contain rounded-t-3xl border border-slate-700 bg-slate-900 shadow-2xl flex flex-col safe-bottom"
              >
                <div className="mx-auto mt-2 mb-1 h-1.5 w-10 rounded-full bg-slate-600" />
                {title && (
                  <div className="px-4 pt-2 pb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                    {title}
                  </div>
                )}
                <div id={listId} role="listbox" className="px-2 pb-3">
                  {optionButtons}
                </div>
              </div>
            </div>
          ) : (
            <div
              ref={menuRef}
              id={listId}
              role="listbox"
              style={menuStyle}
              className="overflow-y-auto overscroll-contain rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-2xl"
            >
              {optionButtons}
            </div>
          ),
          document.body
        )
      : null

  return (
    <div className={`relative min-w-0 w-full ${className}`.trim()}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel || title}
        onMouseDown={event => event.preventDefault()}
        onClick={() => setOpen(current => !current)}
        className={`w-full min-h-12 flex items-center justify-between gap-3 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-3 text-left text-base sm:text-sm text-white focus:outline-none focus:border-brand-cyan transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${triggerClassName}`.trim()}
      >
        <span className="min-w-0 flex-1">
          {selected ? (
            <>
              <span className="block font-medium leading-snug break-words">{selected.label}</span>
              {selected.description && (
                <span className="block text-[11px] text-slate-400 mt-0.5 leading-relaxed break-words">
                  {selected.description}
                </span>
              )}
            </>
          ) : (
            <span className="text-slate-500">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-slate-400 transition duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {menu}
    </div>
  )
}
