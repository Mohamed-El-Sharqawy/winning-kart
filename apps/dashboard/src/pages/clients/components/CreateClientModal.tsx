import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/shared/components/Button";
import { Modal } from "@/shared/components/Modal";
import { useCreateClient } from "@/shared/services/clients.service";
import { clientFormError } from "../services/client-form-error";
import { ClientFormFields, SLUG_PATTERN } from "./ClientFormFields";
import type { ClientFormValues } from "./ClientFormFields";

const EMPTY_FORM: ClientFormValues = {
  name: "",
  slug: "",
  industry: "",
  displayCurrency: "AED",
  status: "active",
};

function toKebab(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CreateClientModal({ onClose }: { onClose: () => void }) {
  const [values, setValues] = useState<ClientFormValues>(EMPTY_FORM);
  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createClient = useCreateClient();

  const handleChange = (patch: Partial<ClientFormValues>) => {
    if (patch.slug !== undefined) setSlugEdited(true);
    setValues((prev) => ({
      ...prev,
      ...patch,
      slug:
        patch.slug !== undefined
          ? patch.slug
          : patch.name !== undefined && !slugEdited
            ? toKebab(patch.name)
            : prev.slug,
    }));
  };

  const ready =
    values.name.trim().length > 0 &&
    values.name.trim().length <= 200 &&
    SLUG_PATTERN.test(values.slug.trim()) &&
    values.industry.trim().length <= 100;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const industry = values.industry.trim();
    try {
      await createClient.mutateAsync({
        name: values.name.trim(),
        slug: values.slug.trim(),
        ...(industry.length > 0 ? { industry } : {}),
        displayCurrency: values.displayCurrency,
      });
      onClose();
    } catch (submitError) {
      setError(clientFormError(submitError, "Failed to create client"));
    }
  }

  return (
    <Modal title="Add client" onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <ClientFormFields values={values} onChange={handleChange} disabled={createClient.isPending} />
        {error ? <p className="text-sm text-volt-down">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={createClient.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={!ready || createClient.isPending}>
            {createClient.isPending ? "Adding…" : "Add client"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
