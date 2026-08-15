import type { Client } from "@wk/db";

export class ClientsModel {
  async listClients(): Promise<Client[]> {
    throw new Error("ClientsModel.listClients: wire to @wk/db in M0");
  }

  async insertClient(_input: { name: string; slug: string }): Promise<Client> {
    throw new Error("ClientsModel.insertClient: wire to @wk/db in M0");
  }
}
