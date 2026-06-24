'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Upload, Loader2 } from 'lucide-react'

const G      = '#1a2b1a'
const ACCEPT = 'image/*,video/mp4,.avif,.webp,.jpg,.jpeg,.png,.mp4'

interface Props {
  onUpload:   (formData: FormData) => Promise<string>
  onUploaded: (url: string) => void
  disabled?:  boolean
}

export function MediaDropZone({ onUpload, onUploaded, disabled }: Props) {
  const inputRef              = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.size > 0)
    if (arr.length === 0) return
    setUploading(true)
    setError(null)
    for (const file of arr) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const url = await onUpload(fd)
        onUploaded(url)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Upload failed')
      }
    }
    setUploading(false)
  }, [onUpload, onUploaded])

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const files = e.clipboardData?.files
      if (files && files.length > 0) handleFiles(files)
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [handleFiles])

  return (
    <div className="relative flex-shrink-0">
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault()
          setDragging(false)
          if (!disabled && !uploading) handleFiles(e.dataTransfer.files)
        }}
        onClick={() => { if (!disabled && !uploading) inputRef.current?.click() }}
        title={uploading ? 'Uploading…' : 'Drop files, paste (Ctrl+V), or click to browse'}
        style={{
          width: 60, height: 60,
          border: `1px dashed ${dragging ? G : '#ccc'}`,
          background: dragging ? '#f5f9f5' : 'transparent',
          cursor: disabled || uploading ? 'default' : 'pointer',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 4,
        }}
      >
        {uploading
          ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#aaa' }} strokeWidth={1.5} />
          : <Upload className="w-4 h-4" style={{ color: dragging ? G : '#ccc' }} strokeWidth={1.5} />
        }
        <span
          className="font-sans"
          style={{
            fontSize: 7, letterSpacing: '0.15em', textTransform: 'uppercase',
            color: dragging ? G : '#ccc',
          }}
        >
          {uploading ? '…' : 'Add'}
        </span>
      </div>
      {error && (
        <span
          style={{
            position: 'absolute', top: '100%', left: 0,
            fontSize: 9, color: '#e05050', marginTop: 2,
            whiteSpace: 'nowrap',
          }}
        >
          {error}
        </span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={e => { if (e.target.files) handleFiles(e.target.files) }}
      />
    </div>
  )
}
