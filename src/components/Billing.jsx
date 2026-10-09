/*
 * Pricing preview: shared controls update all cards; only the free plan is available.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  ArrowLeft,
  Heart,
  Sun,
  ShieldCheck,
  Brain,
  Building2,
  Stethoscope,
  Users,
} from "lucide-react";
import "../styles/billing.css";
import ThemeToggle from './ThemeToggle';
import { getPlanPrice } from '../utils/plan-price';

export default function Billing({ onBack, onSelectPlan, user, isGuest, theme, onToggleTheme }) {
  const [billingCycle, setBillingCycle] = useState("yearly");
  const [planType, setPlanType] = useState("personal");
  const navigate = useNavigate();

  // Embedded billing uses the parent view action; route-based billing falls back to /chat.
  const handleBack = () => {
    if (typeof onBack === "function") {
      onBack();
      return;
    }
    if (navigate) {
      navigate("/chat");
    } else if (window?.history?.length) {
      window.history.back();
    }
  };

  // Selection describes intent only: this component does not charge or activate a subscription.
  const handleSelect = (planId) => {
    if (typeof onSelectPlan === "function") {
      onSelectPlan(planId, { planType, billingCycle, user, isGuest });
    }
  };

  // Static display data: IDs go to the parent and prices share the selected billing cycle.
  const plans = {
    personal: [
      {
        id: "seeker",
        name: "Seeker",
        tagline: "Begin your wellness journey",
        icon: Sun,
        price: { monthly: 0, yearly: 0 },
        buttonText: "Chat with Aura free",
        buttonStyle: "outline",
        highlight: false,
        features: [
          "Supportive AI conversations",
          "Guest chat without an account",
          "Adjustable tone and response style",
          "Conversation archives on this device",
          "PDF conversation summaries",
        ],
      },
      {
        id: "growth",
        name: "Growth",
        tagline: "Deepen your practice & insight",
        icon: Heart,
        price: { monthly: 15, yearly: 12 },
        buttonText: "Start Growth trial",
        buttonStyle: "white",
        highlight: false,
        features: [
          "Unlimited AI therapy chat sessions",
          "Advanced CBT & DBT tools",
          "Sleep stories & ambient soundscapes",
          "Weekly emotional insight reports",
          "Journaling with sentiment analysis",
          "Integration with Apple Health / Google Fit",
          { text: "Includes Aura Cognitive Engine", icon: Brain, color: "accent" },
        ],
      },
      {
        id: "heal",
        name: "Heal",
        tagline: "Full support with human connection",
        icon: ShieldCheck,
        price: { monthly: 100, yearly: 85 },
        buttonText: "Get Heal plan",
        buttonStyle: "white",
        highlight: true,
        features: [
          "1:1 Matching with a licensed therapist",
          "Weekly video sessions (45 mins)",
          "Priority 24/7 crisis support line",
          "Family plan access (up to 4 members)",
          "Prescription management & delivery",
          { text: "Includes Aura Cognitive Engine", icon: Brain, color: "accent" },
        ],
      },
    ],
    clinical: [
      {
        id: "practice",
        name: "Practice",
        tagline: "For solo practitioners",
        icon: Stethoscope,
        price: { monthly: 199, yearly: 169 },
        buttonText: "Start Practice trial",
        buttonStyle: "outline",
        highlight: false,
        features: [
          "Patient management dashboard",
          "Secure HIPAA-compliant chat",
          "Appointment scheduling",
          "Basic billing & invoicing",
          "Up to 50 active patients",
        ],
      },
      {
        id: "clinic",
        name: "Clinic",
        tagline: "For growing mental health teams",
        icon: Building2,
        price: { monthly: 499, yearly: 399 },
        buttonText: "Get Clinic plan",
        buttonStyle: "white",
        highlight: false,
        features: [
          "Everything in Practice",
          "Multi-provider support (up to 10)",
          "Shared patient records",
          "Advanced analytics & reporting",
          "Custom branding for patient app",
          "Receptionist access role",
        ],
      },
      {
        id: "network",
        name: "Network",
        tagline: "For hospitals & large networks",
        icon: Users,
        price: { monthly: "Custom", yearly: "Custom" },
        buttonText: "Contact Sales",
        buttonStyle: "white",
        highlight: true,
        features: [
          "Unlimited providers & patients",
          "EHR Integration (Epic, Cerner)",
          "SAML SSO & Enterprise security",
          "Dedicated success manager",
          "24/7 SLA support",
          { text: "API Access for custom tools", icon: Brain, color: "accent" },
        ],
      },
    ],
  };

  const currentPlans = plans[planType];

  const currency = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

  return (
    <div className="billing-page">
      <div className="billing-shell">
        <header className="billing-header">
          <div className="billing-topbar">
            <button type="button" className="billing-back" onClick={handleBack}><ArrowLeft size={18} aria-hidden="true" /><span>Back</span></button>
            <a className="billing-brand" href="#/">Aura</a>
            <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
          </div>
          <div className="billing-heading">
            <p className="billing-eyebrow">AURA PLANS</p>
            <h1 className="billing-title">Support at your own pace.</h1>
            <p>Start with free chat. Explore what's planned for individuals and teams.</p>
          </div>
        </header>

        <div className="billing-controls">
          <fieldset><legend>Plan type</legend><div className="billing-toggle">
            <button type="button" className={`toggle-btn ${planType === 'personal' ? 'active' : ''}`} aria-pressed={planType === 'personal'} onClick={() => setPlanType('personal')}>Personal</button>
            <button type="button" className={`toggle-btn ${planType === 'clinical' ? 'active' : ''}`} aria-pressed={planType === 'clinical'} onClick={() => setPlanType('clinical')}>Clinics &amp; Teams</button>
          </div></fieldset>
          <fieldset><legend>Preview billing frequency</legend><div className="cycle-toggle">
            <button type="button" className={`cycle-btn ${billingCycle === 'monthly' ? 'active' : ''}`} aria-pressed={billingCycle === 'monthly'} onClick={() => setBillingCycle('monthly')}>Monthly</button>
            <button type="button" className={`cycle-btn ${billingCycle === 'yearly' ? 'active' : ''}`} aria-pressed={billingCycle === 'yearly'} onClick={() => setBillingCycle('yearly')}>Yearly</button>
          </div></fieldset>
        </div>
        <p role="status" className="billing-availability">Free chat is available now. Paid plans and their listed features are previews; purchasing is not available.</p>
        <section className="plan-grid" aria-label={planType === 'personal' ? 'Personal plans' : 'Clinic and team plans'}>
          {currentPlans.map(plan => {
            const free = plan.id === 'seeker';
            const pricing = getPlanPrice(plan.price, billingCycle);
            return <article key={plan.id} className={`plan-card ${free ? 'plan-card--available' : ''}`}>
              <div className="plan-status"><span className={free ? 'plan-badge available' : 'plan-badge'}>{free ? 'Available now' : 'Planned'}</span></div>
              <div className="plan-top"><div className="plan-icon"><plan.icon size={24} strokeWidth={1.7} aria-hidden="true" /></div><div><h2 className="plan-name">{plan.name}</h2><p className="plan-tagline">{plan.tagline}</p></div></div>
              <div className="plan-price-area">
                <div className="plan-price"><span className="price-value">{typeof pricing.amount === 'number' ? currency(pricing.amount) : pricing.amount}</span>{typeof pricing.amount === 'number' && !free && <span className="price-suffix">/ month</span>}</div>
                <p className="plan-charge">{free ? 'No payment required' : pricing.total !== null ? `${currency(pricing.total)} billed annually` : typeof pricing.amount === 'number' ? 'Billed monthly' : 'Pricing to be confirmed'}</p>
                <div className="plan-savings">{pricing.savings > 0 && <span>Save {pricing.savings}% compared with monthly</span>}</div>
              </div>
              <button type="button" className="plan-cta" disabled={!free} onClick={() => handleSelect(plan.id)}>{free ? 'Chat with Aura free' : 'Not available yet'}</button>
              <div className="plan-divider" />
              <div className="plan-features"><h3 className="plan-subtitle">{free ? 'Included with free chat' : 'Planned features'}</h3>{plan.features.map((feature, i) => <FeatureItem key={i} data={feature} />)}</div>
            </article>;
          })}
        </section>
        <footer className="billing-footer">Preview prices are in USD and exclude applicable taxes. No payment is taken on this page.</footer>
      </div>
    </div>
  );
}

function FeatureItem({ data }) {
  const isSpecial = typeof data === "object";
  const text = isSpecial ? data.text : data;
  const Icon = isSpecial ? data.icon : Check;
  const isAccent = isSpecial && data.color === "accent";

  return (
    <div className="feature-row">
      <Icon size={16} strokeWidth={2.2} className={`feature-icon ${isAccent ? "feature-icon--accent" : ""}`} />
      <span className={`feature-text ${isAccent ? "feature-text--accent" : ""}`}>{text}</span>
    </div>
  );
}
