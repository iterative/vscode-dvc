import { mocked } from 'ts-jest/utils'

import { getExperiments } from './dvcReader'
import { execPromise } from './util'
import complexExperimentsOutput from './webviews/experiments/complex-output-example.json'
import { PromiseWithChild } from 'child_process'
import { resolve } from 'path'

jest.mock('fs')
jest.mock('./util')

const mockedExecPromise = mocked(execPromise)

beforeEach(() => {
  jest.resetAllMocks()
})

test('Command-mocked getExperiments matches a snapshot when parsed', async () => {
  mockedExecPromise.mockReturnValue(
    Promise.resolve({
      stdout: JSON.stringify(complexExperimentsOutput),
      stderr: ''
    }) as PromiseWithChild<{ stdout: string; stderr: string }>
  )

  const experiments = await getExperiments({
    bin: 'dvc',
    cwd: resolve()
  })
  expect(experiments).toMatchSnapshot()
})
