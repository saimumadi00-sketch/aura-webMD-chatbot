import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  Sparkles,
  MessageCircle,
  Shield,
  Heart,
  Brain,
  ChevronRight,
  Activity,
  Zap,
} from "lucide-react";
import "../styles/landing.css";

const Reveal = ({ children, className = "", delay = 0 }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal-base ${visible ? "reveal-show" : ""} ${className}`}
    >
      {children}
    </div>
  );
};

const featureCards = [
  { icon: Heart, title: "Deep Empathy", desc: "Aura understands context and emotion, not just keywords, ensuring you feel truly heard." },
  { icon: Shield, title: "Private & Secure", desc: "Your conversations are encrypted end-to-end. We prioritize your anonymity above all else." },
  { icon: Activity, title: "Mood Tracking", desc: "Visual insights into your emotional patterns over time to help you identify triggers." },
  { icon: Brain, title: "CBT Techniques", desc: "Guided exercises based on Cognitive Behavioral Therapy to help manage anxiety." },
  { icon: Zap, title: "Instant Support", desc: "Mental health doesn't follow business hours. Aura is ready whenever you are, 24/7." },
  { icon: MessageCircle, title: "Adaptive Tone", desc: "Whether you need a gentle listener or a motivational coach, Aura adapts to your needs." },
];

const SpotlightCard = ({ icon: Icon, title, desc }) => {
  const cardRef = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  const handleMove = (e) => {
    if (!cardRef.current || !active) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onMouseMove={handleMove}
      className="spotlight-card group"
      style={{
        "--spot-x": `${pos.x}px`,
        "--spot-y": `${pos.y}px`,
      }}
    >
      <div className="spotlight-inner">
        <div className="spotlight-icon">
          <Icon size={26} strokeWidth={1.8} />
        </div>
        <h3>{title}</h3>
        <p>{desc}</p>
      </div>
    </div>
  );
};

export default function LandingPage({ onStart, onLogin }) {
  const containerRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);
  const features = useMemo(() => featureCards, []);

  useEffect(() => {
    document.body.classList.add("landing-open");
    return () => document.body.classList.remove("landing-open");
  }, []);

  useEffect(() => {
    const handleMouse = (e) => {
      if (!containerRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      containerRef.current.style.setProperty("--mouse-x", x.toFixed(3));
      containerRef.current.style.setProperty("--mouse-y", y.toFixed(3));
    };
    const handleScroll = () => {
      const current = window.scrollY || 0;
      setScrollY(current);
      if (containerRef.current) {
        const max = Math.max(
          (document.documentElement?.scrollHeight || 0) - window.innerHeight,
          1
        );
        const progress = Math.min(1, current / max);
        containerRef.current.style.setProperty("--scroll-progress", progress.toFixed(3));
      }
    };
    handleScroll();
    window.addEventListener("mousemove", handleMouse);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="landing" ref={containerRef}>
      <div className="landing-bg" />

      <header className={`landing-nav ${scrollY > 50 ? "nav-scrolled" : ""}`}>
        <div className="nav-brand">
          <Brain className="brand-icon" />
          <span className="brand-name">Aura</span>
        </div>
        <nav className="nav-links">
          <a href="#features">Features</a>
          <a href="#science">Science</a>
          <a href="#reviews">Reviews</a>
        </nav>
        <button className="nav-login" onClick={() => onLogin?.()}>
          Login
        </button>
      </header>

      <main>
        <section className="hero" id="hero">
          <div className="hero-glow hero-glow-1" />
          <div className="hero-glow hero-glow-2" />

          <div className="hero-chat left tilt-small parallax-float-1 animate-float-1">
            <p>I've been feeling really overwhelmed lately...</p>
          </div>
          <div className="hero-chat right tilt-small parallax-float-2 animate-float-2">
            <div className="hero-chat-dot" />
            <div className="hero-chat-title">AURA</div>
            <p>I hear you. Let's break that down together, one step at a time.</p>
          </div>

          <Reveal delay={0}>
            <div className="hero-pill tilt-small">
              <Sparkles size={16} />
              <span>AI-Powered Emotional Intelligence</span>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <h1 className="hero-title tilt-medium parallax-hero">
              Find clarity in <br />
              <span className="text-shimmer">every conversation.</span>
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="hero-subtitle tilt-small">
              Aura is a supportive AI that blends emotional intelligence, adaptive coaching, and calm guidance to help you navigate your mental landscape with empathy.
            </p>
          </Reveal>

          <Reveal delay={280}>
            <button className="hero-cta tilt-small" onClick={() => onStart?.()}>
              <MessageCircle size={18} />
              Try Aura Now
              <ChevronRight size={16} />
            </button>
          </Reveal>
        </section>

        <section className="features" id="features">
          <Reveal>
            <h2>More than just code.</h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="section-subtitle">
              Built with advanced NLP and psychological principles to provide genuine, safe support whenever you need it.
            </p>
          </Reveal>
          <div className="feature-grid">
            {features.map(({ icon, title, desc }, idx) => (
              <Reveal key={title} delay={idx * 90}>
                <SpotlightCard icon={icon} title={title} desc={desc} />
              </Reveal>
            ))}
          </div>
        </section>

        <section className="science" id="science">
          <div className="science-copy tilt-medium">
            <Reveal>
              <div className="pill">The Technology</div>
            </Reveal>
            <Reveal delay={80}>
              <h2>Neural networks meets human compassion.</h2>
            </Reveal>
            <Reveal delay={160}>
              <p>
                We've trained Aura on thousands of hours of therapeutic conversations, vetted by licensed psychologists. It doesn't just predict text; it understands the nuance of human struggle and resilience.
              </p>
            </Reveal>
            <ul className="science-list">
              {["Real-time sentiment analysis", "Crisis intervention protocols", "Personalized growth plans"].map((item, i) => (
                <Reveal key={item} delay={220 + i * 80}>
                  <li>{item}</li>
                </Reveal>
              ))}
            </ul>
            <Reveal delay={480}>
              <button className="primary-btn">Read the Whitepaper</button>
            </Reveal>
          </div>

          <div className="science-blob tilt-small">
            <div className="blob-glow" />
            <div className="blob-ring ring-1 animate-morph" />
            <div className="blob-ring ring-2 animate-morph" style={{ animationDirection: "reverse", animationDuration: "9s" }} />
            <div className="blob-center">
              <div className="blob-stat">93%</div>
              <div className="blob-sub">User Satisfaction</div>
            </div>
          </div>
        </section>

        <section className="cta" id="reviews">
          <Reveal>
            <h2 className="tilt-medium">Ready to talk?</h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="tilt-small">Join 50,000+ users finding balance with Aura. Your first session is free, no credit card required.</p>
          </Reveal>
          <div className="cta-actions">
            <Reveal delay={180}>
              <button className="primary-btn tilt-small" onClick={() => onStart?.()}>Start Chatting Now</button>
            </Reveal>
            <Reveal delay={240}>
              <button className="secondary-btn tilt-small">Download iOS App</button>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="footer-brand">
          <Brain className="brand-icon" />
          <span className="brand-name">Aura</span>
        </div>
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Crisis Resources</a>
        </div>
        <div className="footer-right">© 2024 Aura AI Health. All rights reserved.</div>
      </footer>
    </div>
  );
}
