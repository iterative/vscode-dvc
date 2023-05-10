const { resolve, join } = require('path')
const { writeFileSync } = require('fs-extra')

const getExeca = async () => {
  const { execa } = await import('execa')
  return execa
}

let activationEvents = []
let failed

const cwd = resolve(__dirname, '..')
const packageJsonPath = join(cwd, 'package.json')

const pipe = childProcess => {
  childProcess.stdout.pipe(process.stdout)
  childProcess.stderr.pipe(process.stderr)
}

const packageJson = require(packageJsonPath)
activationEvents = packageJson.activationEvents
packageJson.activationEvents = ['onStartupFinished']
writeFileSync(packageJsonPath, JSON.stringify(packageJson))

getExeca().then(execa => {
  const tests = execa('node', [join(cwd, 'dist', 'test', 'runTest.js')], {
    cwd
  })

  pipe(tests)
  tests
    .then(() => {})
    .catch(() => {
      failed = true
    })
    .finally(() => {
      packageJson.activationEvents = activationEvents

      writeFileSync(packageJsonPath, JSON.stringify(packageJson))

      const prettier = execa('prettier', ['--write', 'package.json'], { cwd })
      pipe(prettier)
      prettier.then(() => {
        if (failed) {
          process.exit(1)
        }
      })
    })
})
