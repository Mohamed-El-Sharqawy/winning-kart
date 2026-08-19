import type { ClientDto } from "../dto/clients.dto";
import type { Client } from "../types/clients.types";

export function toClient(dto: ClientDto): Client {
  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug,
    status: dto.status,
    industry: dto.industry ?? null,
    displayCurrency: dto.displayCurrency,
    shareCostAndMarginWithClient: dto.shareCostAndMarginWithClient ?? false,
    createdAt: new Date(dto.createdAt),
  };
}

export function toClients(dtos: ClientDto[]): Client[] {
  return dtos.map(toClient);
}
