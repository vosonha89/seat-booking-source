import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from "@clerk/react";
import { App } from "./App";
import "./styles.css";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

if (!clerkPubKey) {
	throw new Error(
		"VITE_CLERK_PUBLISHABLE_KEY environment variable is not set",
	);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      <App />
    </ClerkProvider>
  </StrictMode>,
);
