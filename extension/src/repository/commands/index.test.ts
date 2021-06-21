import { join } from 'path'
import { Uri } from 'vscode'
import { mocked } from 'ts-jest/utils'
import { getResourceCommand, getRootCommand, getSimpleResourceCommand } from '.'
import { getWarningResponse, showGenericError } from '../../vscode/modal'
import { Prompt } from '../../cli/output'
import { InternalCommands } from '../../internalCommands'

const mockedFunc = jest.fn()
const mockedGetWarningResponse = mocked(getWarningResponse)
const mockedShowGenericError = mocked(showGenericError)
const mockedDvcRoot = join('some', 'path')
const mockedRelPath = join('with', 'a', 'target')
const mockedTarget = join(mockedDvcRoot, mockedRelPath)
const mockedExecuteCommand = jest.fn()
const mockedInternalCommands = ({
  executeCommand: mockedExecuteCommand
} as unknown) as InternalCommands

const getMockedExecuteCommand = (expectedName: string) => (
  name: string,
  ...args: string[]
) => {
  if (name === expectedName) {
    return mockedFunc(...args)
  }
}

jest.mock('vscode')
jest.mock('../../vscode/modal')

beforeEach(() => {
  jest.resetAllMocks()
})

describe('getResourceCommand', () => {
  it('should return a function that only calls the first function if it succeeds', async () => {
    const stdout = 'all went well, congrats'
    mockedFunc.mockResolvedValueOnce(stdout)

    mockedExecuteCommand.mockImplementationOnce(
      getMockedExecuteCommand('commit')
    )

    const commandToRegister = getResourceCommand(
      mockedInternalCommands,
      'commit'
    )

    const output = await commandToRegister({
      dvcRoot: mockedDvcRoot,
      resourceUri: { fsPath: mockedTarget } as Uri
    })

    expect(output).toEqual(stdout)
    expect(mockedFunc).toBeCalledWith(mockedDvcRoot, mockedRelPath)
    expect(mockedFunc).toBeCalledTimes(1)
  })

  it('should return a function that calls showGenericError if the first function fails without a force prompt', async () => {
    const stderr = 'I deed'
    const userCancelled = undefined
    mockedFunc.mockRejectedValueOnce({ stderr })
    mockedShowGenericError.mockResolvedValueOnce(userCancelled)
    mockedExecuteCommand.mockImplementationOnce(
      getMockedExecuteCommand('checkout')
    )

    const commandToRegister = getResourceCommand(
      mockedInternalCommands,
      'checkout'
    )

    const undef = await commandToRegister({
      dvcRoot: mockedDvcRoot,
      resourceUri: { fsPath: mockedTarget } as Uri
    })

    expect(undef).toEqual(userCancelled)
    expect(mockedFunc).toHaveBeenCalledTimes(1)
  })

  it('should return a function that calls getWarningResponse if the first function fails with a force prompt', async () => {
    const stderr = `I deed, but ${Prompt.TRY_FORCE}`
    const userCancelled = undefined
    mockedFunc.mockRejectedValueOnce({ stderr })
    mockedGetWarningResponse.mockResolvedValueOnce(userCancelled)
    mockedExecuteCommand.mockImplementationOnce(
      getMockedExecuteCommand('remove')
    )

    const commandToRegister = getResourceCommand(
      mockedInternalCommands,
      'remove'
    )

    const undef = await commandToRegister({
      dvcRoot: mockedDvcRoot,
      resourceUri: { fsPath: mockedTarget } as Uri
    })

    expect(undef).toEqual(userCancelled)
    expect(mockedFunc).toHaveBeenCalledTimes(1)
  })

  it('should return a function that does not call the func with a force flag if the user selects cancel', async () => {
    const stderr = `You don't have to do this, but ${Prompt.TRY_FORCE}`
    const userCancelled = 'Cancel'
    mockedFunc.mockRejectedValueOnce({ stderr })
    mockedGetWarningResponse.mockResolvedValueOnce(userCancelled)
    mockedExecuteCommand.mockImplementationOnce(getMockedExecuteCommand('pull'))

    const commandToRegister = getResourceCommand(mockedInternalCommands, 'pull')

    const undef = await commandToRegister({
      dvcRoot: mockedDvcRoot,
      resourceUri: { fsPath: mockedTarget } as Uri
    })

    expect(undef).toEqual(undefined)
    expect(mockedFunc).toHaveBeenCalledTimes(1)
  })

  it('should return a function that does not call the func with a force flag if no stderr is return in the underlying error', async () => {
    const userCancelled = 'Cancel'
    mockedFunc.mockRejectedValueOnce({})
    mockedGetWarningResponse.mockResolvedValueOnce(userCancelled)
    mockedExecuteCommand.mockImplementationOnce(
      getMockedExecuteCommand('not-a-function')
    )

    const commandToRegister = getResourceCommand(
      mockedInternalCommands,
      'not-a-function'
    )

    const undef = await commandToRegister({
      dvcRoot: mockedDvcRoot,
      resourceUri: { fsPath: mockedTarget } as Uri
    })

    expect(undef).toEqual(undefined)
    expect(mockedFunc).toHaveBeenCalledTimes(1)
  })

  it('should return a function that calls the function with the force flag if the first function fails with a force prompt and the user responds with force', async () => {
    const stderr = `I can fix this... maybe, but ${Prompt.TRY_FORCE}`
    const forcedStdout = 'ok, nw I forced it'
    const userApproves = 'Force'
    mockedFunc
      .mockRejectedValueOnce({ stderr })
      .mockResolvedValueOnce(forcedStdout)
    mockedGetWarningResponse.mockResolvedValueOnce(userApproves)
    const mockedPush = getMockedExecuteCommand('push')
    mockedExecuteCommand
      .mockImplementationOnce(mockedPush)
      .mockImplementationOnce(mockedPush)

    const commandToRegister = getResourceCommand(mockedInternalCommands, 'push')

    const output = await commandToRegister({
      dvcRoot: mockedDvcRoot,
      resourceUri: { fsPath: mockedTarget } as Uri
    })

    expect(output).toEqual(forcedStdout)
    expect(mockedFunc).toHaveBeenCalledWith(mockedDvcRoot, mockedRelPath)
    expect(mockedFunc).toHaveBeenCalledWith(mockedDvcRoot, mockedRelPath, '-f')
    expect(mockedFunc).toHaveBeenCalledTimes(2)
  })
})

describe('getSimpleResourceCommand', () => {
  it('should return a simple function that only calls the first function if it succeeds', async () => {
    const stdout = "I'm simple, that's easy"
    mockedFunc.mockResolvedValueOnce(stdout)

    mockedExecuteCommand.mockImplementationOnce(
      getMockedExecuteCommand('addTarget')
    )

    const commandToRegister = getSimpleResourceCommand(
      mockedInternalCommands,
      'addTarget'
    )

    const output = await commandToRegister({
      dvcRoot: mockedDvcRoot,
      resourceUri: { fsPath: mockedTarget } as Uri
    })

    expect(output).toEqual(stdout)
    expect(mockedFunc).toHaveBeenCalledWith(mockedDvcRoot, mockedRelPath)
  })

  it('should return a function that calls showGenericError if the provided function fails', async () => {
    const stderr = 'I deed'
    const noResponsePossible = undefined
    mockedFunc.mockRejectedValueOnce({ stderr })
    mockedShowGenericError.mockResolvedValueOnce(noResponsePossible)

    mockedExecuteCommand.mockImplementationOnce(getMockedExecuteCommand('add'))

    const commandToRegister = getSimpleResourceCommand(
      mockedInternalCommands,
      'add'
    )

    const undef = await commandToRegister({
      dvcRoot: mockedDvcRoot,
      resourceUri: { fsPath: mockedDvcRoot } as Uri
    })

    expect(undef).toEqual(noResponsePossible)
  })
})

describe('getRootCommand', () => {
  it('should return a function that only calls the first function if it succeeds', async () => {
    const stdout = 'all went well, congrats'
    mockedFunc.mockResolvedValueOnce(stdout)

    mockedExecuteCommand.mockImplementationOnce(getMockedExecuteCommand('pull'))

    const commandToRegister = getRootCommand(mockedInternalCommands, 'pull')

    const output = await commandToRegister({
      rootUri: { fsPath: mockedDvcRoot } as Uri
    })

    expect(output).toEqual(stdout)
    expect(mockedFunc).toHaveBeenCalledWith(mockedDvcRoot)
    expect(mockedFunc).toHaveBeenCalledTimes(1)
  })

  it('should return a function that calls showGenericError if the first function fails without a force prompt', async () => {
    const stderr = 'I deed'
    const userCancelled = undefined
    mockedFunc.mockRejectedValueOnce({ stderr })
    mockedShowGenericError.mockResolvedValueOnce(userCancelled)
    mockedExecuteCommand.mockImplementationOnce(getMockedExecuteCommand('push'))

    const commandToRegister = getRootCommand(mockedInternalCommands, 'push')

    const undef = await commandToRegister({
      rootUri: { fsPath: mockedDvcRoot } as Uri
    })

    expect(undef).toEqual(userCancelled)
    expect(mockedFunc).toHaveBeenCalledTimes(1)
  })

  it('should return a function that calls getWarningResponse if the first function fails with a force prompt', async () => {
    const stderr = `I deed, but ${Prompt.TRY_FORCE}`
    const userCancelled = undefined
    mockedFunc.mockRejectedValueOnce({ stderr })
    mockedGetWarningResponse.mockResolvedValueOnce(userCancelled)
    mockedExecuteCommand.mockImplementationOnce(getMockedExecuteCommand('pull'))

    const commandToRegister = getRootCommand(mockedInternalCommands, 'pull')

    const undef = await commandToRegister({
      rootUri: { fsPath: mockedDvcRoot } as Uri
    })

    expect(undef).toEqual(userCancelled)
    expect(mockedFunc).toHaveBeenCalledTimes(1)
  })

  it('should return a function that does not call the force func if the user selects cancel', async () => {
    const stderr = `You don't have to do this, but ${Prompt.TRY_FORCE}`
    const userCancelled = 'Cancel'
    mockedFunc.mockRejectedValueOnce({ stderr })
    mockedGetWarningResponse.mockResolvedValueOnce(userCancelled)
    mockedExecuteCommand.mockImplementationOnce(getMockedExecuteCommand('pull'))

    const commandToRegister = getRootCommand(mockedInternalCommands, 'pull')

    const undef = await commandToRegister({
      rootUri: { fsPath: mockedDvcRoot } as Uri
    })

    expect(undef).toEqual(undefined)
    expect(mockedFunc).toHaveBeenCalledTimes(1)
  })

  it('should return a function that does not call the force func if no stderr is return in the underlying error', async () => {
    const userCancelled = 'Cancel'
    mockedFunc.mockRejectedValueOnce({})
    mockedGetWarningResponse.mockResolvedValueOnce(userCancelled)
    mockedExecuteCommand.mockImplementationOnce(getMockedExecuteCommand('pull'))

    const commandToRegister = getRootCommand(mockedInternalCommands, 'pull')

    const undef = await commandToRegister({
      rootUri: { fsPath: mockedDvcRoot } as Uri
    })

    expect(undef).toEqual(undefined)
    expect(mockedFunc).toHaveBeenCalledTimes(1)
  })

  it('should return a function that calls the force function if the first function fails with a force prompt and the user responds with force', async () => {
    const stderr = `I can fix this... maybe, but ${Prompt.TRY_FORCE}`
    const forcedStdout = 'ok, nw I forced it'
    const userApproves = 'Force'
    mockedFunc
      .mockRejectedValueOnce({ stderr })
      .mockResolvedValueOnce(forcedStdout)
    mockedGetWarningResponse.mockResolvedValueOnce(userApproves)
    const mockedCheckout = getMockedExecuteCommand('checkout')
    mockedExecuteCommand
      .mockImplementationOnce(mockedCheckout)
      .mockImplementationOnce(mockedCheckout)

    const commandToRegister = getRootCommand(mockedInternalCommands, 'checkout')

    const output = await commandToRegister({
      rootUri: { fsPath: mockedDvcRoot } as Uri
    })

    expect(output).toEqual(forcedStdout)
    expect(mockedFunc).toHaveBeenCalledWith(mockedDvcRoot)
    expect(mockedFunc).toHaveBeenCalledWith(mockedDvcRoot, '-f')
    expect(mockedFunc).toHaveBeenCalledTimes(2)
  })
})
