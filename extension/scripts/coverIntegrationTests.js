const { resolve, join } = require('path')
const execa = require('execa')

const cwd = resolve(__dirname, '..')

const pipe = childProcess => {
  childProcess.stdout.pipe(process.stdout)
  childProcess.stderr.pipe(process.stderr)
}

const tsc = execa('tsc', ['-p', '.'], {
  cwd
})

pipe(tsc)
tsc.then(() => {
  const tests = execa('node', [join(cwd, 'dist', 'test', 'runTest.js')], {
    cwd
  })

  pipe(tests)
  tests
    .then(() => {})
    .catch(() => {
      process.exit(1)
    })
})
