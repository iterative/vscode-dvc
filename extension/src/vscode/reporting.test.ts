import { mocked } from 'ts-jest/utils'
import { window } from 'vscode'
import { report } from './reporting'

jest.mock('vscode')

const mockedShowErrorMessage = mocked(window.showErrorMessage)
const mockedShowInformationMessage = mocked(window.showInformationMessage)

beforeEach(() => {
  jest.resetAllMocks()
})

const defaultPath = '/home/user/project'
const exampleExpName = 'exp-2021'

describe('report', () => {
  it('reports the output of the given command', async () => {
    const mockedExperimentApply = jest.fn()
    const mockedStdOut = 'I applied your experiment boss'
    mockedExperimentApply.mockResolvedValueOnce(mockedStdOut)

    await report(mockedExperimentApply(defaultPath, exampleExpName))

    expect(mockedExperimentApply).toBeCalledWith(defaultPath, exampleExpName)

    expect(mockedShowInformationMessage).toBeCalledTimes(1)
    expect(mockedShowInformationMessage).toBeCalledWith(mockedStdOut)
  })

  it('reports operation successful when no output is returned for the given command', async () => {
    const mockedExperimentApply = jest.fn()
    const mockedStdOut = ''
    mockedExperimentApply.mockResolvedValueOnce(mockedStdOut)

    await report(mockedExperimentApply(defaultPath, exampleExpName))

    expect(mockedExperimentApply).toBeCalledWith(defaultPath, exampleExpName)

    expect(mockedShowInformationMessage).toBeCalledTimes(1)
    expect(mockedShowInformationMessage).toBeCalledWith('Operation successful.')
  })

  it('reports the error when execute process throws with stderr', async () => {
    const mockedExperimentApply = jest.fn()
    mockedExperimentApply.mockRejectedValueOnce({
      stderr: 'something went very wrong'
    })

    await report(mockedExperimentApply(defaultPath, exampleExpName))

    expect(mockedShowErrorMessage).toBeCalledTimes(1)
  })
})
