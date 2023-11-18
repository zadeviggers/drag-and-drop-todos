import { useMemo, useState } from "react";
import { useItems } from "./listsState";

export function List({ slug }: { slug: string | null }) {
	const [showCompleted, setShowCompleted] = useState(false);
	const items = useItems(slug);

	const sortedAndFilteredItems = useMemo(
		() =>
			items
				.filter((item) => (!showCompleted && item.is_completed ? false : true))
				.sort((a, b) => a.created_at - b.created_at),
		[items, showCompleted]
	);

	return (
		<div id="list-container">
			{slug === null ? (
				<p className="big-message-text">Choose a to-do list</p>
			) : (
				<>
					<div id="top-section">
						<form action="#" onSubmit={() => {}}>
							<label
								htmlFor="new-todo-input"
								className="new-todo-input-wrapper"
							>
								Add task
								<input id="new-todo-input" name="new-todo" type="text" />
							</label>
						</form>
						<label
							htmlFor="show-completed-toggle"
							className="show-completed-toggle-wrapper"
						>
							<input
								type="checkbox"
								id="show-completed-toggle"
								onChange={(event) => setShowCompleted(event.target.checked)}
							/>{" "}
							Show completed
						</label>
					</div>
					<ul id="todo-items">
						{sortedAndFilteredItems.map((item) => (
							<li key={item.id}>{item.text}</li>
						))}
					</ul>
				</>
			)}
		</div>
	);
}
