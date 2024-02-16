import { walk } from "https://deno.land/std@0.215.0/fs/walk.ts"

for await (const entry of walk(".", { exts: ["ts"] })) {
    const src = await Deno.readTextFile(entry.path)
    console.log(src)
}