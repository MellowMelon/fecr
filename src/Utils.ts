import _ from "lodash";
import {useRef, useEffect} from "react";

export function assertNever(v: never): never {
	throw new Error("Unexpected value: " + JSON.stringify(v));
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
