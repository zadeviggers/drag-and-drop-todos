import { List } from "./List";
import { Sidebar } from "./Sidebar";
import { ItemsContextProvider } from "../state/listsState";
import { CurrentListSlugContextProvider } from "../state/slugState";

export default function TodoApp() {
	return (
		<CurrentListSlugContextProvider>
			<ItemsContextProvider>
				<Sidebar />
				<List />
			</ItemsContextProvider>
		</CurrentListSlugContextProvider>
	);
}
