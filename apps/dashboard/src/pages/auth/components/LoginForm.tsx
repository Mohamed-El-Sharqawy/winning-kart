import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { Input } from "@/shared/components/Input";
import { useLogin } from "@/shared/services/session.service";

export function LoginForm() {
  const navigate = useNavigate();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <Card className="w-90">
      <h1 className="mb-5 text-xl font-semibold text-volt-text">Winning Kart</h1>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          login.mutate({ email, password }, { onSuccess: () => void navigate({ to: "/" }) });
        }}
      >
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          minLength={8}
          required
        />
        {login.isError ? (
          <p className="text-[13px] text-volt-down">Invalid credentials</p>
        ) : null}
        <Button type="submit" disabled={login.isPending}>
          {login.isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </Card>
  );
}
