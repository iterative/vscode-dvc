import {
  IntegratedTerminal,
  runExperiment,
  add,
  checkout,
  commit,
  destroy,
  fetch,
  gc,
  initialize,
  install,
  list,
  pull,
  status,
  push
} from './IntegratedTerminal'
import * as IntTerm from './IntegratedTerminal'
import { relative, resolve } from 'path'
import { mocked } from 'ts-jest/utils'
import { Uri } from 'vscode'

beforeEach(() => {
  jest.resetAllMocks()
})

jest.mock('vscode')

const mockCwd = resolve('root')
const mockPath = resolve('root', 'test', 'dir')
const mockRelPath = relative(mockCwd, mockPath)

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

describe('add', () => {
  it('should run without options', async () => {
    const terminalSpy = jest
      .spyOn(IntegratedTerminal, 'run')
      .mockResolvedValueOnce(undefined)

    const mockedUri = mocked(Uri)
    const mockUri = ({ path: mockRelPath } as unknown) as Uri
    jest.spyOn(IntTerm, 'getDefaultCwd').mockReturnValue(mockCwd)
    mockedUri.file.mockReturnValue(mockUri)

    const undef = await add(mockPath)

    expect(undef).toBeUndefined()
    expect(terminalSpy).toBeCalledWith(`dvc add ${mockRelPath}`)
  })
})

describe('checkout', () => {
  it('should run without options', async () => {
    const terminalSpy = jest
      .spyOn(IntegratedTerminal, 'run')
      .mockResolvedValueOnce(undefined)

    jest.spyOn(IntTerm, 'getDefaultCwd').mockReturnValue(mockPath)
    const undef = await checkout(mockPath)

    expect(undef).toBeUndefined()
    expect(terminalSpy).toBeCalledWith(`cd ${mockPath} && dvc checkout`)
  })
  it('should run with options', async () => {
    const terminalSpy = jest
      .spyOn(IntegratedTerminal, 'run')
      .mockResolvedValueOnce(undefined)

    const mockOptions = ['-R']
    jest.spyOn(IntTerm, 'getDefaultCwd').mockReturnValue(mockPath)
    const undef = await checkout(mockPath, mockOptions)

    expect(undef).toBeUndefined()
    expect(terminalSpy).toBeCalledWith(`cd ${mockPath} && dvc checkout -R`)
  })
})

describe('commit', () => {
  it('should run without arguments', async () => {
    const terminalSpy = jest
      .spyOn(IntegratedTerminal, 'run')
      .mockResolvedValueOnce(undefined)

    jest.spyOn(IntTerm, 'getDefaultCwd').mockReturnValue(mockPath)
    const undef = await commit()

    expect(undef).toBeUndefined()
    expect(terminalSpy).toBeCalledWith(`cd ${mockPath} && dvc commit`)
  })
})

describe('destroy', () => {
  it('should run without arguments', async () => {
    const terminalSpy = jest
      .spyOn(IntegratedTerminal, 'run')
      .mockResolvedValueOnce(undefined)

    jest.spyOn(IntTerm, 'getDefaultCwd').mockReturnValue(mockPath)
    const undef = await destroy()

    expect(undef).toBeUndefined()
    expect(terminalSpy).toBeCalledWith(`cd ${mockPath} && dvc destroy`)
  })
})

describe('fetch', () => {
  it('should run without options', async () => {
    const terminalSpy = jest
      .spyOn(IntegratedTerminal, 'run')
      .mockResolvedValueOnce(undefined)

    jest.spyOn(IntTerm, 'getDefaultCwd').mockReturnValue(mockPath)
    const undef = await fetch(mockPath)

    expect(undef).toBeUndefined()
    expect(terminalSpy).toBeCalledWith(`cd ${mockPath} && dvc fetch`)
  })
})

describe('garbageCollect', () => {
  it('should run without options', async () => {
    const terminalSpy = jest
      .spyOn(IntegratedTerminal, 'run')
      .mockResolvedValueOnce(undefined)

    jest.spyOn(IntTerm, 'getDefaultCwd').mockReturnValue(mockPath)
    const undef = await gc(mockPath)

    expect(undef).toBeUndefined()
    expect(terminalSpy).toBeCalledWith(`cd ${mockPath} && dvc gc`)
  })
})

describe('initialize', () => {
  it('should run without options', async () => {
    const terminalSpy = jest
      .spyOn(IntegratedTerminal, 'run')
      .mockResolvedValueOnce(undefined)

    jest.spyOn(IntTerm, 'getDefaultCwd').mockReturnValue(mockPath)
    const undef = await initialize(mockPath)

    expect(undef).toBeUndefined()
    expect(terminalSpy).toBeCalledWith(`cd ${mockPath} && dvc init`)
  })
})

describe('install', () => {
  it('should run without arguments', async () => {
    const terminalSpy = jest
      .spyOn(IntegratedTerminal, 'run')
      .mockResolvedValueOnce(undefined)

    jest.spyOn(IntTerm, 'getDefaultCwd').mockReturnValue(mockPath)
    const undef = await install()

    expect(undef).toBeUndefined()
    expect(terminalSpy).toBeCalledWith(`cd ${mockPath} && dvc install`)
  })
})

describe('list', () => {
  it('should run without arguments', async () => {
    const terminalSpy = jest
      .spyOn(IntegratedTerminal, 'run')
      .mockResolvedValueOnce(undefined)

    jest.spyOn(IntTerm, 'getDefaultCwd').mockReturnValue(mockPath)
    const undef = await list()

    expect(undef).toBeUndefined()
    expect(terminalSpy).toBeCalledWith(`dvc list ${mockPath}`)
  })
})

describe('pull', () => {
  it('should run without arguments', async () => {
    const terminalSpy = jest
      .spyOn(IntegratedTerminal, 'run')
      .mockResolvedValueOnce(undefined)

    jest.spyOn(IntTerm, 'getDefaultCwd').mockReturnValue(mockPath)
    const undef = await pull()

    expect(undef).toBeUndefined()
    expect(terminalSpy).toBeCalledWith(`cd ${mockPath} && dvc pull`)
  })
})

describe('push', () => {
  it('should run without options', async () => {
    const terminalSpy = jest
      .spyOn(IntegratedTerminal, 'run')
      .mockResolvedValueOnce(undefined)

    const mockedUri = mocked(Uri)
    const mockUri = ({ path: mockRelPath } as unknown) as Uri
    jest.spyOn(IntTerm, 'getDefaultCwd').mockReturnValue(mockCwd)
    mockedUri.file.mockReturnValue(mockUri)

    const undef = await push(mockPath)

    expect(undef).toBeUndefined()
    expect(terminalSpy).toBeCalledWith(`dvc push ${mockRelPath}`)
  })
})

describe('status', () => {
  it('should run without arguments', async () => {
    const terminalSpy = jest
      .spyOn(IntegratedTerminal, 'run')
      .mockResolvedValueOnce(undefined)

    jest.spyOn(IntTerm, 'getDefaultCwd').mockReturnValue(mockPath)
    const undef = await status()

    expect(undef).toBeUndefined()
    expect(terminalSpy).toBeCalledWith(`cd ${mockPath} && dvc status`)
  })
})
