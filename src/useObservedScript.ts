import { useEffect, useMemo, useState } from "react";
import { ScriptEvalOptions } from "scripthost";
import { ScriptValue } from "scripthost-core";
import { ObservableScript } from "./internal/observable";
import { successOutput } from "./internal/output";
import { isVoidScript } from "./internal/void-script";
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
export type UseObservedScriptOptions = Pick<ScriptEvalOptions, "instanceId" | "vars" | "context">;

/**
 * @public
 */
export function useObservedScript(script: string | null, options: UseObservedScriptOptions = {}): ObservedScript {
    const { instanceId, vars, context } = options;
    const host = useScriptHost();
    const deps = [host, script || "", instanceId, vars, context] as const;
    const observable = useMemo(() => isVoidScript(script) ? null : new ObservableScript(...deps), deps);
    const [output, setOutput] = useState(() => observable?.output || successOutput(void(0)));

    useEffect(() => {
        setOutput(observable?.output || successOutput(void(0)));
        return observable?.observe(setOutput);
    }, [observable]);

    return output;
}
