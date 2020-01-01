// A quick undo-redo data structure using immutability.

export type UndoRedo<T> = {
	entries: T[];
	currUndoIndex: number;
	maxLength: number;
};

export function init<T>(firstEntry: T, maxLength = 100): UndoRedo<T> {
	return {
		entries: [firstEntry],
		currUndoIndex: 0,
		maxLength,
	};
}

// Getters

export function getCurrent<T>(ur: UndoRedo<T>): T | null {
	return ur.entries[ur.currUndoIndex] || null;
}

export function getAtIndex<T>(ur: UndoRedo<T>, index: number): T | null {
	return ur.entries[index] || null;
}

export function getLength<T>(ur: UndoRedo<T>): number {
	return ur.entries.length;
}

export function getCurrentIndex<T>(ur: UndoRedo<T>): number {
	return ur.currUndoIndex;
}

export function isUndoEnabled<T>(ur: UndoRedo<T>): boolean {
	return ur.currUndoIndex > 0;
}

export function isRedoEnabled<T>(ur: UndoRedo<T>): boolean {
	return ur.currUndoIndex < ur.entries.length - 1;
}

// Modifiers

export function addEntry<T>(ur: UndoRedo<T>, entry: T): UndoRedo<T> {
	const newLen = ur.currUndoIndex + 2;
	const startSlice = Math.max(0, newLen - ur.maxLength);
	const entries = ur.entries.slice(startSlice, newLen - 1);
	entries.push(entry);
	return {
		...ur,
		entries,
		currUndoIndex: newLen - 1,
	};
}

export function undo<T>(ur: UndoRedo<T>): UndoRedo<T> {
	if (ur.currUndoIndex <= 0) return ur;
	return {
		...ur,
		currUndoIndex: ur.currUndoIndex - 1,
	};
}

export function redo<T>(ur: UndoRedo<T>): UndoRedo<T> {
	if (ur.currUndoIndex >= ur.entries.length - 1) return ur;
	return {
		...ur,
		currUndoIndex: ur.currUndoIndex + 1,
	};
}

export function setIndex<T>(ur: UndoRedo<T>, index: number): UndoRedo<T> {
	return {
		...ur,
		currUndoIndex: index,
	};
}
