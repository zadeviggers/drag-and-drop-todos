import { useState } from "react";
import { List } from "./List";
import { Sidebar } from "./Sidebar";
import { ItemsContextProvider } from "./listsState";

export default function TodoApp() {
  const [currentListSlug, setCurrentListSlug] = useState(
    () => window.location.pathname.match(/\/list\/([^/?]+)/)?.[1] ?? null
  );

  return (
    <ItemsContextProvider>
      <Sidebar slug={currentListSlug} />
      <List slug={currentListSlug} />
    </ItemsContextProvider>
  );
}
