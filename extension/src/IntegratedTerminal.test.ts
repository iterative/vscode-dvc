import {
  IntegratedTerminal,
  runExperiment,
  initialize,
  add,
  checkout
} from './IntegratedTerminal'
import { resolve, relative } from 'path'

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

    const undef = await checkout('/test/dir')
    expect(undef).toBeUndefined()

    expect(terminalSpy).toBeCalledWith(`cd test/dir && dvc checkout`)
  })
})
