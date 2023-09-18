import { Server } from "https://deno.land/std@0.195.0/http/server.ts";
import { handleEvent, initProjection } from "./projection.ts";
import { yoga } from "./yoga.ts";

const server = new Server({
  handler: async (req) => {
    const { pathname } = new URL(req.url);

    if (pathname === "/events") {
      return await handleEvent(req);
    }

    return pathname === "/graphql"
      ? yoga(req)
      : new Response("Not Found", { status: 404 });
  },
  port: 3000,
});

server.listenAndServe();
await initProjection();
