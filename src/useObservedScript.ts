import { useEffect, useMemo, useState } from "react";
import { ScriptEvalOptions, ScriptHost, ScriptObserveOptions } from "scripthost";
import { ScriptValue } from "scripthost-core";
import { isNonVoidScript } from "./internal/void-script";
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
export type UseObservedScriptOptions = Pick<ScriptEvalOptions, "instanceId">;

/**
 * @public
 */
export function useObservedScript(script: string | null, options: UseObservedScriptOptions = {}): ObservedScript {
    const { instanceId } = options;
    const host = useScriptHost();
    const entry = useMemo(() => {
        if (isNonVoidScript(script)) {
            return getCacheEntry(host, script, instanceId);
        } else {
            return null;
        }
    }, [host, script, instanceId]);
    const [output, setOutput] = useState(entry ? entry.output : successOutput(void(0)));

    useEffect(() => {
        if (entry) {
            setOutput(entry.output);
            return entry.observe(setOutput);
        }
    }, [entry]);

    return output;
}

class CacheEntry {
    readonly #callbacks = new Map<(output: ObservedScript) => void, number>();
    readonly #host: ScriptHost;
    readonly #script: string;
    readonly #instanceId: string | undefined;
    #output = initialOutput;
    #dispose: (() => void) | null = null;

    constructor(host: ScriptHost, script: string, instanceId: string | undefined) {
        this.#host = host;
        this.#script = script;
        this.#instanceId = instanceId;
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
                    if (this.#callbacks.size === 0) {
                        setTimeout(() => {
                            if (this.active && this.#callbacks.size === 0) {
                                this.#stop();
                            }
                        }, LINGER_TIME_MS);
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

const getCacheEntry = (host: ScriptHost, script: string, instanceId: string | undefined): CacheEntry => {
    let perHost = PER_HOST_CACHE.get(host);
    if (!perHost) {
        PER_HOST_CACHE.set(host, perHost = new Map());
    }

    let perScript = perHost.get(script);
    if (!perScript) {
        perHost.set(script, perScript = new Map());
    }

    let perInstance = perScript.get(instanceId);
    if (!perInstance) {
        perScript.set(instanceId, perInstance = new CacheEntry(host, script, instanceId));
    }

    return perInstance;
};

const PER_HOST_CACHE = new WeakMap<ScriptHost, Map<string, Map<string | undefined, CacheEntry>>>();

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

const LINGER_TIME_MS = 1000;