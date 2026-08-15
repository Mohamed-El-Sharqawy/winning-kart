import { Elysia } from "elysia";
import { ClientsService } from "./service";
import { ClientsModel } from "./model";

const service = new ClientsService(new ClientsModel());

export const clientsModule = new Elysia({ prefix: "/clients" })
  .get("/", async () => service.list())
  .post("/", async ({ body, set }) => {
    const client = await service.create(body as { name: string; slug: string });
    set.status = 201;
    return client;
  });
