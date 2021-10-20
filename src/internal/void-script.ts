/** @internal */
export function isVoidScript(script: string | null): boolean {
    return script === null || /^\s*(?:\{\s*\}\s*)?$/.test(script);
}

/** @internal */
export function isNonVoidScript(script: string | null): script is string {
    return !isVoidScript(script);
}
