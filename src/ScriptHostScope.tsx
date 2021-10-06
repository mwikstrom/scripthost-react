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
    const {  children } = props;
    const host = useMemo(() => props.host ?? createBrowserScriptHost(), [props.host]);
    return (
        <ScriptHostContext.Provider
            value={host}
            children={children}
        />
    );
};

/**
 * @public
 */
export const useScriptHost = (): ScriptHost => useContext(ScriptHostContext);

const ScriptHostContext = createContext<ScriptHost>(createBrowserScriptHost());
