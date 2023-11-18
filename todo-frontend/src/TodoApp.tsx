import { List } from "./List";
import { Sidebar } from "./Sidebar";
import { ItemsContextProvider } from "./listsState";
import { CurrentListSlugContextProvider } from "./slugState";

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
