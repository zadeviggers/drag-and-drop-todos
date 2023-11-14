import { Router } from "npm:itty-router@4.0.23";
import {
  serveDir,
  serveFile,
} from "https://deno.land/std@0.206.0/http/file_server.ts";
import { DB } from "https://deno.land/x/sqlite@v3.8/mod.ts";

// We're just using SQLite since it's quick an easy
const db = new DB("todos.db");

// Itty-router is nice - Express-like router but with Request & Response
const router = Router();

router.get("/api/all-todos", () => {});

// File server stuff
router
  .get("/", (req) => serveFile(req, "./todo-frontend/dist/index.html"))
  .get("/resources/*", (req) =>
    serveDir(req, {
      fsRoot: "./todo-frontend/dist/resources",
      urlRoot: "resources",
    })
  )
  // This lets us do routing on the client side
  .get("*", (req) => serveFile(req, "./todo-frontend/dist/index.html"));

// Run the server
Deno.serve({ port: 80 }, (req) => {
  return router.handle(req);
});
