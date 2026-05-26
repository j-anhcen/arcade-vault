'use client'

import { useState } from "react"

type Tab = "login" | "register"

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>("login")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
  }

  return (
    <div className="av-auth-wrap">
      <div className="auth-card">
        <div className="auth-header">
          <div className="mark" />
          <h2>ARCADE VAULT</h2>
          <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--ink-faint)", letterSpacing: "0.12em" }}>
            {tab === "login" ? "BIENVENIDO DE VUELTA" : "CREA TU CUENTA"}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            className={tab === "login" ? "on" : ""}
            onClick={() => setTab("login")}
          >
            INICIAR SESIÓN
          </button>
          <button
            className={tab === "register" ? "on" : ""}
            onClick={() => setTab("register")}
          >
            CREAR CUENTA
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {tab === "register" && (
            <div className="field">
              <label htmlFor="email">EMAIL</label>
              <input
                id="email"
                type="email"
                placeholder="jugador@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="username">USUARIO</label>
            <input
              id="username"
              type="text"
              placeholder="PLAYER_ONE"
              value={username}
              onChange={(e) => setUsername(e.target.value.toUpperCase())}
              autoComplete="username"
            />
          </div>

          <div className="field">
            <label htmlFor="password">CONTRASEÑA</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={tab === "login" ? "current-password" : "new-password"}
            />
          </div>

          <button type="submit" className="btn yellow" style={{ width: "100%", marginTop: 8 }}>
            {tab === "login" ? "▶ ENTRAR" : "▶ REGISTRARSE"}
          </button>
        </form>

        <div className="auth-divider">O</div>

        <div className="social">
          <button className="btn ghost">
            G&nbsp;&nbsp;GOOGLE
          </button>
          <button className="btn ghost">
            ⌥&nbsp;&nbsp;GITHUB
          </button>
        </div>
      </div>
    </div>
  )
}
