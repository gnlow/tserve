import { walk } from "https://deno.land/std@0.215.0/fs/walk.ts"
import { transpile } from "./src/transpile.ts"

for await (const entry of walk(".", { exts: [".ts"] })) {
    const result = await transpile(entry.path)

    await Deno.writeTextFile(entry.path, result || "")
}