/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { FC } from "react";
import { create, act, ReactTestRenderer } from "react-test-renderer";
import { ScriptHost } from "scripthost";
import { createBrowserScriptHost, ScriptHostScope, useObservedScript, useScriptInvoker } from "../src";

test("Simple counter", async () => {
    const host = createBrowserScriptHost({ unsafe: true });
    const element = <CounterControl host={host}/>;
    
    // Initialzing
    let renderer: ReactTestRenderer;
    act(() => void(renderer = create(element)));
    expect(renderer!.toJSON()).toMatchSnapshot("Initializing");
    
    // Expression evaluated => Value = 0
    await act(async () => {
        await host.whenIdle();
        renderer.update(element);
    });
    expect(renderer!.toJSON()).toMatchSnapshot("Value = 0");

    // Click increment button => Value = 1
    await act(async () => {
        renderer.root.findByType("button").props.onClick();
        await host.whenIdle();
        renderer.update(element);
    });
    expect(renderer!.toJSON()).toMatchSnapshot("Value = 1");

    // Click increment button => Value = 2
    await act(async () => {
        renderer.root.findByType("button").props.onClick();
        await host.whenIdle();
        renderer.update(element);
    });
    expect(renderer!.toJSON()).toMatchSnapshot("Value = 2");

    // Unmount and wait for observed script linger timeout
    jest.useFakeTimers();
    act(() => renderer!.unmount());
    jest.runAllTimers();
});

const CounterControl: FC<{ host: ScriptHost }> = ({host}) => (
    <ScriptHostScope host={host}>
        <IncrementButton/>
        <CounterValue/>
    </ScriptHostScope>
);

const CounterValue: FC = () => {
    const { result, ready } = useObservedScript("value || 0");
    if (ready) {
        return <div>Value = {String(result)}</div>;
    } else {
        return <div>Initializing</div>;
    }
};

const IncrementButton: FC = () => {
    const increment = useScriptInvoker("value = (value || 0) + 1");
    return <button onClick={increment}>Increment</button>;
};
