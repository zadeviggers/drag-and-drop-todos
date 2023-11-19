import { createContext, useContext, useEffect, useState } from "react";
import { TodoItem, TodoList } from "../../../types.ts";

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
export function useItems(slug: string | null) {
	const { lists, setLists } = useContext(allListsContext);

	const list: TodoList | null = slug ? lists?.[slug] ?? null : null;

	async function addItem(text: string) {
		if (list === null) {
			console.warn("Ignoring item add because list is null");
			return;
		}
		try {
			const data = {
				text,
				created_at: Date.now(),
				list: list.slug,
			};
			const res = await fetch("/api/items", {
				method: "POST",
				body: JSON.stringify(data),
			});

			if (res.ok) {
				const id = Number(await res.text());

				const newItemData: TodoItem = { ...data, id, is_completed: false };

				// Add new list to list
				setLists((prevLists) => {
					const prevList = prevLists?.[list.slug] ?? null;
					if (prevList === null) return prevLists;

					return {
						...prevLists,
						[prevList.slug]: {
							...prevList,
							items: [...prevList.items, newItemData],
						},
					};
				});
			}
		} catch (err) {
			console.error("Failed to add item: ", err);
			alert(`Failed to add item: ${err}`);
		}
	}

	async function setCompleted(item: TodoItem, is_completed: boolean) {
		try {
			const newItemData: TodoItem = { ...item, is_completed };

			// Optimistic update
			setLists((prevLists) => {
				const prevList = prevLists?.[item.list] ?? null;
				if (prevList === null) return prevLists;

				return {
					...prevLists,
					[prevList.slug]: {
						...prevList,
						items: [
							...prevList.items.filter((item) => item.id !== newItemData.id),
							newItemData,
						],
					},
				};
			});

			const res = await fetch(`/api/items/${item.id}`, {
				method: "PATCH",
				body: JSON.stringify({ is_completed }),
			});

			if (!res.ok) {
				throw `${res.status} - ${await res.text()}`;
			}
		} catch (err) {
			// Rollback
			setLists((prevLists) => {
				const prevList: TodoList | null = prevLists?.[item.list] ?? null;
				if (prevList === null) return prevLists;
				const oldItemData: TodoItem = { ...item, is_completed: !is_completed };
				return {
					...prevLists,
					[prevList.slug]: {
						...prevList,
						items: [
							...prevList.items.filter((item) => item.id !== oldItemData.id),
							oldItemData,
						],
					},
				};
			});

			console.error("Failed to complete/uncomplete item: ", err);
			alert(`Failed to complete/uncomplete item: ${err}`);
		}
	}

	const items = list?.items ?? [];

	return { items, addItem, setCompleted };
}

/**
 * Get all the lists
 */
export function useLists() {
	const { lists, setLists } = useContext(allListsContext);

	async function addList(name: string) {
		try {
			const res = await fetch("/api/lists", { method: "POST", body: name });
			if (res.ok) {
				const slug = await res.text();

				// Add new list to list
				setLists((prevLists) => ({
					...prevLists,
					[slug]: { name, slug, items: [] },
				}));
			}
		} catch (err) {
			console.error("Failed to create new list: ", err);
			alert(`Failed to add list: ${err}`);
		}
	}

	function getList(slug: string | null) {
		// Make life easy for consumers
		if (slug === null) return null;

		return lists?.[slug] ?? null;
	}

	return {
		lists: lists === null ? [] : Object.values(lists),
		addList,
		getList,
	};
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
