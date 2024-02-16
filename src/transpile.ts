import { transpile as emit } from "https://deno.land/x/emit@0.31.2/mod.ts"
import { toFileUrl } from "https://deno.land/std@0.206.0/path/mod.ts"
import { fromFileUrl } from "https://deno.land/std@0.208.0/path/windows/mod.ts"

export const transpile =
async (filepath: string) => {
    const target = new URL(filepath, toFileUrl(Deno.cwd()).href + "/")

    const result = await emit(target, {
        load: async (specifier) => {
            if (target.href == specifier) {
                return {
                    kind: "module",
                    specifier,
                    content: await Deno.readTextFile(fromFileUrl(specifier)),
                }
            } else {
                return {
                    kind: "external",
                    specifier,
                }
            }
        }
    })

    return result.get(target.href)
}