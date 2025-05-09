import {
    extname,
} from "https://deno.land/std@0.206.0/path/mod.ts"
import { contentType } from "https://deno.land/std@0.206.0/media_types/content_type.ts"
import { transpile } from "./src/transpile.ts"

const getFile = async (filepath: string) =>
    await Deno.open(
        filepath,
        { read: true }
    )
    .then(file => new Response(file.readable))
    .catch(e => new Response(e, { status: 404 }))

export interface HandlerInfo {
    req: Request
    filepath: string
    url: URL
    ext: string
}

export type Handler =
(info: HandlerInfo) =>
    Promise<Response | false>

const resolveHandlers =
(handlers: Handler[]) =>
async (req: Request) => {
    const url = new URL(req.url)
    const filepath = "." + decodeURIComponent(url.pathname)
    console.log("Request:", filepath)

    const ext = extname(filepath).substring(1)

    const ress = await Promise.all(handlers.map(handler => handler({
        ext, filepath, url, req
    })))
    const response = ress.find(x => x) || await getFile(filepath)

    response.headers.get("content-type") ||
    response.headers.set(
        "content-type",
        contentType(extname(filepath))!,
    )
    return response
}

export type Transpiler = (filePath: string) => Promise<string | Response | undefined>

export const handleTsLike =
(
    extMatch: string,
    toJs: Transpiler,
    toTs: Transpiler = getFile,
): Handler =>
async ({ filepath, url, ext }) => {
    if (ext != extMatch) return false
    if (url.searchParams.get("ts") == "true") {
        const out = await toTs(filepath) || "Err!"
        const response = typeof out == "string"
            ? new Response(out)
            : out
        response.headers.set(
            "content-type",
            "text/plain",
        )
        return response
    } else {
        const label = `Transpile "${filepath}"`
        console.time(label)

        const out = await toJs(filepath) || "Err!"

        console.timeEnd(label)
        
        const response = typeof out == "string"
            ? new Response(out)
            : out
            
        response.headers.set(
            "content-type",
            "application/javascript",
        )
        response.headers.set(
            "x-typescript-types",
            appendParam("ts", "true")(url).href,
        )

        return response
    }
}

const handleTs = handleTsLike("ts", transpile)

export class Tserve {
    handlers

    constructor(handlers: Handler[] = []) {
        this.handlers = [...handlers, handleTs]
    }
    serve() {
        Deno.serve(resolveHandlers(this.handlers))
    }
}

const appendParam =
    (name: string, value: string) =>
    (url: URL | string) => {
        url = new URL(url)
        url.searchParams.append(name, value)
        return url
    }
