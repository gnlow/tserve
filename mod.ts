import { extname } from "https://deno.land/std@0.206.0/path/extname.ts"
import { contentType } from "https://deno.land/std@0.206.0/media_types/content_type.ts"

const handler = async (req: Request) => {
    const url = new URL(req.url)
    const filepath = decodeURIComponent(url.pathname)

    let file
    try {
        file = await Deno.open(
            "." + filepath,
            { read: true }
        )
    } catch(e) {
        return new Response(e, { status: 404 })
    }

    console.log(contentType(extname(filepath)))
    return new Response(
        file.readable,
        { headers: 
            {
                "content-type": contentType(extname(filepath))!,
            }
        }
    )
}

Deno.serve(handler)