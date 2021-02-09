import path from 'path'

import { inferDefaultOptions, getExperiments } from './DvcReader'
import fs from 'fs'
import { execPromise } from './util'
import complexExperimentsOutput from 'dvc-vscode-webview/src/stories/complex-experiments-output.json'

jest.mock('fs')
jest.mock('./util')

const mockedFs: any = fs
const mockedExecPromise: any = execPromise

const extensionDirectory = path.resolve(__dirname, '..')

test('Inferring default options on a directory with accessible .env', async () => {
  ;(fs.accessSync as any).mockImplementationOnce(() => true)

  expect(await inferDefaultOptions(extensionDirectory)).toEqual({
    bin: path.join(extensionDirectory, '.env', 'bin', 'dvc'),
    cwd: extensionDirectory
  })
})

test('Inferring default options on a directory without .env', async () => {
  mockedFs.accessSync.mockImplementationOnce(() => {
    const e = new Error('Mocked access fail')
    throw e
  })

  expect(await inferDefaultOptions(extensionDirectory)).toEqual({
    bin: 'dvc',
    cwd: extensionDirectory
  })
})

test('Command-mocked getExperiments matches a snapshot when parsed', async () => {
  mockedExecPromise.mockImplementationOnce(async () => ({
    stdout: JSON.stringify(complexExperimentsOutput)
  }))

  expect(
    await getExperiments({
      bin: 'dvc',
      cwd: path.resolve()
    })
  ).toMatchSnapshot()
})
