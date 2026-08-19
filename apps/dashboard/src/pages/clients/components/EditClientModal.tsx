import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/shared/components/Button";
import { Modal } from "@/shared/components/Modal";
import { useUpdateClient } from "@/shared/services/clients.service";
import type { Client } from "@/shared/types/clients.types";
import { clientFormError } from "../services/client-form-error";
import { ClientFormFields, SLUG_PATTERN } from "./ClientFormFields";
import type { ClientFormValues } from "./ClientFormFields";

export function EditClientModal({ client, onClose }: { client: Client; onClose: () => void }) {
  const [values, setValues] = useState<ClientFormValues>({
    name: client.name,
    slug: client.slug,
    industry: client.industry ?? "",
    displayCurrency: client.displayCurrency,
    status: client.status,
  });
  const [error, setError] = useState<string | null>(null);
  const updateClient = useUpdateClient();

  const handleChange = (patch: Partial<ClientFormValues>) => {
    setValues((prev) => ({ ...prev, ...patch }));
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
      await updateClient.mutateAsync({
        id: client.id,
        name: values.name.trim(),
        slug: values.slug.trim(),
        industry: industry.length > 0 ? industry : null,
        status: values.status,
        displayCurrency: values.displayCurrency,
      });
      onClose();
    } catch (submitError) {
      setError(clientFormError(submitError, "Failed to save changes"));
    }
  }

  return (
    <Modal title={`Edit ${client.name}`} onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <ClientFormFields
          values={values}
          onChange={handleChange}
          withStatus
          disabled={updateClient.isPending}
        />
        {error ? <p className="text-sm text-volt-down">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={updateClient.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={!ready || updateClient.isPending}>
            {updateClient.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
