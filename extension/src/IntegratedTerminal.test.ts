import { IntegratedTerminal, runExperiment } from './IntegratedTerminal'
import * as DvcPath from './DvcPath'

describe('runExperiment', () => {
  it('should run the correct command in the IntegratedTerminal', async () => {
    const pathSpy = jest.spyOn(DvcPath, 'getDvcPath').mockReturnValueOnce('dvc')
    const terminalSpy = jest
      .spyOn(IntegratedTerminal, 'run')
      .mockResolvedValueOnce(undefined)

    const undef = await runExperiment()
    expect(undef).toBeUndefined()

    expect(terminalSpy).toBeCalledWith('dvc exp run')
    expect(pathSpy).toBeCalledTimes(1)
  })
})
