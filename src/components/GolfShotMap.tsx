import { useEffect, useRef, useState } from 'react'
import type { GolfShot } from '../types'

interface GolfShotMapProps {
  holeNumber: number
  par: number
  shots: GolfShot[]
  selectedShotId?: string | null
  onSelectShot?: (shot: GolfShot) => void
}

declare global {
  interface Window {
    L: any
  }
}

export default function GolfShotMap({
  holeNumber,
  par,
  shots,
  selectedShotId,
  onSelectShot,
}: GolfShotMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const [leafletLoaded, setLeafletLoaded] = useState(!!window.L)

  const holeShots = shots
    .filter((s) => s.hole_number === holeNumber)
    .sort((a, b) => a.shot_number - b.shot_number)

  // Load Leaflet CSS & JS if not loaded
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true)
      return
    }

    const cssLink = document.createElement('link')
    cssLink.rel = 'stylesheet'
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(cssLink)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => setLeafletLoaded(true)
    document.body.appendChild(script)
  }, [])

  // Initialize Map & Render Markers + Polylines
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return
    const L = window.L
    if (!L) return

    if (!mapInstanceRef.current) {
      // Esri World Imagery Satellite Tiles
      const satelliteTiles = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        }
      )

      const map = L.map(mapContainerRef.current, {
        center: [49.1360, -123.1172],
        zoom: 17,
        layers: [satelliteTiles],
        zoomControl: true,
      })

      mapInstanceRef.current = map
    }

    const map = mapInstanceRef.current

    // Clear existing markers & layers
    markersRef.current.forEach((marker) => map.removeLayer(marker))
    markersRef.current.clear()

    if (map._polylineLayer) map.removeLayer(map._polylineLayer)

    const validShotsWithGps = holeShots.filter((s) => s.latitude && s.longitude)

    if (validShotsWithGps.length === 0) {
      map.setView([49.1341, -123.1168], 17)
      return
    }

    const latLngs: [number, number][] = []

    validShotsWithGps.forEach((s) => {
      const lat = Number(s.latitude)
      const lng = Number(s.longitude)
      latLngs.push([lat, lng])

      const isSelected = s.id === selectedShotId
      const markerColor = isSelected ? '#ef4444' : s.shot_number === 1 ? '#3b82f6' : '#10b981'

      const customIcon = L.divIcon({
        className: 'custom-shot-marker',
        html: `<div style="
          background: ${markerColor};
          color: white;
          border: 2px solid white;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.5);
          ${isSelected ? 'transform: scale(1.25); border-color: #fef08a;' : ''}
        ">#${s.shot_number}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })

      const popupContent = `
        <div style="font-family: sans-serif; font-size: 13px; color: #1e293b;">
          <strong>Shot #${s.shot_number} — ${s.club_used}</strong><br/>
          ${s.distance_yds ? `Distance: <b>${s.distance_yds} yds</b><br/>` : ''}
          ${s.actual_shape ? `Shape: <b>${s.actual_shape}</b><br/>` : ''}
          ${s.impact_location ? `Strike: <b>${s.impact_location}</b><br/>` : ''}
          ${s.lie_type ? `Lie: <b>${s.lie_type}</b>` : ''}
        </div>
      `

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map).bindPopup(popupContent)

      marker.on('click', () => {
        if (onSelectShot) onSelectShot(s)
      })

      markersRef.current.set(s.id, marker)
    })

    // Draw connected polyline trajectory between shots
    if (latLngs.length > 1) {
      const polyline = L.polyline(latLngs, {
        color: '#fbbf24',
        weight: 3,
        dashArray: '6, 6',
        opacity: 0.9,
      }).addTo(map)
      map._polylineLayer = polyline
    }

    // AUTO FIT-BOUNDS: Covers 100% of shots on this hole simultaneously!
    const bounds = L.latLngBounds(latLngs)
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 18 })
  }, [leafletLoaded, holeShots, selectedShotId])

  // Center & open popup when a shot is selected from the list below
  useEffect(() => {
    if (!selectedShotId || !mapInstanceRef.current) return
    const marker = markersRef.current.get(selectedShotId)
    const shot = holeShots.find((s) => s.id === selectedShotId)
    if (marker && shot && shot.latitude && shot.longitude) {
      mapInstanceRef.current.setView([Number(shot.latitude), Number(shot.longitude)], 18)
      marker.openPopup()
    }
  }, [selectedShotId, holeShots])

  return (
    <div className="shot-map-wrapper" style={{ marginTop: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h4 style={{ margin: 0 }}>
          ⛳ Hole #{holeNumber} Satellite Shot Map (Par {par}) — {holeShots.length} Shots
        </h4>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Auto-Fit Bounds (100% Shots)</span>
      </div>

      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '280px',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          background: '#022c22',
        }}
      />
    </div>
  )
}
