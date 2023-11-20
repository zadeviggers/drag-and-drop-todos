import { useState } from "react";
import { useItems, useLists } from "../state/listsState";
import {
	useNavigateToSlug,
	useSlug,
	CLIENT_SIDE_ROUTING,
} from "../state/slugState";

export function Sidebar() {
	const slug = useSlug();
	const navigateToSlug = useNavigateToSlug();
	const { moveItem } = useItems();
	const { lists, getList, addList, renameList, deleteList } = useLists();
	const currentList = getList(slug);
	const [currentDragOverSlug, setCurrentDragOverSlug] = useState<string | null>(
		null
	);

	return (
		<div id="sidebar">
			<h1 id="title">{currentList?.name ?? "Todos"}</h1>
			{currentList !== null && slug !== null && (
				<menu id="sidebar-list-actions">
					<li className="sidebar-action">
						<button
							id="rename-list-button"
							onClick={() => {
								const newName = prompt("Rename list", currentList.name);
								if (!newName) return;
								renameList(currentList, newName);
							}}
						>
							Rename
						</button>
					</li>
					<li className="sidebar-action">
						<button
							id="delete-list-button"
							onClick={() => {
								const shouldDelete = confirm(
									`Are you sure you want to delete '${currentList.name}'?\n\nThis will also delete all TODO items in it.									`
								);
								if (shouldDelete) deleteList(slug);
							}}
						>
							Delete
						</button>
					</li>
				</menu>
			)}
			<ul id="sidebar-lists" onDragExit={() => setCurrentDragOverSlug(null)}>
				{lists.map((list) => (
					<li
						key={list.slug}
						id={`list-link-${list.slug}`}
						className="sidebar-link-container"
						data-selected={list.slug === slug ? "" : null}
						data-drag-over={list.slug === currentDragOverSlug ? "" : null}
						onDragOver={(event) => {
							// Need to prevent this for some reason
							event.preventDefault();
							event.dataTransfer.dropEffect = "move";
						}}
						onDragEnter={(event) => {
							if (
								event.dataTransfer.getData(
									"application/x-todo-list-list-slug"
								) !== list.slug
							) {
								setCurrentDragOverSlug(list.slug);
							}
						}}
						onDragExit={(event) => {
							if (
								event.dataTransfer.getData(
									"application/x-todo-list-list-slug"
								) !== list.slug
							) {
								setCurrentDragOverSlug(null);
							}
						}}
						onDrop={(event) => {
							setCurrentDragOverSlug(null);
							const itemID = Number(
								event.dataTransfer.getData("application/x-todo-list-item-id")
							);
							moveItem(itemID, list.slug);
						}}
					>
						<a
							draggable="false"
							className="sidebar-link"
							href={`/list/${list.slug}`}
							onClick={(event) => {
								if (CLIENT_SIDE_ROUTING) {
									event.preventDefault();
									navigateToSlug(list.slug);
								}
							}}
						>
							{list.name}
						</a>
					</li>
				))}
				<li className="sidebar-link-container" id="add-new-button">
					<button
						className="sidebar-link"
						onClick={() => {
							// Browser UI is good enough here
							const name = prompt("Name for the new list:");
							if (name) addList(name);
						}}
					>
						+ Add list
					</button>
				</li>
			</ul>
		</div>
	);
}
