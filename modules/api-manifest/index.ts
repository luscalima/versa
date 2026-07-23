import { readdir } from 'node:fs/promises'
import { defineNuxtModule, addTemplate, addTypeTemplate } from 'nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'api-manifest',
  },
  async setup(_, nuxt) {
    const entries = await readdir('./server/api', {
      recursive: true,
      withFileTypes: true,
    })
    const files = entries
      .filter(entry => entry.isFile())
      .map<[string, string]>(entry => [entry.parentPath.replace(/^.*server/, ''), entry.name])
      .reduce(
        (acc, [path, name]) => {
          const method = name
            ?.match(/\.([a-z]+)\.ts$/)
            ?.at(1)
            ?.toUpperCase()

          if (!method) return acc

          if (acc[path]) {
            acc[path].push(method)
          } else {
            acc[path] = [method]
          }

          return acc
        },
        {} as Record<string, string[]>,
      )

    const template = addTemplate({
      filename: 'api-manifest.mjs',
      getContents: () => `export default ${JSON.stringify(files, null, 2)}`,
      write: true,
    })

    addTypeTemplate({
      filename: 'api-manifest.d.ts',
      getContents: () => `
        declare module '#api-manifest' {
          interface ApiManifest {
            [key: string]: HTTPMethod[]
          }
          const apiManifest: ApiManifest
          export default apiManifest
        }
      `,
      write: true,
    })

    nuxt.options.alias['#api-manifest'] = template.dst
  },
})
