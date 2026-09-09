import { useEffect, useRef, useState } from 'react';
import { recommendRoute } from '../data/mockAI';
import logisticsHeroImg from '../assets/logistics-hero.jpg';

const routes = recommendRoute('Vizag', 'Guntur');

const mapMarkers = [
  { name: 'Vizag (Pickup)', lat: 17.6868, lng: 83.2185, type: 'pickup' },
  { name: 'Anakapalle',     lat: 17.6911, lng: 82.9978, type: 'via' },
  { name: 'Rajahmundry',   lat: 17.0005, lng: 81.8040, type: 'via' },
  { name: 'Guntur (Drop)',  lat: 16.3067, lng: 80.4365, type: 'drop' },
];

export default function Logistics() {
  const mapRef = useRef(null);
  const [activeRoute, setActiveRoute] = useState(routes[0]);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // Load Leaflet CSS dynamically
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    let map;
    let polyline;

    const initMap = () => {
      import('leaflet').then((L) => {
        const Leaflet = L.default || L;
        if (mapRef.current && !mapRef.current._leaflet_id) {
          map = Leaflet.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false })
            .setView([17.0, 82.0], 7);

          Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
          }).addTo(map);

          // Markers
          const pickupIcon = Leaflet.divIcon({
            html: '<div style="background:#4CAF50;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
            iconSize: [14, 14], iconAnchor: [7, 7],
          });
          const dropIcon = Leaflet.divIcon({
            html: '<div style="background:#E53935;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
            iconSize: [14, 14], iconAnchor: [7, 7],
          });
          const viaIcon = Leaflet.divIcon({
            html: '<div style="background:#F5A623;width:10px;height:10px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.2)"></div>',
            iconSize: [10, 10], iconAnchor: [5, 5],
          });

          mapMarkers.forEach(m => {
            const icon = m.type === 'pickup' ? pickupIcon : m.type === 'drop' ? dropIcon : viaIcon;
            Leaflet.marker([m.lat, m.lng], { icon })
              .addTo(map)
              .bindPopup(`<strong>${m.name}</strong>`);
          });

          // Route line
          const latlngs = mapMarkers.map(m => [m.lat, m.lng]);
          polyline = Leaflet.polyline(latlngs, {
            color: '#4CAF50', weight: 3, dashArray: '8, 6', opacity: 0.85,
          }).addTo(map);

          // Truck position marker
          const truckIcon = Leaflet.divIcon({
            html: '<div style="font-size:20px;filter:drop-shadow(2px 2px 4px rgba(0,0,0,0.4))">🚛</div>',
            iconSize: [24, 24], iconAnchor: [12, 12],
          });
          Leaflet.marker([17.35, 82.9], { icon: truckIcon }).addTo(map)
            .bindPopup('<strong>In Transit</strong><br>ETA: 1h 10m');

          setMapLoaded(true);
        }
      });
    };

    setTimeout(initMap, 300);
    return () => { if (map) map.remove(); };
  }, []);

  return (
    <main style={{ paddingTop: 68, minHeight: '100vh', background: 'var(--color-cream)' }}>
      {/* Header */}
      <section style={{
        position: 'relative',
        backgroundImage: `linear-gradient(to bottom, rgba(5, 46, 43, 0.8), rgba(5, 46, 43, 0.92)), url('${logisticsHeroImg}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '3rem 0',
      }}>
        <div className="container">
          <span className="section-label" style={{ color: 'rgba(255,255,255,0.55)' }}>AI Logistics</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ color: 'white' }}>Route Optimization & Tracking</h2>
            <span className="badge badge-ai" style={{ animation: 'pulse-ai 2s infinite' }}>🚛 In Transit</span>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '2rem' }}>
        <div className="container">
          <div className="grid" style={{ gridTemplateColumns: '1fr 1.4fr', gap: '1.5rem', alignItems: 'start' }}>
            {/* Left: Route info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Shipment info */}
              <div className="card">
                <h4 style={{ marginBottom: '1rem' }}>Current Shipment</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {[
                    ['Lot', 'L001 — Tomato'],
                    ['Farmer', 'Ravi Kumar'],
                    ['Pickup', '🟢 Vizag, Seethammadhara'],
                    ['Destination', '🔴 Guntur, Old Town'],
                    ['Quantity', '500 kg'],
                    ['Vehicle', 'Mini Truck — AP 09 GH 4521'],
                    ['Driver', 'Venkat Rao · +91 98765 12345'],
                    ['Status', '🟡 In Transit'],
                    ['ETA', '2h 10m remaining'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', padding: '0.35rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>{k}</span>
                      <span style={{ fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Route Options */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span>🤖</span>
                  <h4 style={{ margin: 0 }}>AI Route Comparison</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {routes.map(route => (
                    <div
                      key={route.id}
                      id={`route-${route.id}`}
                      onClick={() => setActiveRoute(route)}
                      style={{
                        padding: '1rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                        background: activeRoute.id === route.id
                          ? (route.recommended ? 'rgba(76,175,80,0.08)' : 'rgba(0,229,199,0.06)')
                          : 'var(--color-cream)',
                        border: `2px solid ${activeRoute.id === route.id ? (route.recommended ? 'var(--color-leaf)' : 'var(--color-ai-teal)') : 'rgba(0,0,0,0.07)'}`,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{route.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            via {route.via.join(' → ')}
                          </div>
                        </div>
                        {route.recommended && (
                          <span className="badge badge-ai" style={{ fontSize: '0.65rem' }}>🤖 AI Pick</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '1.25rem' }}>
                        {[
                          ['📏', `${route.distance} km`],
                          ['⏱️', route.duration],
                          ['💰', `₹${route.cost}`],
                        ].map(([icon, val]) => (
                          <div key={icon} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--color-charcoal)', fontWeight: 500 }}>
                            <span>{icon}</span> {val}
                          </div>
                        ))}
                      </div>
                      {activeRoute.id === route.id && (
                        <div style={{
                          marginTop: '0.65rem', fontSize: '0.75rem',
                          color: route.recommended ? 'var(--color-success)' : 'var(--color-text-muted)',
                          fontStyle: 'italic',
                        }}>
                          🤖 {route.aiReason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Leaflet Map */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0 }}>Live Route Map</h4>
                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    <span>🟢 Pickup</span>
                    <span>🟡 In Transit</span>
                    <span>🔴 Destination</span>
                  </div>
                </div>
                <div
                  ref={mapRef}
                  style={{ height: 400, width: '100%', background: '#e8f5e9' }}
                />
                {!mapLoaded && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#e8f5e9', fontSize: '2rem',
                  }}>
                    🗺️ Loading map...
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h4 style={{ margin: 0 }}>Delivery Progress</h4>
                  <span style={{ fontWeight: 700, color: 'var(--color-forest)', fontSize: '0.9rem' }}>56% complete</span>
                </div>
                <div className="progress-bar-track" style={{ height: 12 }}>
                  <div className="progress-bar-fill" style={{ width: '56%' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  <span>Vizag (Departed 10:30 AM)</span>
                  <span>Guntur (ETA 1:00 PM)</span>
                </div>

                <div style={{
                  marginTop: '1rem', padding: '0.75rem 1rem',
                  background: 'rgba(0,229,199,0.06)', border: '1px solid rgba(0,229,199,0.2)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                }}>
                  <span style={{ fontSize: '1.2rem' }}>🤖</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-charcoal)' }}>AI Traffic Update</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      Minor congestion on NH-16 near Anakapalle — no significant delay expected.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
