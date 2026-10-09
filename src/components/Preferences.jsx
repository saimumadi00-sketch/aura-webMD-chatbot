import React, { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, User, Bot, Shield, Save, Brain, Zap, Check, LogIn, LogOut, Download, Trash2, AlertCircle } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import '../styles/preferences.css';

const defaults = { persona: 'supportive', tone: 'empathetic', brevity: 'concise', model: 'balanced', creativity: 50, verbosity: 50, customInstructions: '' };
// Compare only editable AI preferences. Unavailable capabilities never become enabled on save.
const editable = preferences => Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key, preferences[key] ?? value]));
const tabs = [
  { id: 'ai', label: 'AI Configuration', icon: Bot },
  { id: 'profile', label: 'General & Profile', icon: User },
  { id: 'privacy', label: 'Data & Privacy', icon: Shield },
];

function Slider({ label, value, onChange, left, right }) {
  const id = useId();
  return <div className="preference-slider">
    <div className="preference-field-heading"><label htmlFor={id}>{label}</label><output htmlFor={id}>{value}</output></div>
    <input id={id} type="range" min="0" max="100" step="1" value={value} onChange={event => onChange(Number(event.target.value))} style={{ '--range-progress': `${value}%` }} />
    <div className="preference-range-labels"><span>{left}</span><span>{right}</span></div>
  </div>;
}

export default function Preferences({ theme = 'dark', onToggleTheme, onHome, preferences = {}, onSavePreferences, error, onLogout, onLogin, onBack, onClearHistory, messages = [], conversations = [], user: userProp }) {
  const user = userProp?.isGuest ? null : userProp;
  const [activeTab, setActiveTab] = useState('ai');
  const [settings, setSettings] = useState(() => editable(preferences));
  const [saved, setSaved] = useState(() => editable(preferences));
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [notice, setNotice] = useState(null);
  const noticeTimer = useRef(null);
  const incomingPreferences = useRef(editable(preferences));
  useEffect(() => {
    const next = editable(preferences);
    const previousSaved = incomingPreferences.current;
    if (JSON.stringify(previousSaved) === JSON.stringify(next)) return;
    // Refresh a clean draft; keep edits made while saving or receiving a subscription update.
    setSettings(previous => JSON.stringify(previous) === JSON.stringify(previousSaved) ? next : previous);
    setSaved(next);
    incomingPreferences.current = next;
  }, [preferences]);
  useEffect(() => () => clearTimeout(noticeTimer.current), []);
  const dirty = JSON.stringify(settings) !== JSON.stringify(saved);
  const update = (key, value) => setSettings(previous => ({ ...previous, [key]: value }));
  const notify = (message, type = 'success') => {
    clearTimeout(noticeTimer.current);
    setNotice({ message, type });
    noticeTimer.current = setTimeout(() => setNotice(null), 4000);
  };
  const handleSave = async () => {
    if (isSaving || !dirty) return;
    const draft = { ...settings };
    setIsSaving(true);
    try {
      if (typeof onSavePreferences !== 'function') throw Error('Settings storage unavailable');
      const result = await onSavePreferences({ ...draft, memoryEnabled: false, webAccess: false, codeExecution: false, dataSharing: false, historyRetention: 0, notifications: { email: false, push: false, productUpdates: false } });
      if (result === false) throw Error('Settings were not saved');
      setSaved(draft);
      notify(user ? 'Preferences saved.' : 'Preferences saved on this device.');
    } catch {
      notify('Could not save preferences. Your changes are still here; please try again.', 'error');
    } finally { setIsSaving(false); }
  };
  const leave = action => {
    if (dirty && !window.confirm('Leave without saving your AI preferences?')) return;
    action?.();
  };
  const clearChat = async () => {
    if (isClearing || !window.confirm('Clear messages in the current conversation? Saved conversations will remain.')) return;
    setIsClearing(true);
    try {
      if (typeof onClearHistory !== 'function' || await onClearHistory() === false) throw Error('Could not clear');
      notify('Current chat cleared.');
    } catch { notify('Could not clear messages. Please try again.', 'error'); }
    finally { setIsClearing(false); }
  };
  const exportData = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ preferences, messages, conversations }, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'aura-data.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const logout = async () => {
    if (dirty && !window.confirm('Sign out without saving your AI preferences?')) return;
    try { if (await onLogout?.() === false) throw Error('Logout failed'); }
    catch { notify('Could not sign out. Please try again.', 'error'); }
  };
  return <div className={`preferences-page ${theme === 'light' ? 'theme-light' : 'theme-dark'}`}>
    <header><div className="preferences-topbar">
      <button type="button" className="preferences-brand" onClick={() => leave(onHome)}><Brain size={24} aria-hidden="true" /><span>Aura</span></button>
      <div className="preferences-header-actions"><ThemeToggle theme={theme} onToggleTheme={onToggleTheme} /><button type="button" className="preference-button" onClick={user ? logout : () => leave(onLogin)}>{user ? <LogOut size={16} /> : <LogIn size={16} />}<span>{user ? 'Sign out' : 'Log in'}</span></button></div>
    </div></header>
    <main className="preferences-main">
      <button className="preferences-back" type="button" onClick={() => leave(onBack)}><ArrowLeft size={17} />Back to chat</button>
      <div className="preferences-heading"><h1>Make Aura feel more like you.</h1><p>Choose how Aura responds and manage your account and chat data.</p></div>
      {!user && <div className="guest-banner"><p><strong>Guest preferences</strong> are saved on this device. Sign in to sync them with your account.</p></div>}
      {error && <p className="preferences-error" role="alert"><AlertCircle size={18} />{error}</p>}
      <div className="preferences-shell">
        <nav className="preferences-sidebar" aria-label="Preferences sections"><div className="preferences-sidebar-card">{tabs.map(tab => <button key={tab.id} type="button" aria-current={activeTab === tab.id ? 'page' : undefined} onClick={() => setActiveTab(tab.id)}><tab.icon size={18} aria-hidden="true" /><span>{tab.label}</span></button>)}</div></nav>
        <div className="preferences-content"><section className="preferences-panel" aria-labelledby="preferences-section-title">
          <div className="preferences-panel__toolbar"><div><h2 id="preferences-section-title">{tabs.find(tab => tab.id === activeTab).label}</h2><p>{activeTab === 'ai' ? 'Changes apply to your next message after saving.' : activeTab === 'profile' ? 'Your current account details.' : 'Review storage and manage the data currently loaded.'}</p></div></div>
          <div className="preferences-panel-body">
            {activeTab === 'ai' && <>
              <section className="preference-section"><h3>Response model</h3><p>Choose a lighter model or the standard experience.</p><div className="preference-models">{[{ id: 'fast', title: 'Flash', description: 'A lighter model for everyday check-ins.', icon: Zap }, { id: 'balanced', title: 'Standard', description: 'A fuller response for thoughtful conversations.', icon: Bot }].map(model => { const selected = settings.model === model.id || (model.id === 'balanced' && settings.model === 'reasoning'); return <button type="button" className="select-option" key={model.id} aria-pressed={selected} onClick={() => update('model', model.id)}><model.icon size={22} aria-hidden="true" /><div><strong>{model.title}</strong><span>{model.description}</span></div>{selected && <Check size={18} aria-hidden="true" />}</button>; })}</div></section>
              <section className="preference-section"><h3>Response style</h3><p>Adjust the wording and level of detail.</p><div className="preference-sliders"><Slider label="Creativity" value={settings.creativity} onChange={value => update('creativity', value)} left="Predictable" right="Imaginative" /><Slider label="Verbosity" value={settings.verbosity} onChange={value => setSettings(previous => ({ ...previous, verbosity: value, brevity: value >= 70 ? 'detailed' : value <= 30 ? 'concise' : 'balanced' }))} left="Concise" right="Detailed" /></div><label className="preference-select-label" htmlFor="preference-tone">Conversation tone</label><select id="preference-tone" value={settings.tone} onChange={event => update('tone', event.target.value)}>{!['empathetic', 'friendly', 'professional', 'direct'].includes(settings.tone) && <option value={settings.tone}>{settings.tone}</option>}<option value="empathetic">Empathetic</option><option value="friendly">Friendly</option><option value="professional">Professional</option><option value="direct">Direct</option></select></section>
              <section className="preference-section"><label htmlFor="preference-instructions" className="preference-section-label">Custom instructions</label><p id="instructions-help">Tell Aura what helps you, such as shorter answers or a preferred writing style.</p><textarea id="preference-instructions" aria-describedby="instructions-help" rows={4} value={settings.customInstructions} onChange={event => update('customInstructions', event.target.value)} placeholder="For example: Ask one question at a time." /><span className="preference-character-count">{settings.customInstructions.length} characters</span></section>
              <section className="preference-section preference-unavailable"><h3>Additional capabilities</h3><p>Web search, cross-conversation memory, and code execution are not available yet.</p></section>
            </>}
            {activeTab === 'profile' && <><section className="preference-section">{user ? <div className="preference-profile"><div><span>Display name</span><strong>{user.displayName || 'Not provided'}</strong></div><div><span>Email address</span><strong>{user.email || 'Not provided'}</strong></div></div> : <div className="preference-profile"><h3>You're chatting as a guest</h3><p>Sign in to view your profile and sync your preferences.</p><button type="button" className="preference-button" onClick={() => leave(onLogin)}><LogIn size={16} />Log in</button></div>}</section><section className="preference-section preference-unavailable"><h3>Notifications</h3><p>Email digests and product update notifications are not available yet.</p></section></>}
            {activeTab === 'privacy' && <><section className="preference-section"><h3>Where your data goes</h3><p>AI requests send your current conversation to the AI provider. Signed-in active chats use Firebase. Saved conversations and guest preferences are stored on this device.</p></section><section className="preference-section"><h3>Export loaded data</h3><p>Download the preferences, current messages, and saved conversations currently loaded in this session.</p><button type="button" className="preference-button" onClick={exportData}><Download size={16} />Export loaded data</button></section><section className="preference-section"><h3>Clear current chat</h3><p>This clears active messages. Your saved conversations remain. Automatic chat deletion is not available.</p><button type="button" className="preference-button preference-danger" disabled={isClearing || !messages.length} onClick={clearChat}><Trash2 size={16} />{isClearing ? 'Clearing...' : 'Clear current chat'}</button></section><section className="preference-section preference-unavailable"><h3>Account and data controls</h3><p>Account deletion and model-training contributions are not available from this page.</p></section></>}
          </div>
          {(activeTab === 'ai' || dirty) && <footer className="preferences-savebar"><span role="status">{isSaving ? 'Saving preferences...' : dirty ? 'You have unsaved AI preferences.' : user ? 'Preferences are up to date.' : 'Preferences are saved on this device.'}</span><button type="button" className="save-button" disabled={isSaving || !dirty} onClick={handleSave}><Save size={16} />{isSaving ? 'Saving...' : user ? 'Save changes' : 'Save locally'}</button></footer>}
        </section></div>
      </div>
    </main>
    <div className="preferences-toast" role="status" aria-live="polite">{notice && <p className={notice.type === 'error' ? 'preferences-error' : ''}>{notice.message}</p>}</div>
  </div>;
}
