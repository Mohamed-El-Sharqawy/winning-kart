import { Badge } from "@/shared/components/Badge";

export function ScopesChips({ scopes }: { scopes: string[] | null }) {
  if (scopes === null) {
    return <Badge variant="neutral">full access</Badge>;
  }
  if (scopes.length === 0) {
    return <Badge variant="neutral">no access</Badge>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {scopes.map((scope) => (
        <Badge key={scope} variant="neutral">
          {scope}
        </Badge>
      ))}
    </div>
  );
}
