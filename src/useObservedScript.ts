import { useLayoutEffect, useMemo, useState } from "react";
import { ScriptEvalOptions } from "scripthost";
import { ScriptValue } from "scripthost-core";
import { useScriptHost } from "./ScriptHostScope";

/**
 * @public
 */
export interface ObservedScript {
    result: ScriptValue;
    ready: boolean;
    error: Error | null;
}

/**
 * @public
 */
export type UseObservedScriptOptions = Pick<ScriptEvalOptions, "instanceId" | "timeout">;

/**
 * @public
 */
export function useObservedScript(script: string, options: UseObservedScriptOptions = {}): ObservedScript {
    const { instanceId, timeout } = options;
    const host = useScriptHost();
    const [output, setOutput] = useState(initialOutput);

    useLayoutEffect(() => {
        const onNext = (result: ScriptValue) => {
            setOutput(successOutput(result));
        };
        const onError = (err: unknown) => {
            const error = err instanceof Error ? err : new Error("Script failed");
            setOutput(errorOutput(error));
        };
        setOutput(initialOutput);
        return host.observe(script, { instanceId, timeout, onNext, onError });
    }, [host, script, instanceId, timeout]);

    return output;
}

const initialOutput: ObservedScript = Object.freeze({
    result: undefined,
    ready: false,
    error: null,
});

const successOutput = (result: ScriptValue): ObservedScript => Object.freeze({
    result,
    ready: true,
    error: null,
});

const errorOutput = (error: Error): ObservedScript => Object.freeze({
    result: undefined,
    ready: true,
    error,
});
