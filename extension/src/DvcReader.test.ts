import path from 'path'
import fs from 'fs'

import { getExperiments, inferDefaultOptions } from './DvcReader'

const extensionDirectory = path.resolve(__dirname, '..')
const testDvcDirectory = path.resolve(
  extensionDirectory,
  '..',
  'demo',
  'example-get-started'
)

const testRepoOptions = inferDefaultOptions(testDvcDirectory)

test('Inferring default options on a directory without .env', async () => {
  expect(await inferDefaultOptions(extensionDirectory)).toEqual({
    bin: 'dvc',
    cwd: extensionDirectory
  })
})

test('Inferring default options on the test directory alongside a basic check', async () => {
  const dotEnvDvcBinaryPath = path.resolve(
    testDvcDirectory,
    '.env',
    'bin',
    'dvc'
  )

  const ourInferredPath = (fs as any).statSync(dotEnvDvcBinaryPath, {
    throwIfNoEntry: false
  })
    ? dotEnvDvcBinaryPath
    : 'dvc'
  expect(await testRepoOptions).toEqual({
    bin: ourInferredPath,
    cwd: testDvcDirectory
  })
})

test('Comparing a table in the test repo to a snapshot', async () => {
  const tableData = getExperiments(await testRepoOptions)
  return expect(await tableData).toMatchSnapshot()
})
