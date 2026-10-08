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

export default function Billing({ onBack, onSelectPlan, user, isGuest }) {
  const [billingCycle, setBillingCycle] = useState("yearly");
  const [planType, setPlanType] = useState("personal");
  const navigate = useNavigate();

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

  const handleSelect = (planId) => {
    if (typeof onSelectPlan === "function") {
      onSelectPlan(planId, { planType, billingCycle, user, isGuest });
    }
  };

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
          "Daily mood check-ins & tracking",
          "Basic mindfulness exercises",
          "5-minute daily guided meditation",
          "Personalized daily affirmations",
          "Access to public community forums",
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
  const title = planType === "personal" ? "Find peace of mind with Aura" : "Empower your practice with Aura";

  return (
    <div className="billing-page">
      <div className="billing-shell">
        <header className="billing-header">
          <button type="button" className="billing-back" onClick={handleBack} aria-label="Back to chat">
            <ArrowLeft size={22} />
          </button>
          <div className="billing-heading">
            <h1 className="billing-title">{title}</h1>
            <div className="billing-toggle">
              <button
                type="button"
                className={`toggle-btn ${planType === "personal" ? "active" : ""}`}
                onClick={() => setPlanType("personal")}
              >
                Personal
              </button>
              <button
                type="button"
                className={`toggle-btn ${planType === "clinical" ? "active" : ""}`}
                onClick={() => setPlanType("clinical")}
              >
                Clinics & Teams
              </button>
              <span className={`toggle-highlight ${planType}`} />
            </div>
          </div>
        </header>

        <section className="plan-grid">
          {currentPlans.map((plan, index) => (
            <article
              key={`${planType}-${plan.id}`}
              className={`plan-card ${plan.highlight ? "plan-card--highlight" : ""}`}
            >
              {plan.highlight && <div className="plan-badge">Most Popular</div>}

              <div className="plan-top">
                <div className="plan-icon">
                  <plan.icon size={28} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="plan-name">{plan.name}</h2>
                  <p className="plan-tagline">{plan.tagline}</p>
                </div>
                {index === 1 && (
                  <div className="cycle-toggle">
                    <button
                      type="button"
                      className={`cycle-btn ${billingCycle === "monthly" ? "active" : ""}`}
                      onClick={() => setBillingCycle("monthly")}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      className={`cycle-btn ${billingCycle === "yearly" ? "active" : ""}`}
                      onClick={() => setBillingCycle("yearly")}
                    >
                      Yearly <span className="cycle-save">· Save 20%</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="plan-price">
                {typeof plan.price.monthly === "number" ? (
                  <>
                    {plan.price.monthly > 0 && <span className="price-prefix">From</span>}
                    <span className="price-value">
                      ${billingCycle === "yearly" ? plan.price.yearly : plan.price.monthly}
                    </span>
                    {plan.price.monthly > 0 && (
                      <span className="price-suffix">
                        / month {billingCycle === "yearly" ? "billed annually" : "billed monthly"}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="price-value">{plan.price.monthly}</span>
                )}
              </div>

              <button
                type="button"
                className={`plan-cta ${plan.buttonStyle === "white" ? "plan-cta--solid" : "plan-cta--ghost"}`}
                onClick={() => handleSelect(plan.id)}
              >
                {plan.buttonText}
              </button>

              <div className="plan-divider" />

              <div className="plan-features">
                {index > 0 && (
                  <p className="plan-subtitle">
                    Everything in {currentPlans[index - 1].name}, plus:
                  </p>
                )}
                {plan.features.map((feature, i) => (
                  <FeatureItem key={i} data={feature} />
                ))}
              </div>
            </article>
          ))}
        </section>

        <footer className="billing-footer">
          <a href="#" className="billing-note">
            *Therapy services provided by partner clinics.
          </a>{" "}
          Prices shown don&apos;t include applicable tax.
        </footer>
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
