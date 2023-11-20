import { useEffect, useMemo, useState } from "react";
import { useItems } from "../state/listsState";
import { useSlug } from "../state/slugState";
import { NewTodoInput } from "./NewTodoInput";
import { DropZone } from "./ItemActionDropZones";

export function List() {
	const slug = useSlug();
	const { items, setCompleted, editItem, deleteItem } = useItems();
	const [showCompleted, setShowCompleted] = useState(false);
	const [updated, setUpdated] = useState(new Date());

	const sortedAndFilteredItems = useMemo(
		() =>
			items
				.filter((item) => (!showCompleted && item.is_completed ? false : true))
				.sort((a, b) => b.created_at - a.created_at),
		[items, showCompleted]
	);

	const completedCount = useMemo(
		() => items.filter((item) => item.is_completed).length,
		[items]
	);

	// Keep timestamps up-t-date by re-rendering every 30s
	useEffect(() => {
		const interval = setInterval(
			() => setUpdated(new Date()),
			// Every 30 seconds
			30 * 1000
		);

		return () => clearInterval(interval);
	}, []);

	/**
	 * Time ago formatting funcationa dapted from https://stackoverflow.com/a/72817357
	 */
	function timeAgo(input: number) {
		if (updated.getTime() - input < 1000) return "just now";

		const date = new Date(input);
		const formatter = new Intl.RelativeTimeFormat("en");
		const ranges = [
			["years", 3600 * 24 * 365],
			["months", 3600 * 24 * 30],
			["weeks", 3600 * 24 * 7],
			["days", 3600 * 24],
			["hours", 3600],
			["minutes", 60],
			["seconds", 1],
		] as const;
		const secondsElapsed = (date.getTime() - updated.getTime()) / 1000;

		for (const [rangeType, rangeVal] of ranges) {
			if (rangeVal <= Math.abs(secondsElapsed)) {
				const delta = secondsElapsed / rangeVal;
				return formatter.format(Math.round(delta), rangeType);
			}
		}
	}

	return (
		<div id="list-container">
			{slug === null ? (
				<p className="big-message-text">Choose a to-do list</p>
			) : (
				<>
					<div id="top-section">
						<NewTodoInput />
						<menu id="item-action-controls">
							<label
								htmlFor="show-completed-toggle"
								id="show-completed-toggle-wrapper"
							>
								<input
									type="checkbox"
									id="show-completed-toggle"
									checked={showCompleted}
									onChange={(event) => setShowCompleted(event.target.checked)}
								/>{" "}
								Show completed ({completedCount})
							</label>
							<DropZone
								label="Edit item"
								id="edit-item-text"
								onDrop={(item) => {
									const newText = prompt("Edit item", item.text);
									if (!newText) return;
									editItem(item, newText);
								}}
								title="Drop an item here to edit"
							/>
							<DropZone
								label="Delete item"
								id="delete-item"
								onDrop={(item) => {
									const shouldDelete = confirm(
										`Are you sure you want to delete '${item.text}'?`
									);
									if (shouldDelete) deleteItem(item.id);
								}}
								title="Drop an item here to delete"
							/>
						</menu>
					</div>
					<ul id="todo-items">
						{sortedAndFilteredItems.map((item) => (
							<li className="todo-item-container" key={item.id}>
								<label
									draggable="true"
									onDragStart={(event) => {
										// Say it can be moved
										event.dataTransfer.effectAllowed = "move";

										// For compatibility with other applications
										event.dataTransfer.setData(
											"text/plain",
											`- [${item.is_completed ? "x" : " "}] ${item.text}`
										);

										// Used by app
										event.dataTransfer.setData(
											"application/x-todo-list-list-slug",
											item.list
										);
										event.dataTransfer.setData(
											"application/x-todo-list-item-id",
											item.id + ""
										);
									}}
									className="todo-item"
									htmlFor={`item-checkbox-${item.id}`}
								>
									<input
										type="checkbox"
										id={`item-checkbox-${item.id}`}
										title="Mark completed"
										checked={item.is_completed}
										onChange={(event) =>
											setCompleted(item, event.currentTarget.checked)
										}
									/>
									<span className="item-text">{item.text}</span>
									<span className="created-at">
										Created {timeAgo(item.created_at)}{" "}
									</span>
								</label>
							</li>
						))}
					</ul>
				</>
			)}
		</div>
	);
}
