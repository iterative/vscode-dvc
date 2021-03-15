import {
  IntegratedTerminal,
  runExperiment,
  checkout
} from './IntegratedTerminal'
import { resolve } from 'path'

beforeEach(() => {
  jest.resetAllMocks()
})

describe('runExperiment', () => {
  it('should run the correct command in the IntegratedTerminal', async () => {
    const terminalSpy = jest
      .spyOn(IntegratedTerminal, 'run')
      .mockResolvedValueOnce(undefined)

    const undef = await runExperiment()

    expect(undef).toBeUndefined()
    expect(terminalSpy).toBeCalledWith('dvc exp run')
  })
})

describe('checkout', () => {
  it('should run the correct command in the IntegratedTerminal', async () => {
    const terminalSpy = jest
      .spyOn(IntegratedTerminal, 'run')
      .mockResolvedValueOnce(undefined)

    const mockPath = resolve('test', 'dir')
    const undef = await checkout(mockPath)

    expect(undef).toBeUndefined()
    expect(terminalSpy).toBeCalledWith(`cd ${mockPath} && dvc checkout`)
  })
})
