import {
    extname,
} from "https://deno.land/std@0.206.0/path/mod.ts"
import { contentType } from "https://deno.land/std@0.206.0/media_types/content_type.ts"
import { transpile } from "./src/transpile.ts"

import {
    relative,
    join,
    normalize,
    fromFileUrl,
} from "https://deno.land/std@0.224.0/path/mod.ts"

const cwd = Deno.cwd()
const scriptDir = join(fromFileUrl(import.meta.url), "..")
console.log({cwd, scriptDir})
const relPath = normalize(relative(scriptDir, cwd))

const relImport = async (path: string) => {
    const adjustedPath = join(relPath, path).replaceAll("\\", "/")

    return await import("./" + adjustedPath)
}

const getFile = async (filepath: string) =>
    await Deno.open(
        filepath,
        { read: true }
    )
    .then(file => new Response(file.readable))
    .catch(e => new Response(e, { status: 404 }))

const handler =
(transformer: Record<
    string,
    (filepath: string, url: URL, req: Request) => Promise<Response>
>) =>
async (req: Request) => {
    const url = new URL(req.url)
    const filepath = "." + decodeURIComponent(url.pathname)
    console.log("Request:", filepath)

    const ext = extname(filepath).substring(1)

    let response
    if (ext in transformer) {
        response = await transformer[ext](filepath, url, req)
    } else {
        response = await getFile(filepath)
    }

    response.headers.get("content-type") ||
    response.headers.set(
        "content-type",
        contentType(extname(filepath))!,
    )
    return response
}

const handleTs =
async (filepath: string, url: URL) => {
    if (url.searchParams.get("ts") == "true") {
        const response = await getFile(filepath)
        response.headers.set(
            "content-type",
            "text/plain",
        )
        return response
    } else {
        const label = `Transpile "${filepath}"`
        console.time(label)
    
        const result = await transpile(filepath)

        console.timeEnd(label)

        return new Response(
            result,
            { headers: {
                "content-type": "application/javascript",
                "x-typescript-types": appendParam("ts", "true")(url).href,
            }}
        )
    }
}

const htmlPreset =
(body: string) => `<!doctype html><html>
    <head>
        <meta charset="UTF-8">
    </head>
    <body>
        ${body}
    </body>
</html>`

let cacheBuster = 0

Deno.serve(handler({
    ts: handleTs,
    async tsx(filepath, url, req) {
        const accept = req.headers.get("accept") || ""

        if (accept.includes("text/html")) {
            return new Response(
                htmlPreset(
                    (await relImport(
                        filepath + "#" + cacheBuster++
                    )).default
                ),
                { headers: {
                    "content-type": "text/html",
                }}
            )
        } else {
            return await handleTs(filepath, url)
        }
    }
}))

const appendParam =
    (name: string, value: string) =>
    (url: URL | string) => {
        url = new URL(url)
        url.searchParams.append(name, value)
        return url
    }