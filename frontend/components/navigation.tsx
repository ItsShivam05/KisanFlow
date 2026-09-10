"use client";

import { useState } from "react";

const links = ["For farmers", "For buyers", "How it works"];

export function Navigation() {
  const [open, setOpen] = useState(false);
  return <header className="relative z-10 border-b border-stone-200/80 bg-cream/95 backdrop-blur"><nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8" aria-label="Main navigation"><a href="#top" className="flex items-center gap-2 text-xl font-bold tracking-tight text-leaf-900"><span className="grid h-9 w-9 place-items-center rounded-xl bg-leaf-700 text-lg text-white">🌾</span>KisanFlow</a><div className="hidden items-center gap-8 md:flex">{links.map(link => <a key={link} className="text-sm font-medium text-stone-600 transition hover:text-leaf-700" href={`#${link.toLowerCase().replaceAll(" ", "-")}`}>{link}</a>)}<a className="text-sm font-semibold text-leaf-700" href="/login">Log in</a><a className="rounded-full bg-leaf-700 px-5 py-3 text-sm font-semibold text-white" href="/register">Join the network</a></div><button className="rounded-lg p-2 text-leaf-900 md:hidden" aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen(!open)}>☰</button></nav>{open && <div className="absolute w-full border-b bg-white px-5 py-4 shadow-soft md:hidden"><div className="flex flex-col gap-4">{links.map(link => <a key={link} href={`#${link.toLowerCase().replaceAll(" ", "-")}`} onClick={() => setOpen(false)}>{link}</a>)}<a className="font-semibold text-leaf-700" href="/login">Log in</a><a className="rounded-full bg-leaf-700 px-5 py-3 text-center font-semibold text-white" href="/register">Join the network</a></div></div>}</header>;
}
