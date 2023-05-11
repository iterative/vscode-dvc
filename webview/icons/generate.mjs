import { transform } from '@svgr/core'
import {
  appendFile,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile
} from 'node:fs/promises'
import path from 'path'

const iconsPath = 'src/shared/components/icons/'

try {
  await rm(iconsPath, { recursive: true, force: true })
  await mkdir(iconsPath)
} catch (err) {
  console.error(err.message)
}

const customIcons = []
try {
  const files = await readdir('icons')
  for (const file of files) {
    if (path.extname(file) === '.svg') {
      customIcons.push(`icons/${file}`)
    }
  }
} catch (err) {
  console.error(err.message)
}

const codiconsPath = '../node_modules/@vscode/codicons/src/icons'
const codicons = [
  'add',
  'arrow-up',
  'arrow-down',
  'beaker',
  'check',
  'chevron-down',
  'chevron-right',
  'close',
  'copy',
  'ellipsis',
  'error',
  'filter',
  'git-commit',
  'git-merge',
  'graph-line',
  'graph-scatter',
  'gripper',
  'info',
  'list-filter',
  'pass-filled',
  'pinned',
  'refresh',
  'sort-precedence',
  'star-empty',
  'star-full',
  'trash'
]

const allIcons = [
  ...customIcons,
  ...codicons.map(codicon => `${codiconsPath}/${codicon}.svg`)
]

const toPascalCase = string =>
  `${string}`
    .toLowerCase()
    .replace(new RegExp(/[-_]+/, 'g'), ' ')
    .replace(new RegExp(/[^\w\s]/, 'g'), '')
    .replace(
      new RegExp(/\s+(.)(\w*)/, 'g'),
      ($1, $2, $3) => `${$2.toUpperCase() + $3}`
    )
    .replace(new RegExp(/\w/), s => s.toUpperCase())

await Promise.all(
  allIcons.map(async icon => {
    try {
      const iconContent = await readFile(icon, { encoding: 'utf8' })
      const componentName = toPascalCase(path.basename(icon).split('.')[0])
      const svgComponent = await transform(
        iconContent,
        {
          typescript: true,
          plugins: ['@svgr/plugin-jsx', '@svgr/plugin-prettier']
        },
        { componentName }
      )
      await writeFile(`${iconsPath}${componentName}.tsx`, svgComponent)
      await appendFile(
        `${iconsPath}index.ts`,
        `export { default as ${componentName} } from './${componentName}'\n`
      )
    } catch (err) {
      console.error(err.message)
    }
  })
)

console.log(`Icons were generated to ${iconsPath}`)
