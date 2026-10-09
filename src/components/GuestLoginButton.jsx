/*
 * Optional Firebase anonymous sign-in button; unlike the main local guest flow, it requires anonymous auth to be enabled.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { signInAsGuest } from "../services/auth";

const GuestLoginButton = ({ redirectTo = "/chat" }) => {
  const navigate = useNavigate();

  const handleGuest = async () => {
    try {
      await signInAsGuest();
      navigate(redirectTo);
    } catch (e) {
      console.error("Guest login failed:", e);
      alert("Guest login failed. Check Firebase Anonymous auth is enabled.");
    }
  };

  return (
    <button
      onClick={handleGuest}
      className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
      aria-label="Continue as Guest"
    >
      Continue as Guest
    </button>
  );
};

export default GuestLoginButton;
