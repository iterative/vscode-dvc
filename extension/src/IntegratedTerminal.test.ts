import { IntegratedTerminal, runExperiment } from './IntegratedTerminal'

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
