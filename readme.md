# Todo list

## To run

1. Build the frontend

> You'll need [NodeJS](https://nodejs.org/) 18 or 20+ installed

```shell
cd todo-frontend
npm i
npm run build
```

2. Start the server
   This will run it with minimal filesystem permissions. It will also serve the static files from the frontend.

> You'll need [Deno](https://docs.deno.com/runtime/manual/getting_started/installation) installed

```shell
cd .. # back to project root
deno run --allow-net --allow-read="./todo-frontend","./todos.db","./todos.db-journal" --allow-write="./todos.db","./todos.db-journal" server.ts
```
