import _ from "lodash";
import {useRef, useEffect} from "react";

export function assertNever(v: never): never {
	throw new Error("Unexpected value: " + JSON.stringify(v));
}

export function sumObjects(
	t1: {[k: string]: number},
	t2: {[k: string]: number}
) {
	return _.mapValues(t1, (v, k) => v + t2[k]);
}

export function usePrevious<T>(value: T): T | undefined {
	const ref = useRef<T>();
	useEffect(() => {
		ref.current = value;
	});
	return ref.current;
}
