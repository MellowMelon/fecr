import _ from "lodash";

// Some basic utilities not specific to this project.

// Typescript helper to enforce a check that a type is inferred never.
export function assertNever(v: never): never {
	throw new Error("Unexpected value: " + JSON.stringify(v));
}

// filterNonempty predicate.
function notEmpty<T>(value: T | null | undefined): value is T {
	return value !== null && value !== undefined;
}

// Filter null and undefined out of an array in a way that typescript likes.
export function filterNonempty<T>(arr: (T | null | undefined)[]): T[] {
	return arr.filter(notEmpty);
}

// Given any number of objects, return an object with the same keys as the
// first one and values the sum of the values across all objects for the
// corresponding keys.
export function sumObjects(...ts: {[k: string]: number}[]) {
	return _.mapValues(ts[0], (v, k) => _.sum(ts.map(t => t[k] || 0)));
}
