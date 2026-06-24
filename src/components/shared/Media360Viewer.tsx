'use client'

import { useRef, useState, useEffect } from 'react'

interface Props {
  src:        string
  poster?:    string
  style?:     React.CSSProperties
  className?: string
}

export function Media360Viewer({ src, poster, style, className }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    setLoaded(false)
    const onLoaded = () => {
      setLoaded(true)
      v.play().catch(() => {})
    }
    v.addEventListener('loadeddata', onLoaded)
    return () => v.removeEventListener('loadeddata', onLoaded)
  }, [src])

  return (
    <div className={`relative overflow-hidden ${className ?? ''}`} style={style}>
      {poster && !loaded && (
        <img
          src={poster}
          alt=""
          className="absolute inset-0 w-full h-full object-contain"
          draggable={false}
        />
      )}
      <video
        ref={videoRef}
        src={src}
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-contain"
        style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.35s ease' }}
        draggable={false}
        onContextMenu={e => e.preventDefault()}
      />
    </div>
  )
}
