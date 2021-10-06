import { ScriptHost, ScriptHostOptions } from "scripthost";
import { BrowserSandbox, BrowserSandboxOptions } from "scripthost-browser";

/**
 * @public
 */
export function createBrowserScriptHost(
    options: ScriptHostOptions & Pick<BrowserSandboxOptions, "unsafe"> = {}
): ScriptHost {
    const { unsafe, ...hostOptions } = options;
    return new ScriptHost(() => new BrowserSandbox({ unsafe }), { ...hostOptions });
}
