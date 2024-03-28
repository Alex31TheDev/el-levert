import ivm from "isolated-vm";

import FakeMsg from "../classes/FakeMsg.js";
import VMFunction from "../../../structures/vm/VMFunction.js";

import IsolateInspector from "../inspector/IsolateInspector.js";

import Functions from "./Functions.js";
import globalNames from "./globalNames.json" assert { type: "json" };
import funcNames from "./funcNames.json" assert { type: "json" };

const filename = "script.js";

class EvalContext {
    constructor(options, inspectorOptions = {}) {
        this.memLimit = options.memLimit;
        this.timeLimit = options.timeLimit;

        this.setupInspector(inspectorOptions);
    }

    setupInspector(options) {
        const enableInspector = options.enable ?? false;

        this.inspector = new IsolateInspector(enableInspector, options);
        this.enableInspector = enableInspector;
    }

    async setMsg(msg) {
        const vmMsg = new ivm.ExternalCopy(msg.fixedMsg).copyInto();

        await this.global.set(globalNames.msg, vmMsg);
    }

    async setArgs(args) {
        if (typeof args === "undefined") {
            return;
        }

        args = args.length > 0 ? args : undefined;

        const vmTag = new ivm.ExternalCopy({
            args: args
        }).copyInto();

        await this.global.set(globalNames.tag, vmTag);
    }

    registerFunc(func) {
        const code = func.getRegisterCode();

        return this.context.evalClosure(code, [func.ref], {
            arguments: {
                reference: true
            }
        });
    }

    async registerFuncs(objMap) {
        let funcs = [];

        for (const [objKey, funcMap] of Object.entries(objMap)) {
            const objName = globalNames[objKey],
                names = funcNames[objKey];

            for (let [funcKey, funcProperties] of Object.entries(funcMap)) {
                funcProperties = {
                    ...funcProperties,
                    parent: objName,
                    name: names[funcKey]
                };

                const func = new VMFunction(funcProperties, this.propertyMap);
                funcs.push(func);
            }
        }

        for (const func of funcs) {
            await this.registerFunc(func);
        }

        this.funcs = funcs;
    }

    async setupContext(msg, args) {
        this.context = await this.isolate.createContext({
            inspector: this.enableInspector
        });

        const global = this.context.global;
        await global.set("global", global.derefInto());
        this.global = global;

        msg = new FakeMsg(msg);

        await this.setMsg(msg);
        await this.setArgs(args);

        this.propertyMap = {
            msg
        };

        await this.registerFuncs(Functions);
    }

    async setupIsolate(msg, args) {
        this.isolate = new ivm.Isolate({
            memoryLimit: this.memLimit,
            inspector: this.enableInspector
        });

        await this.setupContext(msg, args);

        this.inspector.create(this.isolate);
    }

    disposeIsolate() {
        this.script.release();
        this.context.release();

        this.inspector.dispose();

        if (!this.isolate.isDisposed) {
            this.isolate.dispose();
        }

        delete this.script;
        delete this.context;
        delete this.isolate;
    }

    async compileScript(code) {
        this.script = await this.isolate.compileScript(code, {
            filename: `file:///${filename}`
        });
    }

    async runScript(code) {
        if (typeof code !== "undefined") {
            this.compileScript(code);
        }

        await this.inspector.waitForConnection();

        const res = await this.script.run(this.context, {
            timeout: this.timeLimit * 1000
        });

        return res;
    }

    async getIsolate(options) {
        const { msg, args } = options;

        await this.setupIsolate(msg, args);
        return this.isolate;
    }
}

export default EvalContext;
