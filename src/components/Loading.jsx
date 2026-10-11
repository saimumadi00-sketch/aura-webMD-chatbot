/*
 * Full-page spinner used while the initial account state is still being resolved.
 */

import React from 'react';


const Loading = () => {
return (
<div className="flex items-center justify-center h-screen bg-[var(--aura-bg)]" role="status" aria-label="Loading">
<div className="w-8 h-8 border-2 border-[var(--aura-border)] border-t-[var(--aura-text)] rounded-full animate-spin" />
</div>
);
};


export default Loading;
