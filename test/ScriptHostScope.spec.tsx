import React from "react";
import renderer from "react-test-renderer";
import { ScriptHostScope } from "../src";

describe("ScriptHostScope", () => {
    it("can render without props", () => {
        const component = renderer.create(<ScriptHostScope/>);
        const tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    });
});