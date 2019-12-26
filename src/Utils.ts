import _ from "lodash";
import {useRef, useEffect} from "react";

export function assertNever(v: never): never {
	throw new Error("Unexpected value: " + JSON.stringify(v));
}

function notEmpty<T>(value: T | null | undefined): value is T {
	return value !== null && value !== undefined;
}

export function filterNonempty<T>(arr: (T | null | undefined)[]): T[] {
	return arr.filter(notEmpty);
}

export function sumObjects(...ts: {[k: string]: number}[]) {
	return _.mapValues(ts[0], (v, k) => _.sum(ts.map(t => t[k] || 0)));
}

export function usePrevious<T>(value: T): T | undefined {
	const ref = useRef<T>();
	useEffect(() => {
		ref.current = value;
	});
	return ref.current;
}
