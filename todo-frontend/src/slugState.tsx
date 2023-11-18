import { createContext, useContext, useEffect, useState } from "react";

// Set this to false to fall back to full page refreshes
export const CLIENT_SIDE_ROUTING = true;

const currentListSlugContext = createContext<{
	slug: null | string;
	setSlug: React.Dispatch<React.SetStateAction<string | null>>;
}>({ slug: null, setSlug: () => {} });

/**
 * Helper function for parsing URL
 */
function getCurrentSlugFromURL() {
	return window.location.pathname.match(/\/list\/([^/?]+)/)?.[1] ?? null;
}

/**
 * Context provider that sets up all the state we need
 */
export function CurrentListSlugContextProvider({
	children,
}: React.PropsWithChildren) {
	const [slug, setSlug] = useState<string | null>(getCurrentSlugFromURL);

	useEffect(() => {
		if (CLIENT_SIDE_ROUTING) {
			window.addEventListener("popstate", () => {
				setSlug(getCurrentSlugFromURL);
			});
		}
	}, []);

	return (
		<currentListSlugContext.Provider value={{ slug, setSlug }}>
			{children}
		</currentListSlugContext.Provider>
	);
}

/**
 * Get the current slug
 */
export function useSlug() {
	const { slug } = useContext(currentListSlugContext);
	return slug;
}

/**
 * Navigate to a new slug
 */
export function useNavigateToSlug() {
	const { setSlug } = useContext(currentListSlugContext);
	return (newSlug: string) => {
		setSlug(newSlug);
		const url = new URL(location.href);
		url.pathname = `/list/${newSlug}`;
		history.pushState(null, "", url);
	};
}
