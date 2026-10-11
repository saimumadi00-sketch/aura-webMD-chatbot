import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, ArrowUpRight, Brain, Check, ChevronRight, Heart, Leaf, Search, Video, X } from 'lucide-react';
import '../styles/doctor-portal.css';

const doctors = [
  { id: 1, name: 'Dr. Maya Rahman', field: 'Psychiatry', initials: 'MR', gradient: 'linear-gradient(135deg, #007cf0, #00dfd8)', focus: 'Anxiety · Life transitions', approach: 'A thoughtful space to understand yourself, one conversation at a time.' },
  { id: 2, name: 'Dr. Arif Hasan', field: 'Clinical psychology', initials: 'AH', gradient: 'linear-gradient(135deg, #7928ca, #ff0080)', focus: 'Stress · Emotional wellbeing', approach: 'Small, practical steps toward a life that feels more like yours.' },
  { id: 3, name: 'Dr. Sara Ahmed', field: 'Counselling', initials: 'SA', gradient: 'linear-gradient(135deg, #ff4d4d, #f9cb28)', focus: 'Relationships · Self-discovery', approach: 'Bring your whole self. There is room for every part of your story.' },
];

export default function DoctorPortal() {
  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('All specialists');
  const [selected, setSelected] = useState(null);
  const [slot, setSlot] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const dialogRef = useRef(null);
  const directoryRef = useRef(null);
  const filtered = doctors.filter(doctor => (specialty === 'All specialists' || doctor.field === specialty) && `${doctor.name} ${doctor.field} ${doctor.focus}`.toLowerCase().includes(query.toLowerCase()));
  const openProfile = doctor => { setSelected(doctor); setSlot(''); setReviewed(false); dialogRef.current.showModal(); };
  const scrollToDoctors = () => directoryRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });

  return (
    <div className="doctor-portal">
      <header className="portal-header">
        <div className="portal-nav">
          <Link to="/" className="portal-logo" aria-label="Aura home"><Brain size={22} />Aura<span className="portal-logo-tag">human care</span></Link>
          <nav aria-label="Doctor portal" className="portal-links"><button onClick={scrollToDoctors}>Find your specialist</button><Link to="/chat" className="portal-link-optional">Talk to Aura</Link><Link to="/login" className="portal-btn portal-btn--primary portal-btn--sm">Sign in <ArrowUpRight size={15} /></Link></nav>
        </div>
      </header>

      <main>
        <section className="portal-hero">
          <div className="portal-mesh" aria-hidden="true" />
          <p className="portal-badge"><span aria-hidden="true" />A little connection. A new perspective.</p>
          <h1>Your mind. A world of possibilities.</h1>
          <p className="portal-lead">Sometimes, the next step is a real conversation. Find a specialist who makes space for you.</p>
          <div className="portal-actions">
            <button onClick={scrollToDoctors} className="portal-btn portal-btn--primary">Find your person <ArrowUpRight size={18} /></button>
            <Link to="/chat" className="portal-btn portal-btn--secondary">Talk to Aura first</Link>
          </div>
          <p className="portal-note"><Heart size={14} /><span>Human connection, at your own pace.</span></p>
        </section>

        <section className="portal-steps">
          {[['01', 'Start where you are', 'No perfect words needed.'], ['02', 'Find your connection', 'Explore different specialities.'], ['03', 'Take a small next step', 'Choose a conversation that fits.']].map(([number, title, description]) => <div key={number} className="portal-step"><span>{number}</span><div><h2>{title}</h2><p>{description}</p></div></div>)}
        </section>

        <section ref={directoryRef} className="portal-directory">
          <div className="portal-section-heading"><div><p className="portal-eyebrow">People, not just profiles</p><h2>Someone to meet you where you are.</h2></div><ArrowDown size={22} strokeWidth={1.5} /></div>
          <p className="portal-disclaimer">Design preview · Illustrative profiles and times. No real appointments can be booked here yet.</p>
          <div className="portal-filters"><label className="portal-search"><Search size={16} /><input aria-label="Search specialists" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search a name, speciality, or what’s on your mind" /></label><select aria-label="Filter by speciality" value={specialty} onChange={event => setSpecialty(event.target.value)} className="portal-select">{['All specialists', 'Psychiatry', 'Clinical psychology', 'Counselling'].map(value => <option key={value}>{value}</option>)}</select></div>
          <div className="portal-grid">{filtered.map(doctor => <article key={doctor.id} className="portal-card">
            <div className="portal-portrait" style={{ background: doctor.gradient }}><span className="portal-initials">{doctor.initials}</span><span className="portal-chip">Sample profile</span><span className="portal-video"><Video size={16} /></span></div>
            <div className="portal-card-body"><p className="portal-eyebrow">{doctor.field}</p><h3>{doctor.name}</h3><p className="portal-focus">{doctor.focus}</p><p className="portal-approach">{doctor.approach}</p><button onClick={() => openProfile(doctor)} className="portal-card-cta">Explore profile <ArrowUpRight size={16} /></button></div>
          </article>)}</div>
          {!filtered.length && <div className="portal-empty"><p>No specialists match your search.</p><button onClick={() => { setQuery(''); setSpecialty('All specialists'); }}>Clear filters</button></div>}
        </section>

        <section className="portal-band"><div className="portal-band-inner"><div className="portal-band-copy"><Leaf size={24} aria-hidden="true" /><div><h2>Not sure where to begin?</h2><p>You can start by talking things through with Aura.</p></div></div><Link to="/chat" className="portal-btn portal-btn--inverse">Start a conversation <ArrowRight size={17} /></Link></div></section>
      </main>
      <footer className="portal-footer"><span className="portal-mono">aura / human care</span><span>A little more understood. A little more you.</span><Link to="/">Back to Aura <ChevronRight size={12} /></Link></footer>

      <dialog ref={dialogRef} className="portal-dialog" aria-labelledby="doctor-profile-title" onClick={event => { if (event.target === event.currentTarget) dialogRef.current.close(); }}>
        {selected && <div className="portal-dialog-body"><div className="portal-dialog-top"><span className="portal-eyebrow">Profile preview</span><button autoFocus aria-label="Close profile" onClick={() => dialogRef.current.close()} className="portal-icon-btn"><X size={18} /></button></div><h2 id="doctor-profile-title">{selected.name}</h2><p className="portal-focus">{selected.field} · {selected.focus}</p><p className="portal-dialog-approach">{selected.approach}</p><p className="portal-dialog-label">Explore an example video session</p><div className="portal-slots">{['Morning · 10:00', 'Afternoon · 14:30', 'Evening · 18:00'].map(time => <button key={time} aria-pressed={slot === time} onClick={() => { setSlot(time); setReviewed(false); }} className="portal-slot">{time}</button>)}</div><button disabled={!slot} onClick={() => setReviewed(true)} className="portal-btn portal-btn--primary portal-btn--block">Review selection <ArrowRight size={16} /></button>{reviewed && <p role="status" className="portal-status"><Check size={18} />{slot} selected for this preview. No appointment has been requested or booked.</p>}<p className="portal-fineprint">These profiles and times are illustrative. Live availability and booking will appear when a doctor directory is connected.</p></div>}
      </dialog>
    </div>
  );
}
