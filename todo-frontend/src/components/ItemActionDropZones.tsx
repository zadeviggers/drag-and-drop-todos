import { useState } from "react";
import { TodoItem } from "../../../types";
import { useLists } from "../state/listsState";

export function ItemActionDropZones() {
	const { editItem, deleteItem } = useLists();

	return (
		<menu className="item-action-dropzones">
			<DropZone
				label="Edit"
				id="edit-item-text"
				onDrop={(item) => {
					const newText = prompt("Edit item", item.text);
					if (!newText) return;
					editItem(item, newText);
				}}
			/>
			<DropZone
				label="Delete"
				id="delete-item"
				onDrop={(item) => {
					const shouldDelete = confirm(
						`Are you sure you want to delete '${item.text}'?`
					);
					if (shouldDelete) deleteItem(item.id, item.list);
				}}
			/>
		</menu>
	);
}

/**
 * Little reusable dropzone component
 */
function DropZone({
	label,
	id,
	onDrop,
}: {
	label: string;
	id: string;
	onDrop: (item: TodoItem) => void;
}) {
	const [hovered, setHovered] = useState(false);
	const { getItem } = useLists();

	return (
		<li
			id={`${id}-dropzone`}
			className="action-dropzone"
			data-drag-over={hovered ? "" : null}
			onDragOver={(event) => {
				// Need to prevent this for some reason
				event.preventDefault();
				event.dataTransfer.dropEffect = "move";
			}}
			onDragEnter={(event) => {
				if (
					event.dataTransfer.getData("application/x-todo-list-list-slug") &&
					event.dataTransfer.getData("application/x-todo-list-item-id")
				) {
					setHovered(true);
				}
			}}
			onDragExit={() => {
				setHovered(false);
			}}
			onDrop={(event) => {
				setHovered(false);
				const listSlug = event.dataTransfer.getData(
					"application/x-todo-list-list-slug"
				);
				const itemID = Number(
					event.dataTransfer.getData("application/x-todo-list-item-id")
				);
				if (!listSlug || !itemID || isNaN(itemID)) return;
				const item = getItem(listSlug, itemID);
				if (!item) return;

				onDrop(item);
			}}
		>
			{label}
		</li>
	);
}
