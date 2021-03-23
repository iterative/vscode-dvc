import { mocked } from 'ts-jest/utils'

import { getExperiments, getRoot } from './reader'
import { execPromise } from '../util'
import complexExperimentsOutput from '../webviews/experiments/complex-output-example.json'
import { PromiseWithChild } from 'child_process'
import { join, resolve } from 'path'

jest.mock('fs')
jest.mock('../util')

const mockedExecPromise = mocked(execPromise)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('getExperiments', () => {
  it('should match a snapshot when parsed', async () => {
    const cwd = resolve()
    mockedExecPromise.mockReturnValue(
      Promise.resolve({
        stdout: JSON.stringify(complexExperimentsOutput),
        stderr: ''
      }) as PromiseWithChild<{ stdout: string; stderr: string }>
    )

    const experiments = await getExperiments({
      cliPath: 'dvc',
      cwd
    })
    expect(experiments).toMatchSnapshot()
    expect(mockedExecPromise).toBeCalledWith('dvc exp show --show-json', {
      cwd
    })
  })
})

describe('getRoot', () => {
  it('should return the root relative to the cwd', async () => {
    const mockRelativeRoot = join('..', '..')
    const mockStdout = mockRelativeRoot + '\n\r'
    const cwd = resolve()
    mockedExecPromise.mockReturnValue(
      Promise.resolve({
        stdout: mockStdout,
        stderr: ''
      }) as PromiseWithChild<{ stdout: string; stderr: string }>
    )

    const relativeRoot = await getRoot({
      cwd,
      cliPath: 'dvc'
    })
    expect(relativeRoot).toEqual(mockRelativeRoot)
    expect(mockedExecPromise).toBeCalledWith('dvc root', {
      cwd
    })
  })
})
