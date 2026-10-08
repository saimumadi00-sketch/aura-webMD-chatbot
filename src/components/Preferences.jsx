import React, { useEffect, useState } from 'react';
import {
  User,
  Bot,
  Shield,
  Moon,
  Sun,
  Save,
  CheckCircle,
  Cpu,
  Zap,
  LogOut,
  LogIn,
  AlertCircle,
  Sparkles,
  Lock,
  Info
} from 'lucide-react';
import "../styles/preferences.css";

// --- Custom Animations ---
const AnimationStyles = () => (
  <style>{`
    @keyframes slideUpFade {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-slide-up {
      animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .animate-scale-in {
      animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .stagger-1 { animation-delay: 50ms; }
    .stagger-2 { animation-delay: 100ms; }
    .stagger-3 { animation-delay: 150ms; }
    @keyframes fadeBlur {
      from { opacity: 0; transform: translateY(6px) scale(0.995); filter: blur(4px); }
      to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
    }
    .animate-fade-blur {
      animation: fadeBlur 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `}</style>
);

// --- Components ---

const Toggle = ({ enabled, onChange, label, description, disabled }) => (
  <div className={`group flex items-center justify-between py-4 transition-opacity duration-300 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-100'}`}>
    <div className="flex flex-col">
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{label}</span>
      {description && <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</span>}
    </div>
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 ${
        enabled ? 'bg-indigo-600 shadow-lg shadow-indigo-600/30' : 'bg-gray-200 dark:bg-gray-700'
      } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-all duration-300 cubic-bezier(0.4, 0.0, 0.2, 1) ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

const RangeSlider = ({ value, onChange, min, max, step, label, leftLabel, rightLabel, disabled }) => {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className={`range-shell py-4 group ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex justify-between items-center mb-3">
        <label className="text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
          {label}
        </label>
        <span className="range-value-pill text-sm font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md min-w-[3rem] text-center transition-all">{value}</span>
      </div>
      <div className="range-track relative w-full rounded-lg cursor-pointer">
        <div 
          className="range-fill absolute h-full rounded-lg transition-all duration-150 ease-out"
          style={{ width: `${percentage}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="range-input absolute w-full h-full opacity-0 cursor-pointer"
        />
        <div 
          className="range-thumb absolute bg-white border-2 border-indigo-600 rounded-full shadow-md pointer-events-none transition-all duration-150 ease-out transform -translate-y-1/2 -translate-x-1/2 group-hover:scale-110"
          style={{ left: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
};

const SelectCard = ({ selected, onClick, icon: Icon, title, description, disabled }) => (
  <div 
    onClick={() => !disabled && onClick()}
    className={`relative overflow-hidden cursor-pointer border rounded-2xl p-5 flex items-start space-x-4 transition-all duration-300 ${
      selected
        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 shadow-md shadow-indigo-200 dark:shadow-none transform scale-[1.02]'
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700/60 hover:-translate-y-1'
    } ${disabled ? 'opacity-50 cursor-not-allowed hover:transform-none hover:shadow-none' : 'active:scale-[0.98]'}`}
  >
    <div className={`p-3 rounded-xl transition-colors duration-300 ${selected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 group-hover:bg-white'}`}>
      <Icon size={24} />
    </div>
    <div className="flex-1">
      <h3 className={`font-bold text-sm transition-colors duration-300 ${selected ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-gray-100'}`}>{title}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{description}</p>
    </div>
    <div className={`absolute top-4 right-4 transition-all duration-300 transform ${selected ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
      <CheckCircle size={20} className="text-indigo-600 fill-indigo-100 dark:fill-indigo-900" />
    </div>
  </div>
);

// --- Main Preferences Component ---

export default function App({
  theme = 'dark',
  onToggleTheme,
  onHome,
  preferences = {},
  onSavePreferences,
  user: userProp,
}) {
  const isDark = theme !== 'light';
  const [activeTab, setActiveTab] = useState('ai-preferences');

  const [user, setUser] = useState(userProp || null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const defaultSettings = {
    model: 'balanced',
    creativity: 50,
    verbosity: 50,
    persona: 'helpful',
    tone: 'empathetic',
    brevity: 'concise',
    memoryEnabled: true,
    webAccess: true,
    codeExecution: false,
    customInstructions: "Be concise and professional. Avoid jargon.",
    username: 'Guest User',
    email: '',
    notifications: { email: true, push: false, productUpdates: true },
    dataSharing: false,
    historyRetention: 30,
  };

  const [settings, setSettings] = useState(() => ({
    ...defaultSettings,
    ...preferences,
    persona: preferences?.persona || defaultSettings.persona,
    tone: preferences?.tone || defaultSettings.tone,
    brevity: preferences?.brevity || defaultSettings.brevity,
    creativity: preferences?.creativity ?? defaultSettings.creativity,
    verbosity: preferences?.verbosity ?? defaultSettings.verbosity,
    customInstructions: preferences?.customInstructions ?? defaultSettings.customInstructions,
    memoryEnabled: preferences?.memoryEnabled ?? defaultSettings.memoryEnabled,
    webAccess: preferences?.webAccess ?? defaultSettings.webAccess,
    codeExecution: preferences?.codeExecution ?? defaultSettings.codeExecution,
    dataSharing: preferences?.dataSharing ?? defaultSettings.dataSharing,
    historyRetention: preferences?.historyRetention ?? defaultSettings.historyRetention,
    notifications: preferences?.notifications
      ? { ...defaultSettings.notifications, ...preferences.notifications }
      : defaultSettings.notifications,
    model: preferences?.model || defaultSettings.model,
  }));

  useEffect(() => {
    setSettings((prev) => ({
      ...prev,
      ...defaultSettings,
      ...preferences,
      persona: preferences?.persona ?? defaultSettings.persona,
      tone: preferences?.tone ?? prev.tone ?? defaultSettings.tone,
      brevity: preferences?.brevity ?? prev.brevity ?? defaultSettings.brevity,
      creativity: preferences?.creativity ?? prev.creativity ?? defaultSettings.creativity,
      verbosity: preferences?.verbosity ?? prev.verbosity ?? defaultSettings.verbosity,
      customInstructions: preferences?.customInstructions ?? prev.customInstructions ?? defaultSettings.customInstructions,
      memoryEnabled: preferences?.memoryEnabled ?? prev.memoryEnabled ?? defaultSettings.memoryEnabled,
      webAccess: preferences?.webAccess ?? prev.webAccess ?? defaultSettings.webAccess,
      codeExecution: preferences?.codeExecution ?? prev.codeExecution ?? defaultSettings.codeExecution,
      dataSharing: preferences?.dataSharing ?? prev.dataSharing ?? defaultSettings.dataSharing,
      historyRetention: preferences?.historyRetention ?? prev.historyRetention ?? defaultSettings.historyRetention,
      notifications: preferences?.notifications
        ? { ...defaultSettings.notifications, ...preferences.notifications }
        : prev.notifications ?? defaultSettings.notifications,
      model: preferences?.model ?? prev.model ?? defaultSettings.model,
    }));
  }, [preferences]);

  useEffect(() => {
    setUser(userProp || null);
  }, [userProp]);

  const handleLogin = () => {
    setTimeout(() => {
      setUser({ 
        id: 'usr_123', 
        name: 'Alex Developer', 
        email: 'alex@example.com', 
        avatar: 'AL' 
      });
      setSettings(prev => ({ ...prev, username: 'Alex Developer', email: 'alex@example.com' }));
      setShowLoginModal(false);
      showToast('Welcome back, Alex!', 'success');
    }, 800);
  };

  const handleLogout = () => {
    setUser(null);
    setSettings(defaultSettings);
    showToast('Logged out successfully', 'neutral');
  };

  const deriveBrevity = (value) => {
    if (value >= 70) return 'detailed';
    if (value <= 30) return 'concise';
    return 'balanced';
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (typeof onSavePreferences === 'function') {
        await onSavePreferences({
          persona: settings.persona,
          tone: settings.tone || settings.persona,
          brevity: deriveBrevity(settings.verbosity),
          model: settings.model,
          creativity: settings.creativity,
          verbosity: settings.verbosity,
          memoryEnabled: settings.memoryEnabled,
          webAccess: settings.webAccess,
          codeExecution: settings.codeExecution,
          dataSharing: settings.dataSharing,
          historyRetention: settings.historyRetention,
          customInstructions: settings.customInstructions,
          notifications: settings.notifications,
        });
      }
      showToast(user ? 'Settings saved successfully' : 'Saved for this device (guest)', user ? 'success' : 'neutral');
    } catch (err) {
      showToast('Could not save preferences. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateNestedSetting = (parent, key, value) => {
    setSettings(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [key]: value }
    }));
  };

  const navItems = [
    { id: 'ai-preferences', label: 'AI Configuration', icon: Bot },
    { id: 'general', label: 'General & Profile', icon: User },
    { id: 'data', label: 'Data & Privacy', icon: Shield },
  ];

  return (
    <div
      className={`preferences-page min-h-screen ${isDark ? 'theme-dark' : 'theme-light'} transition-colors duration-500 ease-in-out`}
    >
      <AnimationStyles />
      
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-indigo-900/40 backdrop-blur-xl bg-gradient-to-r from-[#0f172a]/90 via-[#101826]/88 to-[#0b1222]/90 transition-colors duration-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onHome?.()}
            className="flex items-center space-x-3 group cursor-pointer focus:outline-none"
          >
            <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-2 rounded-xl shadow-lg shadow-indigo-600/30 transform transition-transform group-hover:rotate-12 group-hover:scale-110">
              <Cpu className="text-white h-5 w-5" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-indigo-100 drop-shadow-sm">Aura AI</span>
              <span className="h-2 w-16 rounded-full bg-gradient-to-r from-indigo-400/60 to-purple-500/60 blur-[1px]" />
            </div>
          </button>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => onToggleTheme?.()}
              className="p-2 rounded-full border border-indigo-900/40 bg-white/90 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 transition-all duration-300 hover:rotate-90 active:scale-90 shadow-sm shadow-black/30"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun size={20} className="text-yellow-400 drop-shadow" /> : <Moon size={20} className="text-indigo-500 drop-shadow" />}
            </button>
            
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 transition-colors"></div>

            {user ? (
              <button
                onClick={handleLogout}
                className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white dark:ring-gray-800 transition-transform duration-200 hover:scale-110 active:scale-95"
                title="Logout"
              >
                {user.avatar}
              </button>
            ) : (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-full border border-white/20 bg-white text-gray-900 dark:bg-gray-900 dark:text-white text-sm font-bold hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 shadow-md shadow-black/30"
                type="button"
              >
                <LogIn size={16} />
                <span>Log In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user && (
          <div className="guest-banner mb-6 rounded-2xl border flex items-start gap-4 animate-scale-in animate-fade-blur">
            <div className="guest-banner__icon">
              <Info size={18} />
            </div>
            <div className="guest-banner__text">
              <h3 className="text-sm font-bold">Guest Mode Active</h3>
              <p className="text-sm mt-1 leading-relaxed">
                You are viewing the settings as a guest. Changes will not be saved permanently until you log in.
              </p>
            </div>
          </div>
        )}

          <div className="preferences-shell flex flex-col lg:flex-row gap-8 animate-fade-blur">
          
          {/* Sidebar Navigation */}
          <nav className="preferences-sidebar lg:w-64 flex-shrink-0 z-20">
            <div className="preferences-sidebar-card space-y-2 sticky top-24 animate-fade-blur">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 group overflow-hidden ${
                    activeTab === item.id
                      ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-lg shadow-indigo-900/5 ring-1 ring-gray-200 dark:ring-gray-700 scale-100'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200 hover:scale-[1.02]'
                  }`}
                  type="button"
                >
                  {activeTab === item.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-l-xl" />
                  )}
                  <item.icon
                    size={18}
                    className={`transition-transform duration-300 ${
                      activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Content Area */}
          <div className="preferences-content flex-1 min-h-[600px]">
            <div className="preferences-panel bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-500 animate-fade-blur">
              
              {/* Toolbar */}
              <div className="preferences-panel__toolbar px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  {navItems.find(i => i.id === activeTab)?.label}
                </h2>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`save-button group relative overflow-hidden flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 active:scale-95 ${
                    isSaving ? 'is-saving' : ''
                  } ${user ? 'is-user' : 'is-guest'}`}
                >
                   {/* Shimmer effect */}
                   {!isSaving && user && <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10 pointer-events-none" />}
                   
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : user ? (
                    <Save size={18} className="transition-transform group-hover:scale-110" />
                  ) : (
                    <Lock size={18} className="transition-transform" />
                  )}
                  <span>{isSaving ? 'Saving...' : user ? 'Save Changes' : 'Save (Login Required)'}</span>
                </button>
              </div>

              <div className="p-6 lg:p-8 space-y-8 relative">
                
                {/* --- TAB: AI PREFERENCES --- */}
                {activeTab === 'ai-preferences' && (
                  <div key="tab-ai" className="space-y-8 animate-slide-up">
                    
                    {/* Model Selection */}
                    <section className="animate-slide-up stagger-1">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={16} className="text-indigo-500" />
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Core Model</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <SelectCard
                          selected={settings.model === 'fast'}
                          onClick={() => updateSetting('model', 'fast')}
                          icon={Zap}
                          title="Flash"
                          description="Lightning fast. Ideal for quick tasks."
                        />
                        <SelectCard
                          selected={settings.model === 'balanced'}
                          onClick={() => updateSetting('model', 'balanced')}
                          icon={Bot}
                          title="Standard"
                          description="Perfect balance of logic and speed."
                        />
                        <SelectCard
                          selected={settings.model === 'reasoning'}
                          onClick={() => updateSetting('model', 'reasoning')}
                          icon={Cpu}
                          title="Deep Thinker"
                          description="Superior reasoning for complex code."
                        />
                      </div>
                    </section>

                    <hr className="border-gray-100 dark:border-gray-700/50" />

                    {/* Behavior Sliders */}
                    <section className="animate-slide-up stagger-2">
                       <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Response Style</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <RangeSlider 
                          label="Creativity" 
                          value={settings.creativity} 
                          min={0} max={100} step={1}
                          onChange={(v) => updateSetting('creativity', v)}
                          leftLabel="Determinisic" 
                          rightLabel="Imaginative"
                        />
                        <RangeSlider 
                          label="Verbosity" 
                          value={settings.verbosity} 
                          min={0} max={100} step={1}
                          onChange={(v) => updateSetting('verbosity', v)}
                          leftLabel="Concise" 
                          rightLabel="Detailed"
                        />
                      </div>
                    </section>

                    <hr className="border-gray-100 dark:border-gray-700/50" />

                    {/* Capabilities */}
                    <section className="animate-slide-up stagger-3">
                       <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Capabilities</h3>
                      </div>
                      <div className="space-y-1 bg-gray-50 dark:bg-gray-900/30 rounded-2xl p-2">
                        <div className="px-4">
                          <Toggle 
                            label="Web Search Access"
                            description="Allow the AI to browse the internet."
                            enabled={settings.webAccess}
                            onChange={(v) => updateSetting('webAccess', v)}
                          />
                        </div>
                        <div className="h-px bg-gray-200 dark:bg-gray-700 mx-4"></div>
                        <div className="px-4">
                           <Toggle 
                            label="Long-term Memory"
                            description="AI remembers previous conversations."
                            enabled={settings.memoryEnabled}
                            onChange={(v) => updateSetting('memoryEnabled', v)}
                          />
                        </div>
                        <div className="h-px bg-gray-200 dark:bg-gray-700 mx-4"></div>
                        <div className="px-4">
                           <Toggle 
                            label="Code Sandbox"
                            description="Execute Python code for analysis."
                            enabled={settings.codeExecution}
                            onChange={(v) => updateSetting('codeExecution', v)}
                          />
                        </div>
                      </div>
                    </section>

                    <hr className="border-gray-100 dark:border-gray-700/50" />

                     {/* System Prompt */}
                     <section className="animate-slide-up stagger-3">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Custom Instructions</h3>
                      </div>
                      <div className="relative group">
                        <textarea
                          rows={4}
                          value={settings.customInstructions}
                          onChange={(e) => updateSetting('customInstructions', e.target.value)}
                          className="w-full p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-gray-200 resize-none transition-all duration-300 group-hover:bg-white dark:group-hover:bg-gray-900"
                          placeholder="e.g. Always answer in bullet points."
                        />
                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span className="text-xs font-mono text-gray-400">{settings.customInstructions.length} chars</span>
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {/* --- TAB: GENERAL SETTINGS --- */}
                {activeTab === 'general' && (
                  <div key="tab-general" className="space-y-8 animate-slide-up">
                    <section className="grid grid-cols-1 gap-6">
                      <div className={`transition-all duration-300 ${!user ? "opacity-50 pointer-events-none grayscale blur-[1px]" : ""}`}>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">Display Name</label>
                        <input 
                          type="text" 
                          value={settings.username}
                          readOnly={!user}
                          onChange={(e) => updateSetting('username', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                        />
                        {!user && <p className="text-xs text-orange-500 mt-2 font-medium flex items-center gap-1"><AlertCircle size={12}/> Login to edit profile details</p>}
                      </div>
                      <div className={`transition-all duration-300 ${!user ? "opacity-50 pointer-events-none grayscale blur-[1px]" : ""}`}>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">Email Address</label>
                        <input 
                          type="email" 
                          value={settings.email}
                          readOnly={!user}
                          placeholder={!user ? "Login to view email" : ""}
                          onChange={(e) => updateSetting('email', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                        />
                      </div>
                    </section>
                    
                    <hr className="border-gray-100 dark:border-gray-700/50" />

                    <section className="animate-slide-up stagger-1">
                      <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Notifications</h3>
                      <div className="space-y-2 bg-gray-50 dark:bg-gray-900/30 rounded-2xl p-4">
                        <Toggle 
                          label="Email Digest" 
                          description="Weekly summary of your AI interactions."
                          enabled={settings.notifications.email} 
                          onChange={(v) => updateNestedSetting('notifications', 'email', v)}
                        />
                        <div className="h-px bg-gray-200 dark:bg-gray-700 my-2"></div>
                        <Toggle 
                          label="Product Updates" 
                          description="New feature announcements."
                          enabled={settings.notifications.productUpdates} 
                          onChange={(v) => updateNestedSetting('notifications', 'productUpdates', v)}
                        />
                      </div>
                    </section>
                  </div>
                )}

                {/* --- TAB: DATA & PRIVACY --- */}
                {activeTab === 'data' && (
                  <div key="tab-data" className="space-y-8 animate-slide-up">
                    <div className="privacy-card bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800 p-6 rounded-2xl flex items-start gap-4 shadow-sm">
                      <div className="bg-amber-100 dark:bg-amber-800/50 p-2 rounded-lg">
                        <Shield className="text-amber-600 dark:text-amber-500 flex-shrink-0" size={24} />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-amber-900 dark:text-amber-100">Privacy First Approach</h4>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">
                          We believe in transparency. We do not train our models on your personal data by default, and you have full control over your conversation history.
                        </p>
                      </div>
                    </div>

                    <section className="space-y-6 animate-slide-up stagger-1">
                      <div className="bg-gray-50 dark:bg-gray-900/30 rounded-2xl p-4 panel-block">
                        <Toggle 
                          label="Contribute to Model Training" 
                          description="Allow anonymized chat data to be used for future model improvements."
                          enabled={settings.dataSharing} 
                          onChange={(v) => updateSetting('dataSharing', v)}
                        />
                      </div>
                      
                      <div className="pt-2">
                        <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 ml-1">Chat History Retention</label>
                        <div className="relative">
                          <select 
                            value={settings.historyRetention}
                            onChange={(e) => updateSetting('historyRetention', parseInt(e.target.value))}
                            className="select-card w-full md:w-64 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none cursor-pointer transition-all hover:border-indigo-300"
                          >
                            <option value={7}>7 Days</option>
                            <option value={30}>30 Days</option>
                            <option value={90}>90 Days</option>
                          </select>
                          <div className="absolute top-1/2 left-56 -translate-y-1/2 pointer-events-none text-gray-400">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>
                      </div>
                    </section>
                    
                    {user && (
                      <div className="animate-slide-up stagger-2">
                        <hr className="border-gray-100 dark:border-gray-700/50 my-8" />
                        <section className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl p-6">
                           <h3 className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-6">Danger Zone</h3>
                           <div className="flex flex-wrap gap-4">
                             <button className="px-5 py-2.5 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-bold active:scale-95">
                               Export All Data
                             </button>
                             <button className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/30 transition-all text-sm font-bold active:scale-95">
                               Delete Account
                             </button>
                           </div>
                        </section>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-sm w-full p-8 space-y-6 transform animate-scale-in border border-white/20">
            <div className="text-center space-y-3">
              <div className="bg-indigo-50 dark:bg-indigo-900/30 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400 mb-4 transform rotate-3 hover:rotate-6 transition-transform duration-300">
                <LogIn size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Sign in to sync your preferences and access pro features.</p>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={handleLogin}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 active:scale-95"
              >
                Sign in with Google
              </button>
              <button 
                onClick={handleLogin}
                className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-bold transition-all active:scale-95"
              >
                Sign in with Email
              </button>
            </div>
            
            <button 
              onClick={() => setShowLoginModal(false)}
              className="w-full text-center text-sm font-medium text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <div className={`fixed bottom-6 right-6 transform transition-all duration-500 cubic-bezier(0.68, -0.55, 0.265, 1.55) z-50 ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'}`}>
        <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-4 text-white border border-white/10 ${
          toast.type === 'error' ? 'bg-red-600' : 
          toast.type === 'neutral' ? 'bg-gray-800' : 
          'bg-gray-900 dark:bg-indigo-600'
        }`}>
          <div className="p-1 bg-white/20 rounded-full">
            {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          </div>
          <span className="font-bold text-sm tracking-wide">{toast.message}</span>
        </div>
      </div>

    </div>
  );
}
