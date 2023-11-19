import { useLists } from "../state/listsState";
import {
	useNavigateToSlug,
	useSlug,
	CLIENT_SIDE_ROUTING,
} from "../state/slugState";

export function Sidebar() {
	const slug = useSlug();
	const navigateToSlug = useNavigateToSlug();
	const { lists, getList, addList } = useLists();
	const currentList = getList(slug);

	return (
		<div id="sidebar">
			<h1 id="title">{currentList?.name ?? "Todos"}</h1>
			<ul id="sidebar-lists">
				{lists.map((list) => (
					<li
						key={list.slug}
						id={`list-link-${list.slug}`}
						className="sidebar-link-container"
						data-selected={list.slug === slug ? "" : null}
					>
						<a
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
