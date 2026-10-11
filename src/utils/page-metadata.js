const pages = {
  '/': ['Aura — A space to reflect', 'Talk through everyday worries, reflect with journaling prompts, and set small goals with Aura, a supportive AI companion.'],
  '/doctors': ['Human care preview — Aura', 'Explore the Aura human care directory preview. Listed profiles are demonstration data; appointments are not available.'],
  '/billing': ['Plans — Aura', 'Explore Aura plans. The free experience is available; paid subscriptions and payments are not enabled.'],
  '/privacy': ['Privacy information — Aura', 'How Aura handles conversations, images, local storage, and optional analytics.'],
  '/terms': ['Usage information — Aura', 'Understand Aura’s AI limitations, guest limits, and available features.'],
  '/contact': ['Contact — Aura', 'Find support and privacy contact information for Aura.'],
};
export function pageMetadata(path) {
  const value = pages[path];
  const privateTitles = { '/chat': 'Your conversation', '/preferences': 'Preferences', '/login': 'Sign in', '/register': 'Create an account', '/welcome': 'Welcome' };
  return { title: value?.[0] || `${privateTitles[path] || 'Page not found'} — Aura`, description: value?.[1] || 'Your Aura account and conversation.', index: Boolean(value) };
}
