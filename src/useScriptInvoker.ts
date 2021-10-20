import { useCallback } from "react";
import { ScriptEvalOptions } from "scripthost";
import { ScriptValue } from "scripthost-core";
import { isNonVoidScript } from "./internal/void-script";
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
export function useScriptInvoker(script: string | null, options: UseScriptInvokerOptions = {}): ScriptInvoker {
    const { instanceId, timeout } = options;
    const host = useScriptHost();
    return useCallback<ScriptInvoker>(async () => {
        if (isNonVoidScript(script)) {
            await host.eval(script, { instanceId, timeout });
        } else {
            return void(0);
        }
    }, [host, script, instanceId, timeout]);
}