/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { FC } from "react";
import { create, act, ReactTestRenderer } from "react-test-renderer";
import { ScriptHost } from "scripthost";
import { createBrowserScriptHost, ScriptHostScope, useObservedScript, useScriptInvoker } from "../src";

test("Parallel host counter", async () => {
    const host1 = createBrowserScriptHost({ unsafe: true });
    const host2 = createBrowserScriptHost({ unsafe: true });
    const element1 = <CounterControl host={host1}/>;
    const element2 = <CounterControl host={host2}/>;
    
    // Initialzing
    let renderer1: ReactTestRenderer;
    let renderer2: ReactTestRenderer;
    act(() => {
        renderer1 = create(element1);
        renderer2 = create(element2);
    });
    expect(renderer1!.toJSON()).toMatchSnapshot("[1] Initializing");
    expect(renderer2!.toJSON()).toMatchSnapshot("[2] Initializing");
    
    // Expression evaluated => Value = 0
    await act(async () => {
        await host1.whenIdle();
        await host2.whenIdle();
        renderer1.update(element1);
        renderer2.update(element2);
    });
    expect(renderer1!.toJSON()).toMatchSnapshot("[1] Value = 0");
    expect(renderer2!.toJSON()).toMatchSnapshot("[2] Value = 0");

    // Click increment button => Value = 1
    await act(async () => {
        renderer1.root.findByType("button").props.onClick();
        renderer2.root.findByType("button").props.onClick();
        await host1.whenIdle();
        await host2.whenIdle();
        renderer1.update(element1);
        renderer2.update(element2);
    });
    expect(renderer1!.toJSON()).toMatchSnapshot("[1] Value = 1");
    expect(renderer2!.toJSON()).toMatchSnapshot("[2] Value = 1");

    // Click increment button => Value = 2
    await act(async () => {
        renderer1.root.findByType("button").props.onClick();
        renderer2.root.findByType("button").props.onClick();
        await host1.whenIdle();
        await host2.whenIdle();
        renderer1.update(element1);
        renderer2.update(element2);
    });
    expect(renderer1!.toJSON()).toMatchSnapshot("[1] Value = 2");
    expect(renderer2!.toJSON()).toMatchSnapshot("[2] Value = 2");

    // Unmount and wait for observed script linger timeout
    jest.useFakeTimers();
    act(() => {
        renderer1!.unmount();
        renderer2!.unmount();
    });
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
