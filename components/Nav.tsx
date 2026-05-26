'use client'

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const LINKS = [
  { href: "/biblioteca", label: "BIBLIOTECA" },
  { href: "/salon", label: "SALÓN" },
]

export default function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      <nav className="av-nav">
        <Link href="/biblioteca" className="logo">
          <div className="logo-mark" />
          <span className="logo-text">ARCADE VAULT</span>
        </Link>

        <div className="links">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={pathname.startsWith(href) ? "active" : ""}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="spacer" />

        <div className="coin-counter">
          <div className="coin" />
          <span>9999</span>
        </div>

        <Link href="/auth" className="btn auth-btn">
          ACCESO
        </Link>

        <button
          className="btn hamburger"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
        >
          ☰
        </button>
      </nav>

      <div
        className={`av-mobile-backdrop${open ? " open" : ""}`}
        onClick={() => setOpen(false)}
      />
      <div className={`av-mobile-panel${open ? " open" : ""}`}>
        <button
          className="btn ghost"
          style={{ alignSelf: "flex-end", marginBottom: 8 }}
          onClick={() => setOpen(false)}
          aria-label="Cerrar menú"
        >
          ✕
        </button>
        {LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={pathname.startsWith(href) ? "active" : ""}
            onClick={() => setOpen(false)}
          >
            {label}
          </Link>
        ))}
        <Link href="/auth" onClick={() => setOpen(false)}>
          ACCESO
        </Link>
      </div>
    </>
  )
}
