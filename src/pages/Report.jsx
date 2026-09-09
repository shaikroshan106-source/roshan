import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { submitComplaint } from '../utils/complaintStore';

const farmerCategories = [
  'Delayed / Defaulted Payment from Buyer',
  'Unfair Price Deduction / Mandi Discounting at Delivery',
  'Weighbridge Cheating / Weight Discrepancy by Transporter/Buyer',
  'Arbitrary Crop Rejection Without Valid Cause',
  'Transporter Left Perishable Cargo / In-Transit Damage',
  'Fake or Fraudulent Buyer Profile',
  'Other Farmer Grievance',
];

const buyerCategories = [
  'Spoiled, Rotten, or Pest-Damaged Produce Delivered',
  'Quality Discrepancy vs AI Quality Certificate (Grade Mismatch)',
  'Farmer Did Not Dispatch Lot / Unilateral Cancellation After Auction',
  'Shortage in Weight / Bag Count at Mandi Delivery',
  'Transporter Delayed / Mishandled Goods in Transit',
  'Suspicious / Misrepresented Listing Details or Counterfeit Photo',
  'Other Buyer Dispute',
];

export default function Report() {
  const { user, isLoggedIn, role } = useAuth();
  const navigate = useNavigate();

  // Portal type is strictly determined by the logged-in role
  const isFarmer = role === 'farmer';
  const isBuyer = role === 'buyer';
  const isAdmin = role === 'admin';

  // Form states
  const [reporterName, setReporterName] = useState(user?.name || '');
  const [reporterPhone, setReporterPhone] = useState(user?.phone || '');
  const [reporterEmail, setReporterEmail] = useState(user?.email || '');
  const [category, setCategory] = useState(isFarmer ? farmerCategories[0] : buyerCategories[0]);
  const [counterpartyName, setCounterpartyName] = useState('');
  const [lotId, setLotId] = useState('');
  const [severity, setSeverity] = useState('High');
  const [description, setDescription] = useState('');
  const [evidencePreview, setEvidencePreview] = useState('');

  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleEvidenceUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setEvidencePreview(event.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!reporterName.trim() || !reporterPhone.trim() || !description.trim()) {
      setErrorMsg('Please enter your full name, contact phone number, and a detailed description of the grievance.');
      return;
    }

    const payload = {
      reporterName: reporterName.trim(),
      reporterRole: isFarmer ? 'Farmer' : 'Buyer',
      reporterPhone: reporterPhone.trim(),
      reporterEmail: reporterEmail.trim(),
      category,
      counterpartyName: counterpartyName.trim() || 'Not specified',
      lotId: lotId.trim() || 'N/A',
      severity,
      description: description.trim(),
      evidenceUrl: evidencePreview || null,
    };

    const res = submitComplaint(payload);
    if (res.success) {
      setSubmittedTicket(res.complaint);
    } else {
      setErrorMsg(res.error || 'Failed to submit report. Please try again.');
    }
  };

  // Auth gate: Report option is only accessible to logged-in users
  if (!isLoggedIn) {
    return (
      <main style={{ paddingTop: 90, minHeight: '100vh', background: '#F8FAFC', paddingBottom: 60 }}>
        <div className="container" style={{ maxWidth: 640, textAlign: 'center', padding: '3rem 1.5rem' }}>
          <div style={{
            background: 'white', border: '1px solid #E2E8F0', borderRadius: 20,
            padding: '3rem 2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.06)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
            <h2 style={{ color: '#0F172A', fontFamily: 'var(--font-heading)', fontSize: '1.6rem', marginBottom: '0.75rem' }}>
              Authentication Required
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              The Report Desk is accessible exclusively through the <strong>Farmer Portal</strong> or <strong>Buyer Portal</strong>.
              Please sign in with your account to report disputes, payment delays, or crop quality issues.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/login" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                🔑 Sign In to Portal
              </Link>
              <Link to="/" className="btn btn-ghost" style={{ padding: '0.75rem 1.5rem' }}>
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // If Admin visits, direct them to Admin Complaint Desk
  if (isAdmin) {
    return (
      <main style={{ paddingTop: 90, minHeight: '100vh', background: '#0F172A', paddingBottom: 60 }}>
        <div className="container" style={{ maxWidth: 680, textAlign: 'center', padding: '3rem 1.5rem' }}>
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20, padding: '3rem 2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚖️</div>
            <h2 style={{ color: 'white', fontFamily: 'var(--font-heading)', fontSize: '1.6rem', marginBottom: '0.75rem' }}>
              Admin Complaint Box &amp; Moderation
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              You are logged in as <strong>Super Admin</strong>. Reports filed by Farmers and Buyers are reviewed and arbitrated inside the <strong>Admin Complaint Desk</strong>, where you can also suspend reported counterparties.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/admin" className="btn btn-primary" style={{ padding: '0.75rem 2rem', background: '#7C5CFF', borderColor: '#7C5CFF' }}>
                ⚖️ Go to Admin Complaint Desk
              </Link>
              <Link to="/" className="btn btn-ghost" style={{ padding: '0.75rem 1.5rem', color: 'white' }}>
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ paddingTop: 80, minHeight: '100vh', background: '#F8FAFC', paddingBottom: 70 }}>
      <div className="container" style={{ maxWidth: 840 }}>

        {/* Breadcrumb Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#64748B', marginBottom: '1.25rem' }}>
          <Link to="/" style={{ color: '#052E2B', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
          <span>/</span>
          <Link to="/logistics" style={{ color: '#64748B', textDecoration: 'none' }}>Logistics</Link>
          <span>/</span>
          <span style={{ color: '#0F172A', fontWeight: 700 }}>
            {isFarmer ? 'Farmer Dispute Portal' : 'Buyer Dispute Portal'}
          </span>
        </div>

        {/* Portal-Specific Header Banner */}
        <div style={{
          background: isFarmer
            ? 'linear-gradient(135deg, #052E2B 0%, #115E59 100%)'
            : 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
          borderRadius: 18,
          padding: '2rem 2.25rem',
          color: 'white',
          marginBottom: '2rem',
          boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{
              width: 58, height: 58, borderRadius: '50%', background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              {isFarmer ? '👨‍🌾' : '🏪'}
            </div>
            <div>
              <div style={{
                display: 'inline-block',
                background: isFarmer ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)',
                color: isFarmer ? '#A7F3D0' : '#FDE68A',
                border: `1px solid ${isFarmer ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)'}`,
                borderRadius: 20, padding: '2px 12px',
                fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6
              }}>
                {isFarmer ? 'Farmer Portal · Official Grievance Desk' : 'Buyer Portal · Produce Quality Dispute Desk'}
              </div>
              <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.1rem)', fontWeight: 800, margin: 0, color: 'white' }}>
                {isFarmer ? 'Farmer Grievance & Payment Report' : 'Buyer Quality & Delivery Dispute Report'}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: '0.9rem', margin: '6px 0 0', maxWidth: 640, lineHeight: 1.5 }}>
                {isFarmer
                  ? 'Exclusively for verified Farmers: report delayed buyer escrow payments, unauthorized mandi price cuts, weighment shortages, or transporter delays.'
                  : 'Exclusively for verified Buyers: report spoiled/substandard crop delivery, AI quality grade discrepancies, or failure of farmer dispatch.'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Confirmation Modal / Card Upon Submission ── */}
        {submittedTicket ? (
          <div style={{
            background: 'white',
            borderRadius: 18,
            padding: '2.5rem',
            border: '1px solid #E2E8F0',
            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
            textAlign: 'center',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: '#DEF7EC',
              color: '#03543F', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', margin: '0 auto 1.25rem'
            }}>
              ✅
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
              {isFarmer ? 'Farmer Grievance Dispatched' : 'Buyer Dispute Dispatched'}
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.95rem', maxWidth: 540, margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
              Your report has been received in the <strong>Admin Complaint Box</strong>. An arbitration officer will examine your details and take immediate action, including suspension of the reported party if warranted.
            </p>

            <div style={{
              background: '#F8FAFC', border: '1.5px dashed #CBD5E1', borderRadius: 14,
              padding: '1.25rem', maxWidth: 440, margin: '0 auto 2rem', textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.88rem' }}>
                <span style={{ color: '#64748B' }}>Ticket Number:</span>
                <strong style={{ color: '#0F172A', fontFamily: 'monospace', fontSize: '1rem' }}>{submittedTicket.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.88rem' }}>
                <span style={{ color: '#64748B' }}>Portal Filer:</span>
                <strong style={{ color: isFarmer ? '#10B981' : '#6366F1' }}>
                  {submittedTicket.reporterRole} ({submittedTicket.reporterName})
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.88rem' }}>
                <span style={{ color: '#64748B' }}>Reported Counterparty:</span>
                <strong style={{ color: '#DC2626' }}>{submittedTicket.counterpartyName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.88rem' }}>
                <span style={{ color: '#64748B' }}>Issue Category:</span>
                <span style={{ color: '#1E293B', fontWeight: 600, fontSize: '0.82rem', textAlign: 'right', maxWidth: '60%' }}>
                  {submittedTicket.category}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span style={{ color: '#64748B' }}>Status in Admin Box:</span>
                <span style={{ background: '#FEF3C7', color: '#92400E', padding: '2px 10px', borderRadius: 12, fontWeight: 700, fontSize: '0.78rem' }}>
                  ⏳ {submittedTicket.status}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setSubmittedTicket(null);
                  setDescription('');
                  setCounterpartyName('');
                  setLotId('');
                  setEvidencePreview('');
                }}
                className="btn btn-secondary"
                style={{ padding: '0.7rem 1.6rem', fontSize: '0.9rem' }}
              >
                File Another {isFarmer ? 'Farmer' : 'Buyer'} Report
              </button>
              <button
                type="button"
                onClick={() => navigate('/marketplace')}
                className="btn btn-primary"
                style={{ padding: '0.7rem 1.8rem', fontSize: '0.9rem' }}
              >
                Go to Marketplace
              </button>
            </div>
          </div>
        ) : (
          /* ── Portal-Specific Dedicated Reporting Form ── */
          <div style={{
            background: 'white',
            borderRadius: 18,
            padding: '2rem 2.25rem',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem', marginBottom: '1.75rem',
              flexWrap: 'wrap', gap: '0.75rem'
            }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {isFarmer ? '👨‍🌾 Farmer Dispute Filing Form' : '🏪 Buyer Quality Dispute Filing Form'}
                </h2>
                <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
                  {isFarmer
                    ? 'Submit dispute against buyers or transporters to initiate Admin investigation.'
                    : 'Submit quality discrepancy claims or non-dispatch reports to initiate Admin arbitration.'}
                </span>
              </div>
              <span style={{
                background: isFarmer ? '#ECFDF5' : '#EEF2FF',
                color: isFarmer ? '#047857' : '#4338CA',
                border: `1px solid ${isFarmer ? '#A7F3D0' : '#C7D2FE'}`,
                padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700
              }}>
                {isFarmer ? '👨‍🌾 Verified Farmer Portal' : '🏪 Verified Buyer Portal'}
              </span>
            </div>

            {errorMsg && (
              <div style={{
                background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C',
                padding: '0.85rem 1.25rem', borderRadius: 10, marginBottom: '1.5rem',
                fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <span>⚠️</span> {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
              {/* Row 1: Reporter Contact Details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={reporterName}
                    onChange={e => setReporterName(e.target.value)}
                    placeholder={isFarmer ? 'e.g. Ramesh Patel' : 'e.g. Krishna Traders'}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Your Contact Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={reporterPhone}
                    onChange={e => setReporterPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={reporterEmail}
                    onChange={e => setReporterEmail(e.target.value)}
                    placeholder="contact@agridirect.in"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Row 2: Category & Severity */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    {isFarmer ? 'Farmer Grievance Category *' : 'Buyer Dispute Category *'}
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    style={inputStyle}
                  >
                    {(isFarmer ? farmerCategories : buyerCategories).map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Urgency / Impact Level
                  </label>
                  <select
                    value={severity}
                    onChange={e => setSeverity(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="Critical">🔴 Critical (Immediate Financial Loss / Perishable)</option>
                    <option value="High">🟠 High (Payment Overdue &gt; 48 Hours)</option>
                    <option value="Medium">🟡 Medium (Quality or Weight Discrepancy)</option>
                    <option value="Low">🟢 Low (General Dispute / Query)</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Accused Reported Counterparty & Lot ID */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    {isFarmer ? 'Reported Buyer / Trader Name (Subject to Suspension) *' : 'Reported Farmer / Seller Name (Subject to Suspension) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={counterpartyName}
                    onChange={e => setCounterpartyName(e.target.value)}
                    placeholder={isFarmer ? 'e.g. Apex Wholesale Foods' : 'e.g. Ravi Kumar Farms'}
                    style={inputStyle}
                  />
                  <small style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 3, display: 'block' }}>
                    The Admin Complaint Box has the power to suspend this party upon inspection.
                  </small>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Associated Lot ID or Transaction Ref (Optional)
                  </label>
                  <input
                    type="text"
                    value={lotId}
                    onChange={e => setLotId(e.target.value)}
                    placeholder="e.g. L001 or LOT-2026-TOM"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Row 4: Detailed Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Detailed Description of Dispute &amp; Loss *
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={
                    isFarmer
                      ? 'Describe what occurred: agreed sale rate, date of produce dispatch, failure of buyer to release payment, or illegal weighment cuts...'
                      : 'Describe what occurred: produce received, percentage of spoiled or rotten cargo, mismatch with AI certificate, or weight deficit...'
                  }
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    minHeight: 110,
                    lineHeight: 1.5,
                  }}
                />
              </div>

              {/* Row 5: Photo Evidence Attachment */}
              <div style={{
                background: '#F8FAFC', border: '1.5px dashed #CBD5E1', borderRadius: 12,
                padding: '1.25rem', textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>📷</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1E293B' }}>
                  {isFarmer
                    ? 'Attach Farmer Evidence (Weighment Slips, Mandi Receipts, Payment Proofs)'
                    : 'Attach Buyer Evidence (Photos of Rotten/Damaged Crop, Weighbridge Slips)'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '0.75rem' }}>
                  JPG, PNG, or WebP up to 5MB
                </div>
                <input
                  type="file"
                  id="evidence-file-input"
                  accept="image/*"
                  onChange={handleEvidenceUpload}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('evidence-file-input')?.click()}
                  style={{
                    background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 8,
                    padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: 600,
                    color: '#334155', cursor: 'pointer'
                  }}
                >
                  📁 Select Evidence Photo
                </button>

                {evidencePreview && (
                  <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                    <img
                      src={evidencePreview}
                      alt="Evidence preview"
                      style={{ width: 68, height: 68, objectFit: 'cover', borderRadius: 8, border: '1px solid #CBD5E1' }}
                    />
                    <span style={{ fontSize: '0.8rem', color: '#16A34A', fontWeight: 700 }}>
                      ✓ Evidence Attached
                    </span>
                    <button
                      type="button"
                      onClick={() => setEvidencePreview('')}
                      style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  id="submit-dispute-btn"
                  className="btn btn-primary"
                  style={{
                    padding: '0.85rem 2.25rem',
                    fontSize: '0.95rem',
                    background: isFarmer ? 'linear-gradient(135deg, #052E2B, #10B981)' : 'linear-gradient(135deg, #1E1B4B, #6366F1)',
                    border: 'none',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                  }}
                >
                  📢 Submit {isFarmer ? 'Farmer' : 'Buyer'} Report to Admin Complaint Box
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

const inputStyle = {
  width: '100%',
  padding: '0.65rem 0.9rem',
  borderRadius: 8,
  border: '1.5px solid #CBD5E1',
  background: '#FFFFFF',
  fontFamily: 'var(--font-body)',
  fontSize: '0.88rem',
  color: '#0F172A',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s ease',
};
