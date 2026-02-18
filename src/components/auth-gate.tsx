"use client";

import { type ReactNode, type MouseEvent, useState, useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { LoginPromptModal } from "./login-prompt-modal";

interface AuthGateProps {
  children: ReactNode;
  /** Message shown in the login modal */
  message?: string;
}

/**
 * Wraps an interactive element. When the user is NOT authenticated,
 * intercepts clicks and shows a login-prompt modal instead.
 * When authenticated, renders children normally.
 */
export function AuthGate({ children, message }: AuthGateProps) {
  const user = useAuthStore((s) => s.user);
  const [showModal, setShowModal] = useState(false);

  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (!user) {
        e.preventDefault();
        e.stopPropagation();
        setShowModal(true);
      }
    },
    [user]
  );

  if (user) {
    return <>{children}</>;
  }

  return (
    <>
      <div onClickCapture={handleClick} className="contents">
        {children}
      </div>
      <LoginPromptModal
        open={showModal}
        onClose={() => setShowModal(false)}
        message={message}
      />
    </>
  );
}
