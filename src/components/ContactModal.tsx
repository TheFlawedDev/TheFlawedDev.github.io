"use client";

import React, { useState, useEffect } from "react";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      onClose();
      setSubmitted(false);
      setName("");
      setEmail("");
      setNote("");
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-[#e9e7e3] text-[#161616] p-7 sm:p-9 shadow-2xl z-10 font-[var(--font-sans)] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between mb-6">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-[#666]">
              [ INITIATE CONNECTION ]
            </span>
            <h2 className="text-3xl font-[var(--font-serif)] font-normal text-[#161616] mt-1">
              Start a conversation.
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-2xl leading-none text-[#555] hover:text-black font-mono"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {submitted ? (
          <div className="py-12 text-center">
            <span className="font-mono text-sm text-[var(--green)] bg-black px-3 py-1 rounded inline-block mb-3">
              PACKET DELIVERED
            </span>
            <p className="text-sm text-[#444] font-mono">
              Thank you. I will follow up shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-[#555] mb-1">
                Your Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Lovelace"
                className="w-full bg-white/70 border border-[#ccc] px-3.5 py-2.5 text-sm text-[#161616] placeholder:text-[#999] focus:outline-none focus:border-black focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-[#555] mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ada@example.com"
                className="w-full bg-white/70 border border-[#ccc] px-3.5 py-2.5 text-sm text-[#161616] placeholder:text-[#999] focus:outline-none focus:border-black focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-[#555] mb-1">
                Objective / Project Note
              </label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Briefly describe what you're building or exploring..."
                className="w-full bg-white/70 border border-[#ccc] px-3.5 py-2.5 text-sm text-[#161616] placeholder:text-[#999] focus:outline-none focus:border-black focus:bg-white transition-colors resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="font-mono text-[11px] text-[#777]">
                [ESC TO CANCEL]
              </span>
              <button
                type="submit"
                className="bg-[#161616] text-[#f2f1ee] hover:bg-black font-mono text-xs uppercase tracking-wider px-6 py-3 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>TRANSMIT</span>
                <span className="text-[var(--green)]">→</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
