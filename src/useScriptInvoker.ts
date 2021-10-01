import { useCallback } from "react";
import { ScriptEvalOptions } from "scripthost";
import { ScriptValue } from "scripthost-core";
import { useScriptHost } from "./ScriptHostScope";

/**
 * @public
 */
export type ScriptInvoker = () => Promise<ScriptValue>;

/**
 * @public
 */
export type UseScriptInvokerOptions = Pick<ScriptEvalOptions, "instanceId" | "timeout">;

/**
 * @public
 */
export function useScriptInvoker(script: string, options: UseScriptInvokerOptions = {}): ScriptInvoker {
    const { instanceId, timeout } = options;
    const host = useScriptHost();
    return useCallback(() => host.eval(script, { instanceId, timeout }), [host, script, instanceId, timeout]);
}