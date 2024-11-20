import { transpile as emit } from "jsr:@deno/emit@0.46.0"
import { toFileUrl, fromFileUrl } from "https://deno.land/std@0.206.0/path/mod.ts"

export const transpile =
async (filepath: string) => {
    const target = new URL(filepath, toFileUrl(Deno.cwd()).href + "/")

    const options =
        await Deno.readTextFile("deno.json")
            .then(x => JSON.parse(x))
            .catch(_ => ({}))

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
        },
        compilerOptions: 
            options.compilerOptions,
    })

    return result.get(target.href)
}