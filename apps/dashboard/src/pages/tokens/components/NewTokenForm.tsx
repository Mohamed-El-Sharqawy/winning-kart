import { useState } from "react";
import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { useCreatePat } from "../services/tokens.service";
import type { CreatedPat, PatScope } from "../types/tokens.types";

const SCOPE_OPTIONS: Array<{ value: PatScope; label: string }> = [
  { value: "read", label: "Read" },
  { value: "sync", label: "Sync" },
  { value: "tasks", label: "Tasks" },
];

export interface NewTokenFormProps {
  onCreated: (pat: CreatedPat) => void;
}

export function NewTokenForm({ onCreated }: NewTokenFormProps) {
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<PatScope[]>([]);
  const createPat = useCreatePat();

  function toggleScope(scope: PatScope) {
    setScopes((current) =>
      current.includes(scope) ? current.filter((entry) => entry !== scope) : [...current, scope],
    );
  }

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;
        createPat.mutate(
          { name: trimmed, scopes: scopes.length > 0 ? scopes : undefined },
          {
            onSuccess: (pat) => {
              setName("");
              setScopes([]);
              onCreated(pat);
            },
          },
        );
      }}
    >
      <div className="w-72">
        <Input
          label="Token name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. CI runner"
          maxLength={100}
          required
        />
      </div>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-[13px] text-volt-text-2">Scopes</legend>
        <div className="flex items-center gap-4 pb-1">
          {SCOPE_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-[13px] text-volt-text-2">
              <input
                type="checkbox"
                checked={scopes.includes(option.value)}
                onChange={() => toggleScope(option.value)}
                className="h-4 w-4 rounded border-volt-border-2 bg-volt-surface-2 accent-volt-primary"
              />
              {option.label}
            </label>
          ))}
        </div>
        <p className="text-xs text-volt-text-3">
          Leave all unchecked for full access — scopes only restrict what MCP tools and automation
          can do with the key.
        </p>
      </fieldset>
      <Button type="submit" disabled={createPat.isPending || name.trim().length === 0}>
        {createPat.isPending ? "Creating…" : "New token"}
      </Button>
      {createPat.isError ? (
        <p className="pb-2 text-[13px] text-volt-down">Failed to create token.</p>
      ) : null}
    </form>
  );
}
