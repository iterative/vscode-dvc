import path from 'path'
import { mocked } from 'ts-jest/utils'

import { inferDefaultOptions, getExperiments } from './DvcReader'
import fs from 'fs'
import { execPromise } from './util'
import complexExperimentsOutput from 'dvc-vscode-webview/src/stories/complex-experiments-output.json'
import { PromiseWithChild } from 'child_process'

jest.mock('fs')
jest.mock('./util')

const mockedFs = mocked(fs)
const mockedExecPromise = mocked(execPromise)

const extensionDirectory = path.resolve(__dirname, '..')

const testReaderOptions = {
  bin: 'dvc',
  cwd: path.resolve()
}

beforeEach(() => {
  jest.resetAllMocks()
})

test('Inferring default options on a directory with accessible .env', async () => {
  mockedFs.accessSync.mockReturnValue()

  expect(await inferDefaultOptions(extensionDirectory)).toEqual({
    bin: path.join(extensionDirectory, '.env', 'bin', 'dvc'),
    cwd: extensionDirectory
  })
})

test('Inferring default options on a directory without .env', async () => {
  mockedFs.accessSync.mockImplementation(() => {
    throw new Error('Mocked access fail')
  })

  expect(await inferDefaultOptions(extensionDirectory)).toEqual({
    bin: 'dvc',
    cwd: extensionDirectory
  })
})

test('Command-mocked getExperiments matches a snapshot when parsed', async () => {
  mockedExecPromise.mockReturnValue(
    (Promise.resolve({
      stdout: JSON.stringify(complexExperimentsOutput),
      stderr: ''
    }) as any) as PromiseWithChild<{ stdout: string; stderr: string }>
  )

  expect(await getExperiments(testReaderOptions)).toMatchSnapshot()
})
