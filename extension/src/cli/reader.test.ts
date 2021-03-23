import { mocked } from 'ts-jest/utils'
import {
  getExperiments,
  checkout,
  initializeDirectory,
  checkoutRecursive
} from './reader'
import { execPromise } from '../util'
import complexExperimentsOutput from '../webviews/experiments/complex-output-example.json'
import { PromiseWithChild } from 'child_process'
import { resolve } from 'path'

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

describe('initializeDirectory', () => {
  it('should call execPromise with the correct parameters', async () => {
    const fsPath = __dirname
    const stdout = `
	Initialized DVC repository.
	You can now commit the changes to git.
	
	+---------------------------------------------------------------------+
	|                                                                     |
	|        DVC has enabled anonymous aggregate usage analytics.         |
	|     Read the analytics documentation (and how to opt-out) here:     |
	|             <https://dvc.org/doc/user-guide/analytics>              |
	|                                                                     |
	+---------------------------------------------------------------------+
	
	What's next?
	------------
	- Check out the documentation: <https://dvc.org/doc>
	- Get help and share ideas: <https://dvc.org/chat>
	- Star us on GitHub: <https://github.com/iterative/dvc>
	`

    mockedExecPromise.mockReturnValue(
      Promise.resolve({
        stdout,
        stderr: ''
      }) as PromiseWithChild<{ stdout: string; stderr: string }>
    )

    const output = await initializeDirectory({
      cliPath: 'dvc',
      cwd: fsPath
    })
    expect(output).toEqual(stdout)

    expect(mockedExecPromise).toBeCalledWith('dvc init --subdir', {
      cwd: fsPath
    })
  })
})
describe('checkout', () => {
  it('should call execPromise with the correct parameters', async () => {
    const fsPath = __dirname
    const stdout = `M       model.pt\n\rM       logs/\n\r`
    mockedExecPromise.mockReturnValue(
      Promise.resolve({
        stdout,
        stderr: ''
      }) as PromiseWithChild<{ stdout: string; stderr: string }>
    )

    const output = await checkout({
      cliPath: 'dvc',
      cwd: fsPath
    })
    expect(output).toEqual(stdout)

    expect(mockedExecPromise).toBeCalledWith('dvc checkout', {
      cwd: fsPath
    })
  })
})

describe('checkoutRecursive', () => {
  it('should call execPromise with the correct parameters', async () => {
    const fsPath = __dirname
    const stdout = `M       model.pt\n\rM       logs/\n\r`
    mockedExecPromise.mockReturnValue(
      Promise.resolve({
        stdout,
        stderr: ''
      }) as PromiseWithChild<{ stdout: string; stderr: string }>
    )

    const output = await checkoutRecursive({
      cliPath: 'dvc',
      cwd: fsPath
    })
    expect(output).toEqual(stdout)

    expect(mockedExecPromise).toBeCalledWith('dvc checkout --recursive', {
      cwd: fsPath
    })
  })
})
