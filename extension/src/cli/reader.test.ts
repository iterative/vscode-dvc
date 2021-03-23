import { mocked } from 'ts-jest/utils'
import { IntegratedTerminal } from '../IntegratedTerminal'
import {
  getExperiments,
  add,
  checkout,
  initializeDirectory,
  checkoutRecursive
} from './reader'
import { execPromise } from '../util'
import complexExperimentsOutput from '../webviews/experiments/complex-output-example.json'
import { PromiseWithChild } from 'child_process'
import { resolve, relative } from 'path'

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
  it('should run the correct command in the IntegratedTerminal', async () => {
    const terminalSpy = jest
      .spyOn(IntegratedTerminal, 'run')
      .mockResolvedValueOnce(undefined)

    const undef = await initializeDirectory('./test/dir')
    expect(undef).toBeUndefined()

    expect(terminalSpy).toBeCalledWith('cd ./test/dir && dvc init --subdir ')
  })
})

describe('add', () => {
  it('should run the correct command in the IntegratedTerminal', async () => {
    const terminalSpy = jest
      .spyOn(IntegratedTerminal, 'run')
      .mockResolvedValueOnce(undefined)

    const path = resolve(__dirname, '..', 'fileSystem.js')
    const relPath = relative(resolve(__dirname, '..', '..'), path)
    const undef = await add(path)
    expect(undef).toBeUndefined()

    expect(terminalSpy).toBeCalledWith(`dvc add ${relPath}`)
  })
})

describe('checkout', () => {
  it('should run the correct command in the IntegratedTerminal', async () => {
    const terminalSpy = jest
      .spyOn(IntegratedTerminal, 'run')
      .mockResolvedValueOnce(undefined)

    const undef = await checkout('../test/dir')
    expect(undef).toBeUndefined()

    expect(terminalSpy).toBeCalledWith(`dvc checkout ../test/dir`)
  })
})

describe('checkout recursive', () => {
  it('should run the correct command in the IntegratedTerminal', async () => {
    const terminalSpy = jest
      .spyOn(IntegratedTerminal, 'run')
      .mockResolvedValueOnce(undefined)

    const undef = await checkoutRecursive('../test/dir')
    expect(undef).toBeUndefined()

    expect(terminalSpy).toBeCalledWith(`dvc checkout --recursive ../test/dir`)
  })
})
