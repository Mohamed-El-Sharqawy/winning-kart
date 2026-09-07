import { useClients } from "@/shared/services/clients.service";
import { Select } from "./Select";

export function ClientSelect({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const { data: clients, isPending } = useClients();
  const options = [
    { value: "", label: isPending ? "Loading clients…" : "Select client" },
    ...(clients ?? []).map((client) => ({ value: client.id, label: client.name })),
  ];
  return (
    <Select label="Client" value={value} options={options} onChange={onChange} disabled={disabled} />
  );
}
