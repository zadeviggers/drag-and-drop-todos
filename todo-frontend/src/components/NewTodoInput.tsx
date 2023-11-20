import { useState } from "react";
import { useItems } from "../state/listsState";
import { useSlug } from "../state/slugState";

export function NewTodoInput() {
	const slug = useSlug();
	const [newTodoText, setNewTodoText] = useState("");
	const { addItem } = useItems(slug);

	return (
		<form
			action="#"
			onSubmit={(event) => {
				event.preventDefault();
				const text = newTodoText.trim();
				if (text.length === 0) return;
				setNewTodoText("");
				addItem(text);
			}}
		>
			<label htmlFor="new-todo-input" id="new-todo-input-wrapper">
				Add task
				<input
					autoFocus
					id="new-todo-input"
					name="item-text"
					value={newTodoText}
					onChange={(event) => setNewTodoText(event.currentTarget.value)}
					type="text"
				/>
			</label>
		</form>
	);
}
