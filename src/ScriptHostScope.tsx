import React, { createContext, FC, ReactNode, useContext, useMemo } from "react";
import { ScriptHost, ScriptHostOptions } from "scripthost";
import { BrowserSandbox } from "scripthost-browser";

/**
 * @public
 */
export interface ScriptHostScopeProps {
    children?: ReactNode;
}

/**
 * @public
 */
export const ScriptHostScope: FC<ScriptHostScopeProps> = props => {
    const {  children } = props;
    const host = useMemo(() => new ScriptHost(defaultHostOptions), []);
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

const createBrowserSandbox = () => new BrowserSandbox();

const defaultHostOptions: ScriptHostOptions = { createSandbox: createBrowserSandbox };

const ScriptHostContext = createContext<ScriptHost>(new ScriptHost(defaultHostOptions));
