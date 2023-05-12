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
import { codicons } from './codicons.mjs'

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

const allIcons = [
  ...customIcons,
  ...codicons.map(codicon => `${codiconsPath}/${codicon}.svg`)
]

function toPascalCase(text) {
  return text.replace(/(^\w|-\w)/g, clearAndUpper)
}

function clearAndUpper(text) {
  return text.replace(/-/, '').toUpperCase()
}

const components = []
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
      components.push(componentName)
    } catch (err) {
      console.error(err.message)
    }
  })
)

await appendFile(
  `${iconsPath}index.ts`,
  components
    .sort()
    .map(
      componentName =>
        `export { default as ${componentName} } from './${componentName}'\n`
    )
    .join('')
)

console.log(`Icons were generated to ${iconsPath}`)
