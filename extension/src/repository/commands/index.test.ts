import { join } from 'path'
import { Uri } from 'vscode'
import { mocked } from 'ts-jest/utils'
import { getResourceCommand, getRootCommand, getSimpleResourceCommand } from '.'
import { getWarningResponse, showGenericError } from '../../vscode/modal'
import { Prompt } from '../../cli/output'
import { AvailableCommands, InternalCommands } from '../../internalCommands'

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

    const mockedName = AvailableCommands.COMMIT
    mockedExecuteCommand.mockImplementationOnce(
      getMockedExecuteCommand(mockedName)
    )

    const commandToRegister = getResourceCommand(
      mockedInternalCommands,
      mockedName
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

    const mockedName = AvailableCommands.CHECKOUT
    mockedExecuteCommand.mockImplementationOnce(
      getMockedExecuteCommand(mockedName)
    )

    const commandToRegister = getResourceCommand(
      mockedInternalCommands,
      mockedName
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

    const mockedName = AvailableCommands.REMOVE
    mockedExecuteCommand.mockImplementationOnce(
      getMockedExecuteCommand(mockedName)
    )

    const commandToRegister = getResourceCommand(
      mockedInternalCommands,
      mockedName
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

    const mockedName = AvailableCommands.PULL
    mockedExecuteCommand.mockImplementationOnce(
      getMockedExecuteCommand(mockedName)
    )

    const commandToRegister = getResourceCommand(
      mockedInternalCommands,
      mockedName
    )

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

    const mockedName = AvailableCommands.LIST_DVC_ONLY
    mockedExecuteCommand.mockImplementationOnce(
      getMockedExecuteCommand(mockedName)
    )

    const commandToRegister = getResourceCommand(
      mockedInternalCommands,
      mockedName
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

    const mockedName = AvailableCommands.PUSH
    const mockedPush = getMockedExecuteCommand(mockedName)
    mockedExecuteCommand
      .mockImplementationOnce(mockedPush)
      .mockImplementationOnce(mockedPush)

    const commandToRegister = getResourceCommand(
      mockedInternalCommands,
      mockedName
    )

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

    const mockedName = AvailableCommands.ADD
    mockedExecuteCommand.mockImplementationOnce(
      getMockedExecuteCommand(mockedName)
    )

    const commandToRegister = getSimpleResourceCommand(
      mockedInternalCommands,
      mockedName
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

    const mockedName = AvailableCommands.ADD
    mockedExecuteCommand.mockImplementationOnce(
      getMockedExecuteCommand(mockedName)
    )

    const commandToRegister = getSimpleResourceCommand(
      mockedInternalCommands,
      mockedName
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

    const mockedName = AvailableCommands.PULL
    mockedExecuteCommand.mockImplementationOnce(
      getMockedExecuteCommand(mockedName)
    )

    const commandToRegister = getRootCommand(mockedInternalCommands, mockedName)

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

    const mockedName = AvailableCommands.PUSH
    mockedExecuteCommand.mockImplementationOnce(
      getMockedExecuteCommand(mockedName)
    )

    const commandToRegister = getRootCommand(mockedInternalCommands, mockedName)

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

    const mockedName = AvailableCommands.PULL
    mockedExecuteCommand.mockImplementationOnce(
      getMockedExecuteCommand(mockedName)
    )

    const commandToRegister = getRootCommand(mockedInternalCommands, mockedName)

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

    const mockedName = AvailableCommands.REMOVE
    mockedExecuteCommand.mockImplementationOnce(
      getMockedExecuteCommand(mockedName)
    )

    const commandToRegister = getRootCommand(mockedInternalCommands, mockedName)

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

    const mockedName = AvailableCommands.CHECKOUT
    mockedExecuteCommand.mockImplementationOnce(
      getMockedExecuteCommand(mockedName)
    )

    const commandToRegister = getRootCommand(mockedInternalCommands, mockedName)

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

    const mockedName = AvailableCommands.CHECKOUT
    const mockedCheckout = getMockedExecuteCommand(mockedName)
    mockedExecuteCommand
      .mockImplementationOnce(mockedCheckout)
      .mockImplementationOnce(mockedCheckout)

    const commandToRegister = getRootCommand(mockedInternalCommands, mockedName)

    const output = await commandToRegister({
      rootUri: { fsPath: mockedDvcRoot } as Uri
    })

    expect(output).toEqual(forcedStdout)
    expect(mockedFunc).toHaveBeenCalledWith(mockedDvcRoot)
    expect(mockedFunc).toHaveBeenCalledWith(mockedDvcRoot, '-f')
    expect(mockedFunc).toHaveBeenCalledTimes(2)
  })
})
