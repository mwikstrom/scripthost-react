import type { ScriptValue } from "scripthost-core";
import type { ObservedScript } from "../useObservedScript";

/** @internal */
export const initialOutput: ObservedScript = Object.freeze({
    result: undefined,
    ready: false,
    error: null,
});

/** @internal */
export const successOutput = (result: ScriptValue): ObservedScript => Object.freeze({
    result,
    ready: true,
    error: null,
});

/** @internal */
export const errorOutput = (error: Error): ObservedScript => Object.freeze({
    result: undefined,
    ready: true,
    error,
});
