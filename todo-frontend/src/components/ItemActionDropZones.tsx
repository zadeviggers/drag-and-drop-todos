import { useState } from "react";
import { TodoItem } from "../../../types";
import { useLists } from "../state/listsState";

/**
 * Little reusable dropzone component
 */
export function DropZone({
	label,
	id,
	onDrop,
	...rest
}: {
	label: string;
	id: string;
	onDrop: (item: TodoItem) => void;
	[x: string]: unknown;
}) {
	const [hovered, setHovered] = useState(false);
	const { getItem } = useLists();

	return (
		<li
			{...rest}
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
