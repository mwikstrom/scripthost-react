import { useEffect, useMemo, useState } from "react";
import { ScriptEvalOptions, ScriptHost, ScriptObserveOptions } from "scripthost";
import { ScriptValue } from "scripthost-core";
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
export type UseObservedScriptOptions = Pick<ScriptEvalOptions, "instanceId" | "vars">;

/**
 * @public
 */
export function useObservedScript(script: string | null, options: UseObservedScriptOptions = {}): ObservedScript {
    const { instanceId, vars } = options;
    const host = useScriptHost();
    const deps = [host, script || "", instanceId, vars] as const;
    const observable = useMemo(() => isVoidScript(script) ? null : new ObservableScript(...deps), deps);
    const [output, setOutput] = useState(() => observable?.output || successOutput(void(0)));

    useEffect(() => {
        setOutput(observable?.output || successOutput(void(0)));
        return observable?.observe(setOutput);
    }, [observable]);

    return output;
}

class ObservableScript {
    readonly #callbacks = new Map<(output: ObservedScript) => void, number>();
    readonly #host: ScriptHost;
    readonly #script: string;
    readonly #instanceId: string | undefined;
    readonly #vars: Record<string, ScriptValue> | undefined;
    #output = initialOutput;
    #dispose: (() => void) | null = null;

    constructor(
        host: ScriptHost, 
        script: string, 
        instanceId: string | undefined, 
        vars: Record<string, ScriptValue> | undefined,
    ) {
        this.#host = host;
        this.#script = script;
        this.#instanceId = instanceId;
        this.#vars = vars;
    }

    get output(): ObservedScript {
        return this.#output;
    }

    get active(): boolean {
        return this.#dispose !== null;
    }

    observe(callback: (output: ObservedScript) => void): () => void {
        let active = true;
        const incremented = (this.#callbacks.get(callback) ?? 0) + 1;
        this.#callbacks.set(callback, incremented);

        if (!this.active) {
            this.#start();
        }

        return () => {
            if (active) {
                const decremented = (this.#callbacks.get(callback) ?? 0) - 1;
                active = false;
                if (decremented <= 0) {
                    this.#callbacks.delete(callback);
                    if (this.active && this.#callbacks.size === 0) {
                        this.#stop();
                    }
                }
            }
        };
    }

    #start() {
        if (this.#dispose) {
            return;
        }

        const options: ScriptObserveOptions = {
            instanceId: this.#instanceId,
            vars: this.#vars,
            onNext: result => this.#onNext(result),
            onError: error => this.#onError(error),            
        };

        this.#dispose = this.#host.observe(this.#script, options);
    }

    #stop() {
        if (!this.#dispose) {
            return;
        }

        try {
            this.#dispose();
        } catch (error) {
            console.error("Disposal of observed script threw exception:", error);
        }

        this.#dispose = null;
    }

    #onNext(result: ScriptValue) {
        this.#output = successOutput(result);
        this.#notify();
    }

    #onError(error: unknown) {
        this.#output = errorOutput(error instanceof Error ? error : new Error("Script failed"));
        this.#notify();
    }

    #notify() {
        for (const callback of this.#callbacks.keys()) {
            try {
                callback(this.#output);
            } catch (error) {
                console.error("Observed script callback threw exception:", error);
            }
        }
    }
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
