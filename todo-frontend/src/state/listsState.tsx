import { createContext, useContext, useEffect, useState } from "react";
import { TodoItem, TodoList } from "../../../types.ts";
import { useNavigateToSlug, useSlug } from "./slugState.tsx";

const allListsContext = createContext<{
	lists: null | Record<string, TodoList>;
	setLists: React.Dispatch<
		React.SetStateAction<Record<string, TodoList> | null>
	>;
	// No-op the interface
}>({ lists: null, setLists: () => {} });

/**
 * Hook for dealing with items
 */
export function useItems() {
	const slug = useSlug();
	const { lists, setLists } = useContext(allListsContext);

	const list: TodoList | null = slug ? lists?.[slug] ?? null : null;

	function getItem(itemID: number): TodoItem | null {
		const item = list?.items?.find((item) => item.id === itemID) ?? null;
		return item;
	}

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
		// I'd love to do optimistic updates, but I don't have time
		// to sort out the rollback logic
		try {
			// Race condition if an item is completed and moved.
			// Oh well, don't have time.
			const newItemData: TodoItem = { ...item, is_completed };

			const res = await fetch(`/api/items/${item.id}`, {
				method: "PATCH",
				body: JSON.stringify({ is_completed }),
			});

			if (res.ok) {
				setLists((prevLists) => {
					const prevList = prevLists?.[newItemData.list];
					if (!prevList) return null;

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
			} else {
				throw `${res.status} - ${await res.text()}`;
			}
		} catch (err) {
			console.error("Failed to complete/uncomplete item: ", err);
			alert(`Failed to complete/uncomplete item: ${err}`);
		}
	}

	async function editItem(item: TodoItem, text: string) {
		try {
			const newItemData: TodoItem = { ...item, text };

			const res = await fetch(`/api/items/${item.id}`, {
				method: "PATCH",
				body: JSON.stringify({ text }),
			});

			if (res.ok) {
				setLists((prevLists) => {
					const prevList = prevLists?.[newItemData.list];
					if (!prevList) return null;

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
			} else {
				throw `${res.status} - ${await res.text()}`;
			}
		} catch (err) {
			console.error("Failed to complete/uncomplete item: ", err);
			alert(`Failed to complete/uncomplete item: ${err}`);
		}
	}

	async function deleteItem(itemID: number) {
		if (list === null) {
			console.warn("Ignoring item delete because list is null");
			return;
		}
		try {
			const res = await fetch(`/api/items/${itemID}`, { method: "DELETE" });
			if (res.ok) {
				setLists((prevLists) => {
					const prevList = prevLists?.[list?.slug];
					if (!prevList) return null;

					return {
						...prevLists,
						[prevList.slug]: {
							...prevList,
							items: prevList.items.filter((item) => item.id !== itemID),
						},
					};
				});
			}
		} catch (err) {
			console.error("Failed to delete item: ", err);
			alert(`Failed to delete item: ${err}`);
		}
	}

	async function moveItem(itemID: number, toListSlug: string) {
		if (list === null) {
			console.warn("Ignoring item move because list (fromList) is null");
			return;
		}

		const fromList = lists?.[list?.slug];
		const toList = lists?.[toListSlug];
		if (!fromList || !toList) return;
		const item = getItem(itemID);
		if (!item) return;

		try {
			const data = {
				list: toListSlug,
			};

			const res = await fetch(`/api/items/${itemID}`, {
				method: "PATCH",
				body: JSON.stringify(data),
			});

			if (res.ok) {
				setLists((prevLists) => {
					return {
						...prevLists,
						[fromList.slug]: {
							...fromList,
							items: [...fromList.items.filter((item) => item.id !== itemID)],
						},
						[toList.slug]: {
							...toList,
							items: [...toList.items, { ...item, list: toListSlug }],
						},
					};
				});
			}
		} catch (err) {
			console.error("Failed to change item list: ", err);
			alert(`Failed to change item list: ${err}`);
		}
	}

	const items = list?.items ?? [];

	return {
		items,
		addItem,
		setCompleted,
		editItem,
		deleteItem,
		moveItem,
		getItem,
	};
}

/**
 * Hook for dealing with lists
 */
export function useLists() {
	const { lists, setLists } = useContext(allListsContext);
	const navigateToSlug = useNavigateToSlug();
	const currentSlug = useSlug();

	function getList(slug: string | null) {
		// Make life easy for consumers
		if (slug === null) return null;

		return lists?.[slug] ?? null;
	}

	async function addList(name: string) {
		try {
			const res = await fetch("/api/lists", { method: "POST", body: name });
			if (res.ok) {
				const slug = await res.text();

				// Add new list to dict
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

	async function renameList(list: TodoList, name: string) {
		try {
			const res = await fetch(`/api/lists/${list.slug}`, {
				method: "PATCH",
				body: name,
			});

			if (res.ok) {
				setLists((prevLists) => {
					const prevList = prevLists?.[list.slug];
					if (!prevList) return null;

					return {
						...prevLists,
						[prevList.slug]: {
							...prevList,
							name,
						},
					};
				});
			} else {
				throw `${res.status} - ${await res.text()}`;
			}
		} catch (err) {
			console.error("Failed to rename list: ", err);
			alert(`Failed to rename list: ${err}`);
		}
	}

	async function deleteList(listSlug: string) {
		try {
			const res = await fetch(`/api/lists/${listSlug}`, { method: "DELETE" });
			if (res.ok) {
				setLists((prevLists) => {
					const newLists = {
						...prevLists,
					};

					delete newLists[listSlug];

					return newLists;
				});
			}
			if (currentSlug === listSlug) {
				navigateToSlug(null);
			}
		} catch (err) {
			console.error("Failed to delete list: ", err);
			alert(`Failed to delete list: ${err}`);
		}
	}

	return {
		lists: lists === null ? [] : Object.values(lists),
		addList,
		getList,
		renameList,
		deleteList,
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
				.then((data) => {
					setLists(data);
				})
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
