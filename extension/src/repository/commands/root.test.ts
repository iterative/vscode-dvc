import { Uri } from 'vscode'
import { mocked } from 'ts-jest/utils'
import { getRootCommand } from './root'
import { getWarningResponse, showGenericError } from '../../vscode/modal'
import { Prompt } from '../../cli/output'

const mockedFunc = jest.fn()
const mockedForceFunc = jest.fn()
const mockedGetWarningResponse = mocked(getWarningResponse)
const mockedShowGenericError = mocked(showGenericError)
const mockedPath = '/some/path'

jest.mock('vscode')
jest.mock('../../vscode/modal')

beforeEach(() => {
  jest.resetAllMocks()
})

describe('getRootCommand', () => {
  it('should return a function that only calls the first function if it succeeds', async () => {
    const stdout = 'all went well, congrats'
    mockedFunc.mockResolvedValueOnce(stdout)
    const commandToRegister = getRootCommand(mockedFunc, mockedForceFunc)

    const output = await commandToRegister({
      rootUri: { fsPath: mockedPath } as Uri
    })

    expect(output).toEqual(stdout)
    expect(mockedForceFunc).not.toHaveBeenCalled()
  })

  it('should return a function that calls showGenericError if the first function fails without a force prompt', async () => {
    const stderr = 'I deed'
    const userCancelled = undefined
    mockedFunc.mockRejectedValueOnce({ stderr })
    mockedShowGenericError.mockResolvedValueOnce(userCancelled)
    const commandToRegister = getRootCommand(mockedFunc, mockedForceFunc)

    const undef = await commandToRegister({
      rootUri: { fsPath: mockedPath } as Uri
    })

    expect(undef).toEqual(userCancelled)
    expect(mockedForceFunc).not.toHaveBeenCalled()
  })

  it('should return a function that calls getWarningResponse if the first function fails with a force prompt', async () => {
    const stderr = `I deed, but ${Prompt.TRY_FORCE}`
    const userCancelled = undefined
    mockedFunc.mockRejectedValueOnce({ stderr })
    mockedGetWarningResponse.mockResolvedValueOnce(userCancelled)
    const commandToRegister = getRootCommand(mockedFunc, mockedForceFunc)

    const undef = await commandToRegister({
      rootUri: { fsPath: mockedPath } as Uri
    })

    expect(undef).toEqual(userCancelled)
    expect(mockedForceFunc).not.toHaveBeenCalled()
  })

  it('should return a function that does not call the force func if the user selects cancel', async () => {
    const stderr = `You don't have to do this, but ${Prompt.TRY_FORCE}`
    const userCancelled = 'Cancel'
    mockedFunc.mockRejectedValueOnce({ stderr })
    mockedGetWarningResponse.mockResolvedValueOnce(userCancelled)
    const commandToRegister = getRootCommand(mockedFunc, mockedForceFunc)

    const undef = await commandToRegister({
      rootUri: { fsPath: mockedPath } as Uri
    })

    expect(undef).toEqual(undefined)
    expect(mockedForceFunc).not.toHaveBeenCalled()
  })

  it('should return a function that calls the force function if the first function fails with a force prompt and the user responds with force', async () => {
    const stderr = `I can fix this... maybe, but ${Prompt.TRY_FORCE}`
    const forcedStdout = 'ok, nw I forced it'
    const userApproves = 'Force'
    mockedFunc.mockRejectedValueOnce({ stderr })
    mockedGetWarningResponse.mockResolvedValueOnce(userApproves)
    mockedForceFunc.mockResolvedValueOnce(forcedStdout)
    const commandToRegister = getRootCommand(mockedFunc, mockedForceFunc)

    const output = await commandToRegister({
      rootUri: { fsPath: mockedPath } as Uri
    })

    expect(output).toEqual(forcedStdout)
    expect(mockedForceFunc).toHaveBeenCalledTimes(1)
  })
})
