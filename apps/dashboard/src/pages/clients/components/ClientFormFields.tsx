import { Input } from "@/shared/components/Input";
import type { ClientStatus } from "@/shared/types/clients.types";
import { Select } from "./Select";

export const CURRENCY_OPTIONS = [
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "SAR", label: "SAR — Saudi Riyal" },
];

export const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "archived", label: "Archived" },
];

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface ClientFormValues {
  name: string;
  slug: string;
  industry: string;
  displayCurrency: string;
  status: ClientStatus;
}

export interface ClientFormFieldsProps {
  values: ClientFormValues;
  onChange: (patch: Partial<ClientFormValues>) => void;
  withStatus?: boolean;
  disabled?: boolean;
}

export function ClientFormFields({ values, onChange, withStatus = false, disabled = false }: ClientFormFieldsProps) {
  return (
    <div className="flex flex-col gap-3">
      <Input
        label="Name"
        placeholder="Client name"
        value={values.name}
        disabled={disabled}
        onChange={(event) => onChange({ name: event.target.value })}
      />
      <div className="flex flex-col gap-1.5">
        <Input
          label="Slug"
          placeholder="client-name"
          value={values.slug}
          disabled={disabled}
          className="font-mono"
          onChange={(event) => onChange({ slug: event.target.value })}
        />
        <p className="text-xs text-volt-text-3">Used in URLs</p>
      </div>
      <Input
        label="Industry (optional)"
        placeholder="e.g. Automotive retail"
        value={values.industry}
        disabled={disabled}
        onChange={(event) => onChange({ industry: event.target.value })}
      />
      <Select
        label="Display currency"
        value={values.displayCurrency}
        options={CURRENCY_OPTIONS}
        disabled={disabled}
        onChange={(value) => onChange({ displayCurrency: value })}
      />
      {withStatus ? (
        <Select
          label="Status"
          value={values.status}
          options={STATUS_OPTIONS}
          disabled={disabled}
          onChange={(value) => onChange({ status: value as ClientStatus })}
        />
      ) : null}
    </div>
  );
}
