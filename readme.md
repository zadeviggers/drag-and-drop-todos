# Todo list

## To run

1. Build the frontend

```shell
cd todo-frontend
npm i
npm run build
```

2. Start the server
   This will run it with minimal filesystem permissions. It will also serve the static files from the frontend.

```shell
deno run --allow-net --allow-read="./todo-frontend","./todos.db" --allow-write="./todos.db" server.ts
```
