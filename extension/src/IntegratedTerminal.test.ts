import {
  IntegratedTerminal,
  runExperiment,
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
import { resolve } from 'path'

const mockPath = resolve('test', 'dir')
jest.spyOn(IntTerm, 'getDefaultCwd').mockReturnValue(mockPath)

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
  it('should run without options', async () => {
    const terminalSpy = jest
      .spyOn(IntegratedTerminal, 'run')
      .mockResolvedValueOnce(undefined)

    const undef = await checkout(mockPath)

    expect(undef).toBeUndefined()
    expect(terminalSpy).toBeCalledWith(`cd ${mockPath} && dvc checkout`)
  })
  it('should run with options', async () => {
    const terminalSpy = jest
      .spyOn(IntegratedTerminal, 'run')
      .mockResolvedValueOnce(undefined)

    const mockOptions = ['-R']
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

    const undef = await install()

    expect(undef).toBeUndefined()
    expect(terminalSpy).toBeCalledWith(`cd ${mockPath} && dvc install`)
  })
})

// describe('list', () => {
//   it('should run without arguments', async () => {
//     const terminalSpy = jest
//       .spyOn(IntegratedTerminal, 'run')
//       .mockResolvedValueOnce(undefined)

//     const undef = await list()

//     expect(undef).toBeUndefined()
//     expect(terminalSpy).toBeCalledWith(`cd ${mockPath} && dvc list`)
//   })
// })

describe('pull', () => {
  it('should run without arguments', async () => {
    const terminalSpy = jest
      .spyOn(IntegratedTerminal, 'run')
      .mockResolvedValueOnce(undefined)

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

    const undef = await push(mockPath)

    expect(undef).toBeUndefined()
    expect(terminalSpy).toBeCalledWith(`dvc push`)
  })
})

describe('status', () => {
  it('should run without arguments', async () => {
    const terminalSpy = jest
      .spyOn(IntegratedTerminal, 'run')
      .mockResolvedValueOnce(undefined)

    const undef = await status()

    expect(undef).toBeUndefined()
    expect(terminalSpy).toBeCalledWith(`cd ${mockPath} && dvc status`)
  })
})
