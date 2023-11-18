import { useLists } from "./listsState";

export function Sidebar({ slug }: { slug: string | null }) {
  const lists = useLists();

  return (
    <div id="sidebar">
      {lists.map((list) => (
        <ul
          id="sidebar-lists"
          key={list.slug}
          className="list-link"
          data-selected={list.slug === slug}
        >
          <a href={`/list/${list.slug}`}>{list.name}</a>
        </ul>
      ))}
    </div>
  );
}
