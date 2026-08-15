import type { ClientsModel } from "./model";

export class ClientsService {
  constructor(private model: ClientsModel) {}

  async list() {
    return this.model.listClients();
  }

  async create(input: { name: string; slug: string }) {
    return this.model.insertClient(input);
  }
}
