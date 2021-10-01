import { useEffect, useState } from "react";
import { ScriptEvalOptions } from "scripthost";
import { ScriptValue } from "scripthost-core";
import { useScriptHost } from "./ScriptHostScope";

/**
 * @public
 */
export interface ObservedScript {
    result: ScriptValue;
    ready: boolean;
    failed: boolean;
    error: unknown;
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

    useEffect(() => {
        const onNext = (result: ScriptValue) => setOutput(successOutput(result));
        const onError = (error: unknown) => setOutput(errorOutput(error));
        setOutput(initialOutput);
        return host.observe(script, { instanceId, timeout, onNext, onError });
    }, [host, script, instanceId, timeout, setOutput]);

    return output;
}

const initialOutput: ObservedScript = Object.freeze({
    result: undefined,
    ready: false,
    failed: false,
    error: undefined,
});

const successOutput = (result: ScriptValue): ObservedScript => Object.freeze({
    result,
    ready: true,
    failed: false,
    error: undefined,
});

const errorOutput = (error: unknown): ObservedScript => Object.freeze({
    result: undefined,
    ready: true,
    failed: true,
    error,
});
