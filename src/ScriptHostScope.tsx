import React, { createContext, FC, ReactNode, useContext, useMemo } from "react";
import { ScriptHost } from "scripthost";
import { createBrowserScriptHost } from "./createBrowserScriptHost";

/**
 * @public
 */
export interface ScriptHostScopeProps {
    children?: ReactNode;
    host?: ScriptHost;
}

/**
 * @public
 */
export const ScriptHostScope: FC<ScriptHostScopeProps> = props => {
    const { children, host } = props;
    const getter = useMemo(() => host ? () => host : once(createBrowserScriptHost), [host]);
    return (
        <ScriptHostContext.Provider
            value={getter}
            children={children}
        />
    );
};

/**
 * @public
 */
export const useScriptHost = (): ScriptHost => useContext(ScriptHostContext)();

const once = <T,>(func: () => T): () => T => {
    let memo: T | undefined;
    return () => {
        if (memo === undefined) {
            memo = func();
        }
        return memo;
    };
};

type ScriptHostGetter = () => ScriptHost;
const ScriptHostContext = createContext<ScriptHostGetter>(once(createBrowserScriptHost));
