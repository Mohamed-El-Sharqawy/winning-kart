import { LoginForm } from "./components/LoginForm";

export function AuthPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-volt-ground)",
      }}
    >
      <LoginForm />
    </main>
  );
}
