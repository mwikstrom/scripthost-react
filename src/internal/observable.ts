import { ScriptHost, ScriptObserveOptions } from "scripthost";
import type { ScriptValue } from "scripthost-core";
import type { ObservedScript } from "../useObservedScript";
import { initialOutput, successOutput, errorOutput } from "./output";

/** @internal */
export class ObservableScript {
    readonly #callbacks = new Map<(output: ObservedScript) => void, number>();
    readonly #host: ScriptHost;
    readonly #script: string;
    readonly #instanceId: string | undefined;
    readonly #vars: Record<string, ScriptValue> | undefined;
    readonly #context: unknown;
    #output = initialOutput;
    #dispose: (() => void) | null = null;

    constructor(
        host: ScriptHost, 
        script: string, 
        instanceId: string | undefined, 
        vars: Record<string, ScriptValue> | undefined,
        context: unknown,
    ) {
        this.#host = host;
        this.#script = script;
        this.#instanceId = instanceId;
        this.#vars = vars;
        this.#context = context;
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

    #start(): void {
        if (this.#dispose) {
            return;
        }

        const options: ScriptObserveOptions = {
            instanceId: this.#instanceId,
            vars: this.#vars,
            context: this.#context,
            onNext: result => this.#onNext(result),
            onError: error => this.#onError(error),            
        };

        this.#dispose = this.#host.observe(this.#script, options);
    }

    #stop(): void {
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

    #onNext(result: ScriptValue): void {
        this.#output = successOutput(result);
        this.#notify();
    }

    #onError(error: unknown): void {
        this.#output = errorOutput(error instanceof Error ? error : new Error("Script failed"));
        this.#notify();
    }

    #notify(): void {
        for (const callback of this.#callbacks.keys()) {
            try {
                callback(this.#output);
            } catch (error) {
                console.error("Observed script callback threw exception:", error);
            }
        }
    }
}
