import {
    extname,
    toFileUrl,
} from "https://deno.land/std@0.206.0/path/mod.ts"
import { contentType } from "https://deno.land/std@0.206.0/media_types/content_type.ts"
import { transpile } from "https://deno.land/x/emit@0.31.2/mod.ts"

const handler =
(transformer: Record<
    string,
    (url: string) => Promise<Response>
>) =>
async (req: Request) => {
    const url = new URL(req.url)
    const filepath = "." + decodeURIComponent(url.pathname)
    console.log(filepath)

    const ext = extname(filepath).substring(1)

    let response
    if (ext in transformer) {
        response = await transformer[ext](filepath)
    } else {
        let file
        try {
            file = await Deno.open(
                filepath,
                { read: true }
            )
        } catch(e) {
            return new Response(e, { status: 404 })
        }
        response = new Response(file.readable)
    }

    response.headers.get("content-type") ||
    response.headers.set(
        "content-type",
        contentType(extname(filepath))!,
    )
    return response
}

Deno.serve(handler({
    async ts(path) {
        const target = new URL(path, toFileUrl(Deno.cwd()).href + "/")
        const result = await transpile(target)
        return new Response(
            result.get(target.href),
            { headers: {
                "content-type": "application/javascript",
                "x-typescript-types": path,
                        "access-control-allow-origin": "*",
            }}
        )
    }
}))