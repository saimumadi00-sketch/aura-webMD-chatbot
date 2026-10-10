import React, { useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronRight, Heart, Leaf, Search, Sparkles, Video, X } from 'lucide-react';
import '../styles/doctor-portal.css';

const doctors = [
  { id: 1, name: 'Dr. Maya Rahman', field: 'Psychiatry', initials: 'MR', color: '#d8dfcd', focus: 'Anxiety · Life transitions', approach: 'A thoughtful space to understand yourself, one conversation at a time.' },
  { id: 2, name: 'Dr. Arif Hasan', field: 'Clinical psychology', initials: 'AH', color: '#e8d4bf', focus: 'Stress · Emotional wellbeing', approach: 'Small, practical steps toward a life that feels more like yours.' },
  { id: 3, name: 'Dr. Sara Ahmed', field: 'Counselling', initials: 'SA', color: '#d8d4e5', focus: 'Relationships · Self-discovery', approach: 'Bring your whole self. There is room for every part of your story.' },
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
    <div className="doctor-portal min-h-screen bg-[#f7f6f0] text-[#253b31]">
      <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-6 py-7 lg:px-12">
        <a href="#/" className="flex items-center gap-2 text-2xl font-semibold tracking-tight" aria-label="Aura home"><span className="portal-brand"><Sparkles size={22} /></span>aura<span className="ml-2 border-l border-[#253b31]/20 pl-4 text-xs font-normal tracking-wide">human care</span></a>
        <nav aria-label="Doctor portal" className="flex items-center gap-7 text-sm"><button onClick={scrollToDoctors}>Find your specialist</button><a href="#/chat" className="hidden sm:block">Talk to Aura</a><a href="#/login" className="flex items-center gap-3 rounded-full border border-[#253b31]/25 px-5 py-3">Sign in <ArrowUpRight size={15} /></a></nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-16 pt-8 lg:grid-cols-2 lg:px-12 lg:py-16">
          <div className="relative z-10">
            <p className="mb-7 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em]"><span className="h-1.5 w-1.5 rounded-full bg-[#728765]" /> A little connection. A new perspective.</p>
            <h1 className="portal-serif text-6xl leading-[1.05] tracking-[-0.055em] sm:text-7xl lg:text-[88px]">Your mind.<br />A world of<br /><em className="text-[#7a8967]">possibilities.</em></h1>
            <p className="mb-8 mt-7 max-w-sm text-base leading-7 text-[#697268]">Sometimes, the next step is a real conversation. Find a specialist who makes space for you.</p>
            <button onClick={scrollToDoctors} className="inline-flex items-center gap-7 rounded-full bg-[#293f32] px-7 py-4 text-sm text-white transition hover:bg-[#456047]">Find your person <ArrowUpRight size={18} /></button>
            <div className="mt-9 flex items-center gap-3 text-xs text-[#697268]"><Heart size={15} /><span>Human connection, at your own pace.</span></div>
          </div>
          <div className="portal-dream" role="img" aria-label="A surreal arch opening onto rolling sage hills, with a floating golden sun and impossible ascending steps">
            <span className="dream-orbit" /><span className="dream-sphere" />
            <div className="dream-arch"><div className="dream-sun" /><div className="dream-hill hill-back" /><div className="dream-hill hill-front" /><div className="dream-path" /></div>
            <div className="dream-stairs"><i /><i /><i /><i /><i /></div>
            <span className="dream-pebble" /><span className="dream-caption">THERE IS MORE THAN ONE WAY FORWARD</span>
            <div className="dream-note"><Leaf size={19} /><span>A space to grow.<br /><strong>A person to guide you.</strong></span></div>
            <span className="dream-star">✳</span>
          </div>
        </section>

        <section className="border-y border-[#253b31]/10 bg-[#eeeee5]">
          <div className="mx-auto grid max-w-7xl gap-7 px-6 py-7 sm:grid-cols-3 lg:px-12">{[['01', 'Start where you are', 'No perfect words needed.'], ['02', 'Find your connection', 'Explore different specialities.'], ['03', 'Take a small next step', 'Choose a conversation that fits.']].map(([number, title, description]) => <div key={number} className="flex items-center gap-5"><span className="portal-serif text-3xl italic text-[#8b987a]">{number}</span><div><h2 className="text-sm font-medium">{title}</h2><p className="mt-1 text-xs text-[#697268]">{description}</p></div></div>)}</div>
        </section>

        <section ref={directoryRef} className="mx-auto max-w-7xl scroll-mt-6 px-6 py-16 lg:px-12">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-[#74836b]">People, not just profiles</p><h2 className="portal-serif text-4xl tracking-tight sm:text-5xl">Someone to meet you <em>where you are.</em></h2></div><ArrowDown size={24} strokeWidth={1} /></div>
          <p className="mb-6 text-xs text-[#697268]">Design preview · Illustrative profiles and times. No real appointments can be booked here yet.</p>
          <div className="mb-8 flex flex-wrap items-center gap-4"><label className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-[#253b31]/15 bg-white/50 px-5 py-3"><Search size={17} /><input aria-label="Search specialists" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search a name, speciality, or what’s on your mind" className="min-w-0 w-full bg-transparent text-sm outline-none" /></label><select aria-label="Filter by speciality" value={specialty} onChange={event => setSpecialty(event.target.value)} className="rounded-full border border-[#253b31]/15 bg-transparent px-5 py-3 text-sm">{['All specialists', 'Psychiatry', 'Clinical psychology', 'Counselling'].map(value => <option key={value}>{value}</option>)}</select></div>
          <div className="grid gap-6 md:grid-cols-3">{filtered.map(doctor => <article key={doctor.id} className="group overflow-hidden rounded-[20px] border border-[#253b31]/10 bg-[#fcfbf6]">
            <div className="portal-portrait relative flex h-52 items-end justify-center overflow-hidden" style={{ background: doctor.color }}><span className="portrait-orbit" /><div className="portrait-silhouette"><span>{doctor.initials}</span></div><span className="absolute left-4 top-4 rounded-full bg-white/70 px-3 py-1 text-[10px] tracking-wide">Sample profile</span><span className="absolute bottom-4 right-4 rounded-full bg-white/70 p-2"><Video size={16} /></span></div>
            <div className="p-6"><p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-[#738469]">{doctor.field}</p><h3 className="portal-serif text-2xl">{doctor.name}</h3><p className="mt-2 text-xs text-[#697268]">{doctor.focus}</p><p className="mb-6 mt-4 text-sm leading-6 text-[#697268]">{doctor.approach}</p><button onClick={() => openProfile(doctor)} className="flex w-full items-center justify-between border-t border-[#253b31]/10 pt-4 text-sm font-medium">Explore profile <ArrowUpRight size={17} className="transition group-hover:-translate-y-1 group-hover:translate-x-1" /></button></div>
          </article>)}</div>
          {!filtered.length && <div className="rounded-2xl border border-dashed border-[#253b31]/20 p-10 text-center"><p>No specialists match your search.</p><button className="mt-4 underline" onClick={() => { setQuery(''); setSpecialty('All specialists'); }}>Clear filters</button></div>}
        </section>

        <section className="mx-6 mb-12 flex max-w-6xl flex-wrap items-center justify-between gap-8 rounded-[24px] bg-[#e5e8dc] px-8 py-10 lg:mx-auto lg:px-12"><div className="flex items-center gap-6"><span className="portal-serif text-6xl text-[#879576]" aria-hidden="true">✳</span><div><h2 className="portal-serif text-3xl">Not sure where to begin?</h2><p className="mt-2 text-sm text-[#697268]">You can start by talking things through with Aura.</p></div></div><a href="#/chat" className="flex items-center gap-5 rounded-full border border-[#253b31]/25 px-6 py-3 text-sm">Start a conversation <ArrowRight size={17} /></a></section>
      </main>
      <footer className="mx-auto flex max-w-7xl flex-wrap justify-between gap-4 border-t border-[#253b31]/10 px-6 py-7 text-xs text-[#697268] lg:px-12"><span>aura / human care</span><span>A little more understood. A little more you.</span><a href="#/">Back to Aura <ChevronRight className="inline" size={12} /></a></footer>

      <dialog ref={dialogRef} className="portal-dialog" onClick={event => { if (event.target === event.currentTarget) dialogRef.current.close(); }}>
        {selected && <div className="p-7 sm:p-10"><div className="mb-6 flex items-center justify-between"><span className="text-xs uppercase tracking-widest">Profile preview</span><button autoFocus aria-label="Close profile" onClick={() => dialogRef.current.close()} className="rounded-full border border-[#253b31]/20 p-2"><X size={18} /></button></div><h2 className="portal-serif text-4xl">{selected.name}</h2><p className="mt-2 text-sm text-[#697268]">{selected.field} · {selected.focus}</p><p className="my-6 leading-7">{selected.approach}</p><p className="mb-3 text-sm font-medium">Explore an example video session</p><div className="flex flex-wrap gap-2">{['Morning · 10:00', 'Afternoon · 14:30', 'Evening · 18:00'].map(time => <button key={time} aria-pressed={slot === time} onClick={() => { setSlot(time); setReviewed(false); }} className={`rounded-full border px-4 py-3 text-xs ${slot === time ? 'border-[#293f32] bg-[#293f32] text-white' : 'border-[#253b31]/20'}`}>{time}</button>)}</div><button disabled={!slot} onClick={() => setReviewed(true)} className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-[#293f32] px-5 py-4 text-sm text-white disabled:opacity-40">Review selection <ArrowRight size={16} /></button>{reviewed && <p role="status" className="mt-4 flex gap-2 text-sm"><Check size={18} className="shrink-0" />{slot} selected for this preview. No appointment has been requested or booked.</p>}<p className="mt-5 text-xs leading-5 text-[#697268]">These profiles and times are illustrative. Live availability and booking will appear when a doctor directory is connected.</p></div>}
      </dialog>
    </div>
  );
}
