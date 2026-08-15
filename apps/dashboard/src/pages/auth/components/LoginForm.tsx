import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

export function LoginForm() {
  const { login, isPending, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        login({ email, password });
      }}
      style={{
        width: 360,
        padding: 32,
        borderRadius: "var(--radius-wk)",
        backgroundColor: "var(--color-volt-surface)",
        border: "1px solid var(--color-volt-border)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <h1 style={{ margin: 0, fontSize: 22, color: "var(--color-volt-text)" }}>
        Winning Kart
      </h1>
      <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          style={inputStyle}
        />
      </label>
      {error ? (
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-volt-down)" }}>{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        style={{
          padding: "10px 16px",
          borderRadius: 8,
          border: "1px solid var(--color-volt-primary)",
          backgroundColor: "var(--color-volt-primary)",
          color: "var(--color-volt-ground)",
          fontWeight: 700,
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--color-volt-border-2)",
  backgroundColor: "var(--color-volt-surface-2)",
  color: "var(--color-volt-text)",
  fontFamily: "var(--font-mono)",
  fontSize: 14,
};
