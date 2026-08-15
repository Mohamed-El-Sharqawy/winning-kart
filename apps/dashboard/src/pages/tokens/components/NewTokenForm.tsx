import { useState } from "react";
import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { useCreatePat } from "../services/tokens.service";
import type { CreatedPat } from "../types/tokens.types";

export interface NewTokenFormProps {
  onCreated: (pat: CreatedPat) => void;
}

export function NewTokenForm({ onCreated }: NewTokenFormProps) {
  const [name, setName] = useState("");
  const createPat = useCreatePat();

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;
        createPat.mutate(
          { name: trimmed },
          {
            onSuccess: (pat) => {
              setName("");
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
      <Button type="submit" disabled={createPat.isPending || name.trim().length === 0}>
        {createPat.isPending ? "Creating…" : "New token"}
      </Button>
      {createPat.isError ? (
        <p className="pb-2 text-[13px] text-volt-down">Failed to create token.</p>
      ) : null}
    </form>
  );
}
