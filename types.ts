export interface TodoItem {
	id: number;
	text: string;
	list: string;
	created_at: number;
	is_completed: boolean;
}

export interface TodoList {
	name: string;
	slug: string;
	items: TodoItem[];
}
