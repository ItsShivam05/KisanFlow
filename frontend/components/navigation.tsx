"use client";

import { useState } from "react";

const links = [
  { label: "For Farmers", href: "#for-farmers" },
  { label: "For Buyers", href: "#for-buyers" },
  { label: "How it works", href: "#how-it-works" },
];

export function Navigation() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur-sm">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 lg:px-8"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <a
          href="/"
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-stone-900"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-leaf-700 text-white text-sm">
            🌾
          </span>
          KisanFlow
        </a>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-stone-500 transition hover:text-stone-900"
            >
              {link.label}
            </a>
          ))}

          <a
            href="/crop-planning"
            className="text-sm font-semibold text-leaf-700 transition hover:text-leaf-900"
          >
            What to Grow?
          </a>

          <a
            href="/price-intelligence"
            className="text-sm font-semibold text-leaf-700 transition hover:text-leaf-900"
          >
            Price Intelligence
          </a>
        </div>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <a
            href="/login"
            className="text-sm font-semibold text-stone-600 transition hover:text-leaf-700"
          >
            Log in
          </a>

          <a href="/register" className="btn-primary text-sm">
            Join the network
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-stone-600 transition hover:bg-stone-50 md:hidden"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path
                fillRule="evenodd"
                d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 15.25Z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {open && (
        <div className="border-t border-stone-100 bg-white px-5 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
              >
                {link.label}
              </a>
            ))}

            <a
              href="/crop-planning"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-leaf-700 transition hover:bg-stone-50"
            >
              What to Grow?
            </a>

            <a
              href="/price-intelligence"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-leaf-700 transition hover:bg-stone-50"
            >
              Price Intelligence
            </a>

            <div className="mt-3 flex flex-col gap-2 border-t border-stone-100 pt-3">
              <a
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-stone-300 px-4 py-2.5 text-center text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
              >
                Log in
              </a>

              <a
                href="/register"
                onClick={() => setOpen(false)}
                className="btn-primary text-center text-sm"
              >
                Join the network
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}