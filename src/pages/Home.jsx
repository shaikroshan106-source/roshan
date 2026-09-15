import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import heroTractorImg from '../assets/hero-tractor.jpg';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { indiaLocations } from '../data/indiaLocations';

const popularMandis = [
  'Guntur',
  'Visakhapatnam',
  'Vijayawada',
  'Hyderabad',
  'Kurnool',
  'Tirupati',
  'Rajahmundry',
  'Nellore',
  'Anantapur',
];

const stats = [
  { value: '₹2.4Cr+', label: 'Trade Volume' },
  { value: '1,240+', label: 'Farmers' },
  { value: '380+', label: 'Verified Buyers' },
  { value: '94%', label: 'AI Accuracy' },
];

const howItWorks = [
  { step: '01', icon: '📦', title: 'List Your Crop', desc: 'Upload crop details, quality grade, and expected price. Our AI validates the listing.' },
  { step: '02', icon: '🤖', title: 'AI Analysis', desc: 'FarmAI predicts optimal price, matches verified buyers, and forecasts the best selling window.' },
  { step: '03', icon: '🤝', title: 'Connect & Bid', desc: 'Verified buyers place competitive bids. You see all offers transparently — no middlemen.' },
  { step: '04', icon: '🚛', title: 'Logistics & Pay', desc: 'AI-optimized transport is arranged. Payment is direct — 100% to your account, instantly.' },
];

export default function Home() {
  const heroRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);
  const { isLoggedIn, role } = useAuth();
  const isBuyer = isLoggedIn && role === 'buyer';

  // ── Live Google Market Intelligence & Farmer Location State ──────────────
  const [farmerLocation, setFarmerLocation] = useState('Visakhapatnam, Andhra Pradesh');
  const [isGpsDetected, setIsGpsDetected] = useState(false);
  const [locationMode, setLocationMode] = useState('current'); // 'current' | 'custom'
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [geoNotice, setGeoNotice] = useState('');
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [isGoogleLive, setIsGoogleLive] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState('');

  // Manual India-wide location selector state
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [selectedState, setSelectedState] = useState('Andhra Pradesh');
  const [selectedDistrict, setSelectedDistrict] = useState('Guntur');
  const [selectedMandi, setSelectedMandi] = useState('Guntur Mirchi Yard');

  const [marketRates, setMarketRates] = useState([
    { crop: '🍅 Tomato', price: '₹31.0/kg', trend: '↑ +7%', color: '#ef5350', recommend: 'WAIT 2 days' },
    { crop: '🌶️ Chilli', price: '₹64.0/kg', trend: '↑ +5%', color: '#ff7043', recommend: 'SELL NOW' },
    { crop: '🌾 Rice',   price: '₹35.0/kg', trend: '→ 0%',  color: '#ffa726', recommend: 'STABLE' },
    { crop: '🧶 Cotton', price: '₹73.0/kg', trend: '↑ +4%', color: '#78909c', recommend: 'WAIT' },
    { crop: '🧅 Onion',  price: '₹33.0/kg', trend: '↓ -2%', color: '#26a69a', recommend: 'SELL NOW' },
  ]);
  const [aiRecommendation, setAiRecommendation] = useState(
    'Best time to sell Chilli: Today — mandi demand is surging with strong buyer bids.'
  );

  const fetchMarketRates = useCallback(async (loc) => {
    const targetLoc = loc || farmerLocation;
    setIsLoadingRates(true);
    try {
      const res = await api.getLiveMarketRates(targetLoc);
      if (res.ok && res.data?.success && res.data?.data) {
        const d = res.data.data;
        if (d.rates && d.rates.length) setMarketRates(d.rates);
        if (d.aiRecommendation) setAiRecommendation(d.aiRecommendation);
        setIsGoogleLive(Boolean(d.isGoogleLive));
        setLastUpdatedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.warn('Market rates fetch notice:', err.message);
    } finally {
      setIsLoadingRates(false);
    }
  }, [farmerLocation]);

  const detectFarmerLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoNotice('Geolocation is not supported by your browser.');
      fetchMarketRates(farmerLocation);
      return;
    }
    setIsDetectingLocation(true);
    setGeoNotice('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          if (res.ok) {
            const data = await res.json();
            const city = data.city || data.locality || data.principalSubdivision || 'Visakhapatnam';
            const state = data.principalSubdivision || 'Andhra Pradesh';
            const locName = `${city}, ${state}`;
            setFarmerLocation(locName);
            setIsGpsDetected(true);
            setLocationMode('current');
            fetchMarketRates(locName);
            return;
          }
        } catch (err) {
          console.warn('Reverse geocoding error:', err);
        } finally {
          setIsDetectingLocation(false);
        }
        setFarmerLocation('Visakhapatnam, Andhra Pradesh');
        setIsGpsDetected(true);
        setLocationMode('current');
        fetchMarketRates('Visakhapatnam, Andhra Pradesh');
        setIsDetectingLocation(false);
      },
      (err) => {
        console.warn('Geolocation permission not granted:', err.message);
        setIsDetectingLocation(false);
        setGeoNotice('Location permission was denied or unavailable. Showing current APMC rates.');
        setTimeout(() => setGeoNotice(''), 6000);
        fetchMarketRates(farmerLocation);
      },
      { timeout: 8000 }
    );
  }, [farmerLocation, fetchMarketRates]);

  const handleStateChange = (newState) => {
    setSelectedState(newState);
    const found = indiaLocations.find(s => s.state === newState);
    if (found && found.districts.length > 0) {
      const firstDist = found.districts[0];
      setSelectedDistrict(firstDist.name);
      setSelectedMandi(firstDist.mandis[0] || `${firstDist.name} Mandi`);
    } else {
      setSelectedDistrict('');
      setSelectedMandi('');
    }
  };

  const handleDistrictChange = (newDistrict) => {
    setSelectedDistrict(newDistrict);
    const foundState = indiaLocations.find(s => s.state === selectedState);
    const foundDist = foundState?.districts.find(d => d.name === newDistrict);
    if (foundDist && foundDist.mandis.length > 0) {
      setSelectedMandi(foundDist.mandis[0]);
    } else {
      setSelectedMandi(`${newDistrict} APMC Mandi`);
    }
  };

  const handleApplyCustomLocation = () => {
    const parts = [];
    if (selectedMandi && !selectedMandi.startsWith('All Mandis')) {
      parts.push(selectedMandi);
    } else if (selectedDistrict) {
      parts.push(selectedDistrict);
    }
    if (selectedState) {
      parts.push(selectedState);
    }
    const finalLocation = parts.join(', ') || 'Guntur, Andhra Pradesh';
    setFarmerLocation(finalLocation);
    setIsGpsDetected(false);
    setLocationMode('custom');
    setLocationModalOpen(false);
    fetchMarketRates(finalLocation);
  };

  useEffect(() => {
    // Initial fetch for present location
    detectFarmerLocation();
  }, []);

  useEffect(() => {
    // Parallax
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll);

    // GSAP hero animation (runs after GSAP loads)
    if (typeof window !== 'undefined') {
      import('gsap').then(({ gsap }) => {
        import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
          gsap.registerPlugin(ScrollTrigger);
          const tl = gsap.timeline();
          tl.fromTo('.hero-bg-img', { scale: 1.1 }, { scale: 1, duration: 2.5, ease: 'power2.out' })
            .fromTo('.hero-badge', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6 }, '-=1.8')
            .fromTo('.hero-title', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=1.4')
            .fromTo('.hero-subtitle', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.5')
            .fromTo('.hero-cta', { opacity: 0, y: 20, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.15, ease: 'back.out(1.5)' }, '-=0.3')
            .fromTo('.hero-farmer-img', { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 1, ease: 'power3.out' }, '-=1.2');
        });
      });
    }
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <main>
      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section ref={heroRef} style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        background: '#0B231A',
      }}>
        {/* Background image with Ken Burns */}
        <div className="hero-bg-img" style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url('${heroTractorImg}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          opacity: 0.95,
          transform: `translateY(${scrollY * 0.25}px)`,
        }} />
        {/* Subtle left-side dark gradient overlay for crystal clear text readability */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.15) 80%, rgba(0,0,0,0.05) 100%)',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: 100 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '3rem', alignItems: 'center' }}>
            {/* Left: Text */}
            <div>
              <h1 className="hero-title" style={{
                opacity: 0,
                color: '#FFFFFF',
                fontSize: 'clamp(2.8rem, 6vw, 4.6rem)',
                fontWeight: 800,
                lineHeight: 1.1,
                marginBottom: '1.25rem',
                textShadow: '0 2px 14px rgba(0,0,0,0.5)',
                letterSpacing: '-0.02em',
              }}>
                Farmer to People
              </h1>

              <p className="hero-subtitle" style={{
                opacity: 0,
                color: 'rgba(255,255,255,0.92)',
                fontSize: '1.12rem',
                lineHeight: 1.75,
                maxWidth: 540,
                marginBottom: '2.25rem',
                textShadow: '0 1px 6px rgba(0,0,0,0.45)',
              }}>
                To make your document look professionally produced, Word provides header, footer, cover
                page, and text box designs that complement each other. For example, you can add a matching
                cover page, header, and sidebar.
              </p>

              <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <Link
                  to="/problem"
                  id="hero-about-btn"
                  className="hero-cta btn"
                  style={{
                    opacity: 0,
                    background: '#FFFFFF',
                    color: '#C0392B',
                    fontWeight: 700,
                    padding: '0.75rem 2rem',
                    borderRadius: 8,
                    fontSize: '1rem',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                  }}
                >
                  About Us!
                </Link>
                <Link to="/marketplace" id="hero-sell-btn" className="hero-cta btn btn-primary" style={{ opacity: 0, borderRadius: 8, padding: '0.75rem 1.6rem' }}>
                  {isBuyer ? 'BID' : '🌾 Sell Your Crop'}
                </Link>
                <Link to="/marketplace" id="hero-explore-btn" className="hero-cta btn btn-ghost" style={{ opacity: 0, borderRadius: 8, padding: '0.75rem 1.6rem' }}>
                  🛒 Explore Marketplace
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="hero-cta" style={{ opacity: 0, display: 'flex', gap: '1.5rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
                {['✓ No middlemen', '✓ Real-time prices', '✓ Instant payment'].map(text => (
                  <span key={text} style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                    {text}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Stats + Visual */}
            <div className="hero-farmer-img" style={{ opacity: 0 }}>
              {/* Main visual card */}
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 'var(--radius-xl)',
                padding: '2rem',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* AI Glow header */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: 'linear-gradient(90deg, var(--color-ai-teal), var(--color-ai-violet))',
                }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: 4 }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>FarmAI Insight</span>
                      <span style={{
                        fontSize: '0.68rem',
                        padding: '1px 7px',
                        borderRadius: 12,
                        background: isGoogleLive ? 'rgba(66, 133, 244, 0.2)' : 'rgba(0, 229, 199, 0.12)',
                        color: isGoogleLive ? '#8ab4f8' : 'var(--color-ai-teal)',
                        border: isGoogleLive ? '1px solid rgba(66, 133, 244, 0.4)' : '1px solid rgba(0, 229, 199, 0.25)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontWeight: 600,
                      }}>
                        <span style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: isGoogleLive ? '#8ab4f8' : 'var(--color-ai-teal)',
                          boxShadow: isGoogleLive ? '0 0 6px #8ab4f8' : '0 0 6px var(--color-ai-teal)',
                        }} />
                        {isGoogleLive ? 'Google Grounded (Live)' : 'Google Market Synced'}
                      </span>
                    </div>
                    <h4 style={{ color: 'white', fontSize: '1.05rem', margin: 0 }}>Live Market Intelligence</h4>
                  </div>
                  <span className="badge badge-ai" style={{ animation: 'pulse-ai 2.5s ease-in-out infinite' }}>🤖 AI LIVE</span>
                </div>

                {/* Farmer Location Selection Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  marginBottom: '1rem',
                  gap: '0.6rem',
                  flexWrap: 'wrap',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: '1 1 auto' }}>
                    <span style={{ fontSize: '1.1rem' }}>📍</span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                        {locationMode === 'current' || isGpsDetected ? 'Current Location' : 'Selected Location'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span id="active-market-location-display" style={{ color: '#ffffff', fontWeight: 800, fontSize: '0.88rem', letterSpacing: '-0.01em' }}>
                          {farmerLocation}
                        </span>
                        {isGpsDetected && (
                          <span style={{ fontSize: '0.65rem', color: 'var(--color-ai-teal)', fontWeight: 800, background: 'rgba(0,229,199,0.15)', padding: '1px 5px', borderRadius: 4 }}>
                            GPS
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {/* "Choose / Change Location" button */}
                    <button
                      type="button"
                      id="choose-location-btn"
                      onClick={() => setLocationModalOpen(true)}
                      title="Select State, District, and Mandi in India"
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.22)',
                        borderRadius: 6,
                        color: '#FFFFFF',
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.74rem',
                        cursor: 'pointer',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>🗺️</span>
                      <span>{locationMode === 'custom' ? 'Change Location' : 'Choose Location'}</span>
                    </button>

                    {/* Switch back to "Use My Current Location" */}
                    {locationMode === 'custom' ? (
                      <button
                        type="button"
                        id="use-my-location-btn"
                        onClick={detectFarmerLocation}
                        disabled={isDetectingLocation}
                        title="Switch back to present GPS location"
                        style={{
                          background: 'rgba(0,229,199,0.18)',
                          border: '1px solid rgba(0,229,199,0.5)',
                          borderRadius: 6,
                          color: 'var(--color-ai-teal)',
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.74rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontWeight: 700,
                        }}
                      >
                        {isDetectingLocation ? '📍 Locating...' : '🎯 Use My Current Location'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        id="detect-location-btn"
                        onClick={detectFarmerLocation}
                        disabled={isDetectingLocation}
                        title="Detect farmer's present location via GPS"
                        style={{
                          background: 'rgba(0,229,199,0.12)',
                          border: '1px solid rgba(0,229,199,0.35)',
                          borderRadius: 6,
                          color: 'var(--color-ai-teal)',
                          padding: '0.35rem 0.6rem',
                          fontSize: '0.74rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontWeight: 700,
                        }}
                      >
                        {isDetectingLocation ? '📍 Locating...' : '🎯 My Location'}
                      </button>
                    )}

                    <button
                      type="button"
                      id="refresh-rates-btn"
                      onClick={() => fetchMarketRates(farmerLocation)}
                      disabled={isLoadingRates}
                      title="Refresh current Google market rates"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: 6,
                        color: 'white',
                        padding: '0.35rem 0.55rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      {isLoadingRates ? '⏳' : '🔄'}
                    </button>
                  </div>
                </div>

                {/* Graceful location notice if permission denied */}
                {geoNotice && (
                  <div style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: 6,
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#FCA5A5',
                    fontSize: '0.75rem',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <span>⚠️ {geoNotice}</span>
                    <button
                      type="button"
                      onClick={() => setGeoNotice('')}
                      style={{ background: 'transparent', border: 'none', color: '#FCA5A5', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Live Price rows for Farmer's Location */}
                <div style={{ minHeight: 185, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {isLoadingRates ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 180, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                      <span style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>⏳</span>
                      <span>Connecting to Google for {farmerLocation}...</span>
                    </div>
                  ) : (
                    marketRates.map(({ crop, price, trend, color, recommend }) => (
                      <div key={crop} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}>
                        <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem' }}>{crop}</span>
                        <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>{price}</span>
                        <span style={{ color, fontSize: '0.8rem', fontWeight: 600 }}>{trend}</span>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 700, color: recommend === 'SELL NOW' ? '#4CAF50' : 'var(--color-ai-teal)',
                          background: recommend === 'SELL NOW' ? 'rgba(76,175,80,0.15)' : 'rgba(0,229,199,0.1)',
                          padding: '2px 8px', borderRadius: 20,
                        }}>{recommend}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* AI Recommendation box with Google market data */}
                <div style={{
                  marginTop: '1rem', padding: '0.75rem',
                  background: 'rgba(0,229,199,0.08)',
                  border: '1px solid rgba(0,229,199,0.2)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <p style={{ color: 'var(--color-ai-teal)', fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>
                      🤖 AI Recommendation ({farmerLocation})
                    </p>
                    {lastUpdatedTime && (
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem' }}>
                        {lastUpdatedTime}
                      </span>
                    )}
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', lineHeight: 1.5, margin: 0 }}>
                    {aiRecommendation}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            marginTop: '4rem',
            paddingTop: '3rem',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}>
            {stats.map((s, i) => (
              <div key={i} className="hero-cta" style={{ opacity: 0, textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'white', fontFamily: 'var(--font-heading)' }}>
                  {s.value}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
          animation: 'float 2.5s ease-in-out infinite',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', letterSpacing: '0.15em' }}>SCROLL</span>
          <div style={{
            width: 20, height: 32, border: '2px solid rgba(255,255,255,0.2)',
            borderRadius: 10, position: 'relative',
          }}>
            <div style={{
              width: 4, height: 8, background: 'var(--color-ai-teal)',
              borderRadius: 2, position: 'absolute', top: 5, left: '50%',
              transform: 'translateX(-50%)',
              animation: 'float 1.5s ease-in-out infinite',
            }} />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-cream)' }}>
        <div className="container">
          <div className="section-header text-center">
            <span className="section-label">How It Works</span>
            <h2>4 Simple Steps to Fair Trade</h2>
            <p>From listing your crop, arranging AI logistics, to 24/7 support — Agri Direct handles everything.</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: '1.25rem',
            position: 'relative'
          }}>
            {howItWorks.map((step, i) => (
              <div key={i} className="card" style={{ textAlign: 'center', position: 'relative', zIndex: 1, padding: '1.5rem 1rem' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-forest), var(--color-leaf))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.25rem', fontSize: '1.4rem',
                  boxShadow: '0 4px 20px rgba(76,175,80,0.3)',
                }}>
                  {step.icon}
                </div>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em',
                  color: 'var(--color-leaf)', textTransform: 'uppercase',
                }}>STEP {step.step}</span>
                <h4 style={{ margin: '0.5rem 0 0.75rem', fontSize: '1rem' }}>{step.title}</h4>
                <p style={{ fontSize: '0.84rem', color: '#4B5563' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, var(--color-forest), #2E7D32)',
        padding: 'var(--space-16) 0',
      }}>
        <div className="container text-center">
          <h2 style={{ color: 'white', marginBottom: '1rem' }}>Ready to Get a Fair Price for Your Crop?</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2.5rem', maxWidth: 540, margin: '0 auto 2.5rem' }}>
            Join 1,240+ farmers across Andhra Pradesh who are already earning more with Agri Direct.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/marketplace" id="cta-marketplace-btn" className="btn btn-gold btn-lg">🌾 Start Selling</Link>
            <Link to="/problem" id="cta-learn-btn" className="btn btn-ghost btn-lg">Learn More</Link>
          </div>
        </div>
      </section>

      {/* ── India-wide Location Selection Modal ───────────────────────────── */}
      {locationModalOpen && (
        <div
          id="location-selector-modal"
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(5, 46, 43, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.25rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setLocationModalOpen(false);
          }}
        >
          <div style={{
            background: '#FFFFFF',
            borderRadius: 16,
            maxWidth: 520,
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            border: '1.5px solid #E5E7EB',
            animation: 'fadeIn 0.2s ease-out',
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #052E2B 0%, #134E48 100%)',
              padding: '1.25rem 1.5rem',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 4 }}>
                  <span style={{ fontSize: '1.3rem' }}>🗺️</span>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#FFFFFF', fontWeight: 800 }}>
                    Select Market Location in India
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>
                  Choose any State, District, and APMC Mandi to view calibrated wholesale and retail rates.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLocationModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 30, height: 30,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', cursor: 'pointer', fontSize: '1rem',
                }}
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {/* State Dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                  1. State / Union Territory ({indiaLocations.length} Available)
                </label>
                <select
                  id="select-indian-state"
                  value={selectedState}
                  onChange={(e) => handleStateChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 8,
                    border: '1.5px solid #D1D5DB',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#1F2937',
                    background: '#F9FAFB',
                    cursor: 'pointer',
                  }}
                >
                  {indiaLocations.map((item) => (
                    <option key={item.state} value={item.state}>
                      {item.state}
                    </option>
                  ))}
                </select>
              </div>

              {/* District Dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                  2. District
                </label>
                <select
                  id="select-indian-district"
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 8,
                    border: '1.5px solid #D1D5DB',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#1F2937',
                    background: '#F9FAFB',
                    cursor: 'pointer',
                  }}
                >
                  {(indiaLocations.find(s => s.state === selectedState)?.districts || []).map((dist) => (
                    <option key={dist.name} value={dist.name}>
                      {dist.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mandi / Market Dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                  3. APMC Mandi / Wholesale Market
                </label>
                <select
                  id="select-indian-mandi"
                  value={selectedMandi}
                  onChange={(e) => setSelectedMandi(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 8,
                    border: '1.5px solid #D1D5DB',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#1F2937',
                    background: '#F9FAFB',
                    cursor: 'pointer',
                  }}
                >
                  {(() => {
                    const foundState = indiaLocations.find(s => s.state === selectedState);
                    const foundDist = foundState?.districts.find(d => d.name === selectedDistrict);
                    const mandis = foundDist?.mandis || [];
                    return (
                      <>
                        <option value={`All Mandis in ${selectedDistrict}`}>
                          All Mandis in {selectedDistrict}
                        </option>
                        {mandis.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </>
                    );
                  })()}
                </select>
              </div>

              {/* Preview chip */}
              <div style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: 8,
                padding: '0.65rem 0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{ fontSize: '1rem' }}>📍</span>
                <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>
                  Selected: <strong>{selectedMandi ? `${selectedMandi}, ${selectedDistrict}, ${selectedState}` : `${selectedDistrict}, ${selectedState}`}</strong>
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  id="cancel-location-modal-btn"
                  onClick={() => setLocationModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '0.7rem',
                    borderRadius: 8,
                    border: '1px solid #D1D5DB',
                    background: '#F3F4F6',
                    color: '#374151',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="apply-location-btn"
                  onClick={handleApplyCustomLocation}
                  style={{
                    flex: 1.5,
                    padding: '0.7rem',
                    borderRadius: 8,
                    border: 'none',
                    background: '#052E2B',
                    color: '#A7F3D0',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(5,46,43,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <span>✓ Apply Location</span>
                </button>
              </div>

              {/* Option to use GPS instead */}
              <div style={{ textAlign: 'center', paddingTop: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setLocationModalOpen(false);
                    detectFarmerLocation();
                  }}
                  style={{
                    background: 'none', border: 'none',
                    color: '#059669', fontSize: '0.78rem',
                    fontWeight: 700, cursor: 'pointer', textDecoration: 'underline',
                  }}
                >
                  🎯 Or use automatic GPS detection instead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
