import path from 'path'

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

test('Comparing a table in the test repo to a snapshot', async () => {
  const tableData = getExperiments(await testRepoOptions)
  return expect(await tableData).toMatchSnapshot()
})
