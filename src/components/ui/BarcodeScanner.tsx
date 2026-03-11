'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Camera, Keyboard, Flashlight, Check, RotateCcw } from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (code: string) => void
  onError?: (error: string) => void
  scanType?: 'item' | 'batch' | 'location'
  isOpen: boolean
  onClose: () => void
}

const SCAN_TYPE_LABELS: Record<string, string> = {
  item: 'Scan Item Barcode',
  batch: 'Scan Batch Barcode',
  location: 'Scan Location Barcode',
}

export default function BarcodeScanner({ onScan, onError, scanType = 'item', isOpen, onClose }: BarcodeScannerProps) {
  const [scannedCode, setScannedCode] = useState<string | null>(null)
  const [manualMode, setManualMode] = useState(false)
  const [manualInput, setManualInput] = useState('')
  const [torchOn, setTorchOn] = useState(false)
  const [torchAvailable, setTorchAvailable] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const scannerRef = useRef<any>(null)
  const containerRef = useRef<string>(`barcode-scanner-${Date.now()}`)

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState()
        // Html5Qrcode states: NOT_STARTED=1, SCANNING=2, PAUSED=3
        if (state === 2) {
          await scannerRef.current.stop()
        }
      } catch {
        // ignore cleanup errors
      }
      try {
        scannerRef.current.clear()
      } catch {
        // ignore
      }
      scannerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!isOpen || manualMode || scannedCode) return

    let mounted = true

    async function startScanner() {
      const { Html5Qrcode } = await import('html5-qrcode')

      if (!mounted) return

      // Small delay to ensure DOM element is rendered
      await new Promise(resolve => setTimeout(resolve, 100))

      const element = document.getElementById(containerRef.current)
      if (!element) return

      const scanner = new Html5Qrcode(containerRef.current)
      scannerRef.current = scanner

      try {
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 280, height: 160 },
            aspectRatio: 1.5,
          } as any,
          (decodedText: string) => {
            if (mounted) {
              setScannedCode(decodedText)
            }
          },
          () => {
            // scan failure (no code found in frame) - expected, ignore
          }
        )

        // Check torch availability
        try {
          const capabilities = scanner.getRunningTrackCameraCapabilities()
          const torch = capabilities?.torchFeature?.()
          if (torch?.isSupported()) {
            if (mounted) setTorchAvailable(true)
          }
        } catch {
          // torch not supported
        }
      } catch (err: any) {
        if (mounted) {
          const msg = err?.message || 'Camera access denied'
          setCameraError(msg)
          onError?.(msg)
        }
      }
    }

    startScanner()

    return () => {
      mounted = false
      stopScanner()
    }
  }, [isOpen, manualMode, scannedCode, onError, stopScanner])

  // Stop scanner when scannedCode is set
  useEffect(() => {
    if (scannedCode) {
      stopScanner()
    }
  }, [scannedCode, stopScanner])

  function handleClose() {
    stopScanner()
    setScannedCode(null)
    setManualMode(false)
    setManualInput('')
    setCameraError(null)
    setTorchOn(false)
    setTorchAvailable(false)
    onClose()
  }

  function handleConfirm() {
    const code = scannedCode || manualInput.trim()
    if (code) {
      onScan(code)
    }
    handleClose()
  }

  function handleReset() {
    setScannedCode(null)
    setCameraError(null)
  }

  async function toggleTorch() {
    if (!scannerRef.current) return
    try {
      const capabilities = scannerRef.current.getRunningTrackCameraCapabilities()
      const newState = !torchOn
      await capabilities.torchFeature.apply(newState)
      setTorchOn(newState)
    } catch {
      // ignore
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (manualInput.trim()) {
      setScannedCode(manualInput.trim())
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100" style={{ backgroundColor: '#1B3A6B' }}>
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-white" />
            <h3 className="text-white font-semibold text-sm">
              {SCAN_TYPE_LABELS[scanType] || 'Scan Barcode'}
            </h3>
          </div>
          <button onClick={handleClose} className="text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          {/* Scanned result confirmation */}
          {scannedCode ? (
            <div className="space-y-4">
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: '#E6F5F6' }}>
                  <Check size={28} style={{ color: '#0D7E8A' }} />
                </div>
                <p className="text-sm text-gray-500 mb-2">Scanned Code</p>
                <p className="text-lg font-mono font-bold" style={{ color: '#1B3A6B' }}>{scannedCode}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={handleReset} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                  <RotateCcw size={14} /> Rescan
                </button>
                <button onClick={handleConfirm} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Check size={14} /> Confirm
                </button>
              </div>
            </div>
          ) : manualMode ? (
            /* Manual entry mode */
            <div className="space-y-4">
              <form onSubmit={handleManualSubmit}>
                <label className="form-label">Enter code manually</label>
                <input
                  type="text"
                  className="form-input"
                  value={manualInput}
                  onChange={e => setManualInput(e.target.value)}
                  placeholder="Type or paste barcode value..."
                  autoFocus
                />
                <div className="flex gap-3 mt-4">
                  <button type="button" onClick={() => { setManualMode(false); setCameraError(null) }} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                    <Camera size={14} /> Use Camera
                  </button>
                  <button type="submit" disabled={!manualInput.trim()} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    <Check size={14} /> Submit
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Camera scanner mode */
            <div className="space-y-4">
              {cameraError ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center bg-red-50">
                    <Camera size={28} className="text-red-400" />
                  </div>
                  <p className="text-sm text-red-600 mb-1 font-medium">Camera Error</p>
                  <p className="text-xs text-gray-500 mb-4">{cameraError}</p>
                  <button onClick={() => setManualMode(true)} className="btn-primary">
                    <Keyboard size={14} className="mr-2 inline" /> Enter Manually
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative rounded-lg overflow-hidden bg-black" style={{ minHeight: 260 }}>
                    <div id={containerRef.current} className="w-full" />
                    {/* Scan region visual overlay hint */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="border-2 border-white/30 rounded-lg" style={{ width: 280, height: 160 }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    {torchAvailable ? (
                      <button
                        type="button"
                        onClick={toggleTorch}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          torchOn ? 'bg-yellow-50 border-yellow-300 text-yellow-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <Flashlight size={12} />
                        {torchOn ? 'Torch On' : 'Torch'}
                      </button>
                    ) : (
                      <div />
                    )}
                    <button
                      type="button"
                      onClick={() => setManualMode(true)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      <Keyboard size={12} /> Enter Manually
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
