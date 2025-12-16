import { useCallback, useEffect, useState } from "react";

export default function useLocalStorage<T>(key: string, initialValue: T) {
	const isClient = typeof window !== "undefined";

	const readValue = useCallback((): T => {
		if (!isClient) return initialValue;
		try {
			const item = window.localStorage.getItem(key);
			if (item === null) return initialValue;
			return JSON.parse(item) as T;
		} catch (e) {
			try {
				window.localStorage.removeItem(key);
			} catch {}
			// fallback to initial value on corrupt data
			return initialValue;
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key, isClient]);

	const [state, setState] = useState<T>(readValue);

	useEffect(() => {
		setState(readValue());
	}, [readValue]);

	const setValue = useCallback(
		(val: T | ((prev: T) => T)) => {
			try {
				const valueToStore =
					typeof val === "function"
						? (val as (p: T) => T)(state)
						: val;
				setState(valueToStore);
				if (!isClient) return;
				window.localStorage.setItem(key, JSON.stringify(valueToStore));
			} catch {
				// ignore write errors
			}
		},
		[key, isClient, state]
	);

	return [state, setValue] as const;
}
