import { resolve, join } from 'path'
import { mocked } from 'ts-jest/utils'

import { inferDefaultOptions, getExperiments } from './dvcReader'
import fs from 'fs'
import { execPromise } from './util'
import complexExperimentsOutput from './webviews/experiments/complex-output-example.json'
import { PromiseWithChild } from 'child_process'
import * as DvcPath from './DvcPath'

jest.mock('fs')
jest.mock('./util')

const mockedFs = mocked(fs)
const mockedExecPromise = mocked(execPromise)

const extensionDirectory = resolve(__dirname, '..')

const testReaderOptions = {
  bin: 'dvc',
  cwd: resolve()
}

beforeEach(() => {
  jest.resetAllMocks()
})

test('Inferring default options on a directory with accessible .env', async () => {
  mockedFs.accessSync.mockReturnValue()
  jest
    .spyOn(DvcPath, 'getDvcPath')
    .mockReturnValueOnce(join('.env', 'bin', 'dvc'))

  expect(await inferDefaultOptions(extensionDirectory)).toEqual({
    bin: join(extensionDirectory, '.env', 'bin', 'dvc'),
    cwd: extensionDirectory
  })
})

test('Inferring default options on a directory without .env', async () => {
  jest
    .spyOn(DvcPath, 'getDvcPath')
    .mockReturnValueOnce(join('not', 'a', 'path'))

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
    Promise.resolve({
      stdout: JSON.stringify(complexExperimentsOutput),
      stderr: ''
    }) as PromiseWithChild<{ stdout: string; stderr: string }>
  )

  const { experiments, outputHash } = await getExperiments(testReaderOptions)
  expect(experiments).toMatchSnapshot()
  expect(outputHash).toEqual('q8bw/2qL0rYstYzbwwCZK1RgRGo=')
})
