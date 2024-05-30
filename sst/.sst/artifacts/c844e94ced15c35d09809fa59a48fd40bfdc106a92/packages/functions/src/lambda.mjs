import { createRequire as topLevelCreateRequire } from 'module';
const require = topLevelCreateRequire(import.meta.url);
import { fileURLToPath as topLevelFileUrlToPath, URL as topLevelURL } from "url"
const __dirname = topLevelFileUrlToPath(new topLevelURL(".", import.meta.url))

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/sst/context/context2.js
import { AsyncLocalStorage } from "async_hooks";
var ContextNotFoundError = class extends Error {
  static {
    __name(this, "ContextNotFoundError");
  }
  name;
  constructor(name) {
    super(`${name} context was not provided. It is possible you have multiple versions of SST installed.`);
    this.name = name;
  }
};
var count = 0;
function create(name) {
  const storage = new AsyncLocalStorage();
  const children = [];
  function reset() {
    for (const child of children) {
      child();
    }
  }
  __name(reset, "reset");
  const ctx = {
    name,
    with(value, cb) {
      const version = (++count).toString();
      return storage.run({ value, version }, () => {
        return runWithCleanup(cb, () => reset());
      });
    },
    use() {
      const memo2 = ContextMemo.getStore();
      if (memo2) {
        memo2.deps.push(ctx);
        children.push(memo2.reset);
      }
      const result = storage.getStore();
      if (result === void 0)
        throw new ContextNotFoundError(name);
      return result.value;
    },
    version() {
      const result = storage.getStore();
      if (result === void 0)
        throw new ContextNotFoundError(name);
      return result.version;
    }
  };
  return ctx;
}
__name(create, "create");
var ContextMemo = new AsyncLocalStorage();
function memo(cb) {
  const deps = [];
  const cache = /* @__PURE__ */ new Map();
  const children = [];
  let tracked = false;
  function key() {
    return deps.map((dep) => dep.version()).join(",");
  }
  __name(key, "key");
  function reset() {
    cache.delete(key());
    for (const child of children) {
      child();
    }
  }
  __name(reset, "reset");
  function save(value) {
    cache.set(key(), value);
  }
  __name(save, "save");
  return () => {
    const child = ContextMemo.getStore();
    if (child) {
      child.deps.push({ version: () => key() });
      children.push(child.reset);
    }
    if (!tracked) {
      return ContextMemo.run({ deps, reset }, () => {
        return runWithCleanup(cb, (result2) => {
          tracked = true;
          save(result2);
        });
      });
    }
    const cached = cache.get(key());
    if (cached) {
      return cached;
    }
    const result = cb();
    save(result);
    return result;
  };
}
__name(memo, "memo");
function runWithCleanup(cb, cleanup) {
  const result = cb();
  if (result && typeof result === "object" && "then" in result && typeof result.then === "function") {
    return result.then((value) => {
      cleanup(result);
      return value;
    });
  }
  cleanup(result);
  return result;
}
__name(runWithCleanup, "runWithCleanup");

// node_modules/sst/context/handler.js
var RequestContext = create("RequestContext");
function useEvent(type) {
  const ctx = RequestContext.use();
  if (ctx.type !== type)
    throw new Error(`Expected ${type} event`);
  return ctx.event;
}
__name(useEvent, "useEvent");
function Handler(type, cb) {
  return /* @__PURE__ */ __name(function handler2(event, context) {
    return RequestContext.with({ type, event, context }, () => cb(event, context));
  }, "handler");
}
__name(Handler, "Handler");

// node_modules/sst/node/api/index.js
var Response = class {
  static {
    __name(this, "Response");
  }
  result;
  constructor(result) {
    this.result = result;
  }
};
function ApiHandler(cb) {
  return Handler("api", async (evt, ctx) => {
    let result;
    try {
      result = await cb(evt, ctx);
    } catch (e) {
      if (e instanceof Response) {
        result = e.result;
      } else
        throw e;
    }
    const serialized = useResponse().serialize(result || {});
    return serialized;
  });
}
__name(ApiHandler, "ApiHandler");
var useResponse = /* @__PURE__ */ memo(() => {
  useEvent("api");
  const response = {
    headers: {},
    cookies: []
  };
  const result = {
    cookies(values, options) {
      for (const [key, value] of Object.entries(values)) {
        result.cookie({
          key,
          value,
          ...options
        });
      }
      return result;
    },
    cookie(input) {
      input = {
        secure: true,
        sameSite: "None",
        httpOnly: true,
        ...input
      };
      const value = encodeURIComponent(input.value);
      const parts = [input.key + "=" + value];
      if (input.domain)
        parts.push("Domain=" + input.domain);
      if (input.path)
        parts.push("Path=" + input.path);
      if (input.expires)
        parts.push("Expires=" + input.expires.toUTCString());
      if (input.maxAge)
        parts.push("Max-Age=" + input.maxAge);
      if (input.httpOnly)
        parts.push("HttpOnly");
      if (input.secure)
        parts.push("Secure");
      if (input.sameSite)
        parts.push("SameSite=" + input.sameSite);
      response.cookies.push(parts.join("; "));
      return result;
    },
    status(code) {
      response.statusCode = code;
      return result;
    },
    header(key, value) {
      response.headers[key] = value;
      return result;
    },
    serialize(input) {
      return {
        ...response,
        ...input,
        cookies: [...input.cookies || [], ...response.cookies],
        headers: {
          ...response.headers,
          ...input.headers
        }
      };
    }
  };
  return result;
});

// packages/functions/src/lambda.ts
var handler = ApiHandler(async (_evt) => {
  return {
    statusCode: 200,
    body: `Hello world. The time is ${(/* @__PURE__ */ new Date()).toISOString()}`
  };
});
export {
  handler
};
//# sourceMappingURL=lambda.mjs.map
