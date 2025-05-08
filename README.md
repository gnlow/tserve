# tserve
file_server + deno_emit

## Simple Usage
```sh
deno run -A https://deno.land/x/tserve/serve.ts
```

## Custom Handler
```ts
import {
    Tserve,
    Handler,
    handleTsLike,
} from "https://deno.land/x/tserve/mod.ts"

const myHandler1: Handler =
async ({
    req: Request
    filepath: string
    url: URL
    ext: string
}) => {
    // ...
    return "Your output text"
}

const myHandler2 = handleTsLike(
    "ts",
    async filepath => "Transpiled JS Code",
    async filepath => "Source TS Code",
)

new Tserve([
    myHandler,
    myHandler2,
]).serve()
```
