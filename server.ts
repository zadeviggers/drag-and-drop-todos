import { Router, error, json } from "npm:itty-router@4.0.23";
import {
  serveDir,
  serveFile,
} from "https://deno.land/std@0.206.0/http/file_server.ts";
import { DB } from "https://deno.land/x/sqlite@v3.8/mod.ts";

// We're just using SQLite since it's quick an easy
const db = new DB("todos.db");

// Close DB connection on quit
globalThis.addEventListener("unload", () => db.close());

// Database setup
db.execute(`CREATE TABLE IF NOT EXISTS "lists" (
  -- Using slugs instead of IDs so we can have nice URLs
	"slug"	TEXT NOT NULL UNIQUE,
	"name"	TEXT NOT NULL,
	PRIMARY KEY("slug")
);`);
db.execute(`CREATE TABLE IF NOT EXISTS "items" (
  -- Fine to just use IDs for todo items because they don't go in URls
	"id"	INTEGER NOT NULL UNIQUE,
	"list"	TEXT NOT NULL,
	"text"	TEXT NOT NULL,
  -- SQLite just sees BOOLEAN as INTEGER, but it makes the schema clearer
	"is_completed"	BOOLEAN NOT NULL,
	"created_at"	INTEGER NOT NULL, 
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("list") REFERENCES "lists"("slug")
);`);

// Itty-router is nice - Express-like router but with Request & Response
const router = Router();

// Get all todo items, grouped by list.
// This wouldn't scale if we had thousands of todo items in
// each list, but we don't, so it's fine.
router.get("/api/all", () => {
  // Query then convert to array of objects
  const allTodoItems = db
    .query("SELECT id, text, is_completed, created_at, list FROM items")
    .map(([id, text, is_completed, created_at, list]) => ({
      id,
      text,
      is_completed,
      created_at,
      list,
    }));

  // Query and then build the response
  const allLists = db
    .query("SELECT slug, name FROM lists")
    .map(([slug, name]) => ({
      slug,
      name,
      items: allTodoItems
        // This isn't good at all, but it's clean and easy,
        // and works fine at this scale
        .filter((t) => t.list === slug)
        // Get rid of the extra field that we don't need to send
        // deno-lint-ignore no-unused-vars
        .map(({ list, ...rest }) => ({ ...rest })),
    }));

  return json(allLists);
});

// Create a todo item
router.post("/api/todos", async (req) => {
  // We need a few fields with different types, so JSON is easiest
  //TODO: Error handling here
  const { list, text, created_at } = await req.json();

  // Data validation
  if (typeof list !== "string") return error(400, "Please provide a list slug");
  if (typeof text !== "string")
    return error(400, "Please provide todo contents");
  if (typeof created_at !== "number")
    return error(400, "Please provide a creation timestamp");

  // We use the creation date supplied by the client in case they went offline
  // while adding it, or the request was slow.

  // Create the list
  try {
    db.query(
      `INSERT INTO items (list, text, is_completed, created_at)
      -- SQLite translates FALSE into 0 and TRUE into 1
      VALUES (?, ?, FALSE, ?);`,
      [list, text, created_at]
    );
    const lastRowID = db.query("SELECT last_insert_rowid();")[0].toString();
    return new Response(lastRowID);
  } catch (err) {
    // Don't stringify the error, so that we get a full stacktrace
    console.warn("Error creating item:", err);
    return error(500, "Failed to create todo item. Please try again.");
  }
});

// Edit an item
router.path("/api/todos/:id", async (req) => {
  const fields = await req.json();
  // TODO: Figure this out
  // Create the list
  try {
    db.query(
      `UPDATE items (is_completed)
      -- SQLite translates FALSE into 0 and TRUE into 1
      VALUES (TRUE);`
    );
  } catch (err) {
    // Don't stringify the error, so that we get a full stacktrace
    console.warn("Error completing item:", err);
    return error(500, "Failed to completing todo item. Please try again.");
  }

  return new Response("Completed ⏀");
});

// Create a list
router.post("/api/lists", async (req) => {
  // We only need a name, so I'm just using the body
  const name = (await req.text()).trim();
  if (name.length == 0) return error(400, "Please provide a name");

  // Slugify the name
  let slug = name.toLowerCase().replaceAll(" ", "-");

  // Check if it's already used
  const slugCheck = db.query("SELECT 1 FROM lists WHERE slug = ?;", [slug]);
  if (slugCheck.length !== 0) {
    // Make sure slug is unique by adding random numbers to the end.
    // If this fails, then we just send an error. It won't fail very often.
    slug += "-" + Math.round(Math.random() * 10 ** 5);
  }

  // Create the list
  try {
    db.query("INSERT INTO lists (name, slug) VALUES (?, ?);", [name, slug]);
  } catch (err) {
    // Don't stringify the error, so that we get a full stacktrace
    console.warn("Error creating list:", err);
    return error(500, "Failed to create list. Please try again.");
  }

  // Send the slug of the created list to update the UI
  return new Response(slug);
});

// TODO: Renaming & deleting lists

// File server stuff
router
  .get("/", (req) => serveFile(req, "./todo-frontend/dist/index.html"))
  .get("/resources/*", (req) =>
    serveDir(req, {
      fsRoot: "./todo-frontend/dist/resources",
      urlRoot: "resources",
    })
  )
  // Don't serve HTML on the API
  .all("/api/*", () => error(404))
  // This lets us do routing on the client side
  .get("*", (req) => serveFile(req, "./todo-frontend/dist/index.html"));

// Run the server
Deno.serve({ port: 80 }, (req) => {
  return router.handle(req);
});
