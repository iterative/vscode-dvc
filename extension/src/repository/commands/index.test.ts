import { join } from 'path'
import { Uri } from 'vscode'
import { mocked } from 'ts-jest/utils'
import { getResourceCommand, getRootCommand, getSimpleResourceCommand } from '.'
import { getWarningResponse, showGenericError } from '../../vscode/modal'
import { Prompt } from '../../cli/output'
import { CommandId, InternalCommands } from '../../internalCommands'
import { Config } from '../../config'

const mockedFunc = jest.fn()
const mockedGetWarningResponse = mocked(getWarningResponse)
const mockedShowGenericError = mocked(showGenericError)
const mockedDvcRoot = join('some', 'path')
const mockedRelPath = join('with', 'a', 'target')
const mockedTarget = join(mockedDvcRoot, mockedRelPath)
const mockedGetDefaultProject = jest.fn()
const mockedInternalCommands = new InternalCommands({
  getDefaultProject: mockedGetDefaultProject
} as unknown as Config)

const mockedCommandId = 'mockedFunc' as CommandId
mockedInternalCommands.registerCommand(mockedCommandId, (...args) =>
  mockedFunc(...args)
)

jest.mock('vscode')
jest.mock('../../vscode/modal')

beforeEach(() => {
  jest.resetAllMocks()
})

describe('getResourceCommand', () => {
  it('should return a function that only calls the first function if it succeeds', async () => {
    const stdout = 'all went well, congrats'
    mockedFunc.mockResolvedValueOnce(stdout)

    const commandToRegister = getResourceCommand(
      mockedInternalCommands,
      mockedCommandId
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

    const commandToRegister = getResourceCommand(
      mockedInternalCommands,
      mockedCommandId
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

    const commandToRegister = getResourceCommand(
      mockedInternalCommands,
      mockedCommandId
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

    const commandToRegister = getResourceCommand(
      mockedInternalCommands,
      mockedCommandId
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

    const commandToRegister = getResourceCommand(
      mockedInternalCommands,
      mockedCommandId
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

    const commandToRegister = getResourceCommand(
      mockedInternalCommands,
      mockedCommandId
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

    const commandToRegister = getSimpleResourceCommand(
      mockedInternalCommands,
      mockedCommandId
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

    const commandToRegister = getSimpleResourceCommand(
      mockedInternalCommands,
      mockedCommandId
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

    const commandToRegister = getRootCommand(
      mockedInternalCommands,
      mockedCommandId
    )

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

    const commandToRegister = getRootCommand(
      mockedInternalCommands,
      mockedCommandId
    )

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

    const commandToRegister = getRootCommand(
      mockedInternalCommands,
      mockedCommandId
    )

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

    const commandToRegister = getRootCommand(
      mockedInternalCommands,
      mockedCommandId
    )

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

    const commandToRegister = getRootCommand(
      mockedInternalCommands,
      mockedCommandId
    )

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

    const commandToRegister = getRootCommand(
      mockedInternalCommands,
      mockedCommandId
    )

    const output = await commandToRegister({
      rootUri: { fsPath: mockedDvcRoot } as Uri
    })

    expect(output).toEqual(forcedStdout)
    expect(mockedFunc).toHaveBeenCalledWith(mockedDvcRoot)
    expect(mockedFunc).toHaveBeenCalledWith(mockedDvcRoot, '-f')
    expect(mockedFunc).toHaveBeenCalledTimes(2)
  })
})
