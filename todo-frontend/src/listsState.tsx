import { createContext, useContext, useEffect, useState } from "react";
import { TodoList, TodoItem } from "../../types.ts";

const allListsContext = createContext<{
  lists: null | Record<string, TodoList>;
  setLists: React.Dispatch<
    React.SetStateAction<Record<string, TodoList> | null>
  >;
  // No-op the interface
}>({ lists: null, setLists: () => {} });

/**
 * Get all the todo items for a given list
 */
export function useItems(slug: string | null): TodoItem[] {
  const { lists } = useContext(allListsContext);

  // Make life easy for consumers
  if (slug == null) return [];

  const items = lists?.[slug]?.items;

  return items ?? [];
}

/**
 * Get all the lists
 */
export function useLists(): TodoList[] {
  const { lists } = useContext(allListsContext);

  return lists === null ? [] : Object.values(lists);
}

/**
 * Context provider that sets up all the state we need
 */
export function ItemsContextProvider({ children }: React.PropsWithChildren) {
  const [lists, setLists] = useState<null | Record<string, TodoList>>(null);

  // Download the lists
  useEffect(() => {
    const controller = new AbortController();

    try {
      fetch(`/api/all`, { signal: controller.signal })
        .then(async (res) => {
          if (res.ok) {
            return res.json();
          } else {
            const errMessage = await res.text();
            console.warn(
              "Error downloading sensor list: ",
              res.status,
              // Response body might have a helpful error message
              errMessage
            );

            throw `${res.status} - ${errMessage}`;
          }
        })
        .then((data) => setLists(data))
        .catch((err) => {
          // Ignore cancellations caused by unmount
          if ((err + "").includes("abort")) return;

          console.error("Error downloading lists", err);
          alert(err);
        });
    } catch (err) {
      console.error(err);
    }

    // Cleanup by cancelling request
    return () => controller.abort();
  }, []);

  return (
    <allListsContext.Provider value={{ lists, setLists }}>
      {children}
    </allListsContext.Provider>
  );
}
