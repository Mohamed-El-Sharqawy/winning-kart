# The DTO → transformer → type pattern ("one file to change")

Three layers per page, each with exactly one job:

1. **`dto/clients.dto.ts`** — the wire format: field names and shapes exactly as the API
   returns them. These mirror the backend's TypeBox DTOs and **the cypress fixtures**.
2. **`types/clients.types.ts`** — the view-model: what components consume. Named well
   for the UI, free of wire-format noise.
3. **`transformers/clients.transformer.ts`** — the single mapping from dto to type.

## The rule

When the backend renames a field, exactly two files change: the `dto` file and the
`transformer`. No component, no hook, no page layout ever touches wire shapes.

## Example

Backend ships `{ ad_account_id, daily_budget }`:

```ts
export interface AdAccountDto {
  ad_account_id: string;
  daily_budget: number;
}

export interface AdAccount {
  adAccountId: string;
  dailyBudget: number;
}

export function toAdAccount(dto: AdAccountDto): AdAccount {
  return {
    adAccountId: dto.ad_account_id,
    dailyBudget: dto.daily_budget,
  };
}
```

The next day the backend renames `daily_budget` to `budget_daily`: the dto file and one
line in the transformer change, and every table, card, and chart in the app keeps working.

## Fixtures double as a contract check

`cypress/fixtures/*.json` match `dto/*.ts` shapes exactly (raw wire format, never
view-models). If the backend field renames and the fixture is forgotten, tests fail loudly
instead of silently drifting.
