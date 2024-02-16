import { transpile as emit } from "https://deno.land/x/emit@0.31.2/mod.ts"
import { fromFileUrl } from "https://deno.land/std@0.208.0/path/windows/from_file_url.ts"

export const transpile =
(target: URL) =>
    emit(target, {
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