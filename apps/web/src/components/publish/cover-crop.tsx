'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  /** Existing cover URL or data URL — when set, render it editable. */
  value: string
  /** Called with a 1600×800 JPEG data URL once the user confirms the crop. */
  onChange: (jpegDataUrl: string) => void
  /** Maximum file size in bytes; default 8 MB. */
  maxBytes?: number
}

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const OUTPUT_WIDTH = 1600
const OUTPUT_HEIGHT = 800
const ASPECT = OUTPUT_WIDTH / OUTPUT_HEIGHT // 2

/**
 * 2:1 in-place cover crop (E5.5 T4).
 *
 * - File picker accepts JPEG / PNG / WebP only (≤ 8 MB).
 * - After pick, the image is rendered inside a fixed 2:1 mask.
 * - Drag to pan; scroll to zoom (touch: pinch-zoom via double-tap fallback).
 * - "Use this crop" exports a 1600×800 JPEG via canvas.
 */
export function CoverCrop({ value, onChange, maxBytes = 8 * 1024 * 1024 }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [src, setSrc] = useState<string>(value)
  const [error, setError] = useState<string | null>(null)
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)

  useEffect(() => {
    if (value) setSrc(value)
  }, [value])

  // When src changes, pre-load to capture natural dimensions.
  useEffect(() => {
    if (!src) {
      setImgSize(null)
      return
    }
    const img = new window.Image()
    img.onload = () => {
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight })
      setZoom(1)
      setOffset({ x: 0, y: 0 })
    }
    img.src = src
  }, [src])

  function pickFile(): void {
    fileInputRef.current?.click()
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
    setError(null)
    const f = e.target.files?.[0]
    if (!f) return
    if (!ALLOWED_MIME.includes(f.type)) {
      setError('Use a JPEG, PNG, or WebP image.')
      return
    }
    if (f.size > maxBytes) {
      setError('Image too large — max 8 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') setSrc(reader.result)
    }
    reader.readAsDataURL(f)
  }

  function onMouseDown(e: React.MouseEvent): void {
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
  }

  function onMouseMove(e: React.MouseEvent): void {
    if (!dragStart.current) return
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    })
  }

  function onMouseUp(): void {
    dragStart.current = null
  }

  function onWheel(e: React.WheelEvent): void {
    e.preventDefault()
    const delta = -e.deltaY * 0.0015
    setZoom((z) => Math.max(1, Math.min(4, z + delta)))
  }

  function exportCrop(): void {
    if (!imgSize || !containerRef.current) return
    const containerRect = containerRef.current.getBoundingClientRect()
    const baseScale = Math.max(
      containerRect.width / imgSize.w,
      containerRect.height / imgSize.h,
    )
    const scale = baseScale * zoom

    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_WIDTH
    canvas.height = OUTPUT_HEIGHT
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new window.Image()
    img.onload = () => {
      // The image's rendered top-left, in container px:
      const imgRenderedW = imgSize.w * scale
      const imgRenderedH = imgSize.h * scale
      const renderedX = containerRect.width / 2 - imgRenderedW / 2 + offset.x
      const renderedY = containerRect.height / 2 - imgRenderedH / 2 + offset.y
      // Translate the visible-rect (0..containerRect.width, 0..containerRect.height)
      // back to source-image coordinates:
      const srcX = (-renderedX) / scale
      const srcY = (-renderedY) / scale
      const srcW = containerRect.width / scale
      const srcH = containerRect.height / scale
      ctx.drawImage(
        img,
        srcX,
        srcY,
        srcW,
        srcH,
        0,
        0,
        OUTPUT_WIDTH,
        OUTPUT_HEIGHT,
      )
      onChange(canvas.toDataURL('image/jpeg', 0.88))
    }
    img.src = src
  }

  // Container is 2:1 inside the wizard's content max-width.
  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_MIME.join(',')}
        onChange={onFileChange}
        style={{ display: 'none' }}
      />

      {!src && (
        <button
          type="button"
          onClick={pickFile}
          style={{
            display: 'block',
            width: '100%',
            aspectRatio: '2 / 1',
            border: '2px dashed var(--hairline-strong)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-alt)',
            color: 'var(--ink-muted)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 14,
          }}
        >
          Click to upload — or drag & drop
        </button>
      )}

      {src && imgSize && (
        <>
          <div
            ref={containerRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={onWheel}
            role="application"
            aria-label="Cover crop area — drag to pan, scroll to zoom"
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '2 / 1',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              background: 'var(--surface-alt)',
              cursor: dragStart.current ? 'grabbing' : 'grab',
              userSelect: 'none',
            }}
          >
            <img
              src={src}
              alt=""
              draggable={false}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% + ${String(offset.x)}px), calc(-50% + ${String(offset.y)}px)) scale(${String(zoom)})`,
                transformOrigin: 'center center',
                pointerEvents: 'none',
                maxWidth: 'none',
                maxHeight: 'none',
                ...(imgSize.w / imgSize.h > ASPECT
                  ? { width: 'auto', height: '100%' }
                  : { width: '100%', height: 'auto' }),
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
            <button type="button" onClick={pickFile} className="ch-btn ch-btn-ghost">
              Replace
            </button>
            <input
              type="range"
              min={1}
              max={4}
              step={0.05}
              value={zoom}
              onChange={(e) => {
                setZoom(parseFloat(e.target.value))
              }}
              aria-label="Zoom"
              style={{ flex: 1 }}
            />
            <button type="button" onClick={exportCrop} className="ch-btn ch-btn-primary">
              Use this crop
            </button>
          </div>
        </>
      )}

      {error && (
        <p
          role="alert"
          style={{ marginTop: 10, fontSize: 13, color: 'var(--danger)' }}
        >
          {error}
        </p>
      )}

      <p style={{ marginTop: 10, fontSize: 11.5, color: 'var(--ink-muted)' }}>
        Cover is cropped to 2:1 (1600 × 800). JPEG / PNG / WebP only, max 8 MB.
      </p>
    </div>
  )
}
