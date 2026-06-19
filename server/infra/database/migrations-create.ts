import { spawn } from 'node:child_process'
import { readdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const name = process.argv[2]

if (!name) {
  process.exit(1)
}

await new Promise<void>((resolvePromise, reject) => {
  const child = spawn(
    'bun',
    ['node_modules/.bin/knex', 'migrate:make', name],
    { stdio: 'inherit' }
  )

  child.on('exit', code => {
    if (code === 0) resolvePromise()
    else reject(new Error(`Knex exited with code ${code}`))
  })
})

const migrationsDir = resolve(process.cwd(),'server/infra/database/migrations')

const files = (await readdir(migrationsDir))
  .filter(f => f.endsWith('.ts'))
  .sort()

const imports = files.map(
  (file, i) =>
    `import * as m${i} from './migrations/${file.replace('.ts', '')}'`
)

const entries = files.map(
  (file, i) => `  {
    name: '${file.replace('.ts', '')}',
    module: m${i},
  }`
)

const content = `
${imports.join('\n')}

export const migrations = [
${entries.join(',\n')}
]
`.trim()

const outputPath = resolve(process.cwd(),'server/infra/database/migrations-registry.ts')

await writeFile(outputPath, content)
