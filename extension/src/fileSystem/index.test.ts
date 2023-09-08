import { join, relative, resolve } from 'path'
import {
  appendFileSync,
  ensureDirSync,
  ensureFileSync,
  remove,
  readFileSync,
  writeFileSync
} from 'fs-extra'
import { TextDocument, window, workspace } from 'vscode'
import {
  exists,
  findAbsoluteDvcRootPath,
  findDvcRootPaths,
  isDirectory,
  isSameOrChild,
  getModifiedTime,
  findOrCreateDvcYamlFile,
  writeJson,
  writeCsv,
  writeTsv,
  isPathInProject,
  getPidFromFile,
  getEntryFromJsonFile,
  addPlotToDvcYamlFile,
  loadYaml,
  loadCsv,
  loadTsv
} from '.'
import { dvcDemoPath } from '../test/util'
import { DOT_DVC } from '../cli/dvc/constants'
import { ScriptCommand } from '../pipeline'
import { processExists } from '../process/execution'

jest.mock('../common/logger')
jest.mock('../cli/dvc/reader')
jest.mock('../process/execution')
jest.mock('fs-extra', () => {
  const actualModule = jest.requireActual('fs-extra')
  return {
    __esModule: true,
    ...actualModule,
    appendFileSync: jest.fn(),
    ensureFileSync: jest.fn(),
    readFileSync: jest.fn(),
    writeFileSync: jest.fn()
  }
})

const mockedProcessExists = jest.mocked(processExists)

const mockedAppendFileSync = jest.mocked(appendFileSync)
const mockedEnsureFileSync = jest.mocked(ensureFileSync)
const mockedWriteFileSync = jest.mocked(writeFileSync)
const mockedReadFileSync = jest.mocked(readFileSync)
const mockedWorkspace = jest.mocked(workspace)
const mockedWindow = jest.mocked(window)
const mockedOpenTextDocument = jest.fn()
const mockedShowTextDocument = jest.fn()

mockedWorkspace.openTextDocument = mockedOpenTextDocument
mockedWindow.showTextDocument = mockedShowTextDocument

beforeEach(() => {
  jest.resetAllMocks()
})

describe('loadYaml', () => {
  it('should load in yaml file contents as a js object', () => {
    const mockYamlContent = [
      'stages:',
      '  train:',
      '    cmd: python train.py'
    ].join('\n')
    mockedReadFileSync.mockReturnValueOnce(mockYamlContent)

    const result = loadYaml('dvc.yaml')

    expect(result).toStrictEqual({
      stages: {
        train: {
          cmd: 'python train.py'
        }
      }
    })
  })

  it('should catch any errors', () => {
    mockedReadFileSync.mockImplementationOnce(() => {
      throw new Error('fake error')
    })
    const result = loadYaml('dvc.yaml')

    expect(result).toStrictEqual(undefined)
  })
})

describe('loadCsv', () => {
  it('should load in csv file contents as a js object', async () => {
    const mockCsvContent = ['epoch,acc', '10,0.69', '11,0.345'].join('\n')

    mockedReadFileSync.mockReturnValueOnce(mockCsvContent)

    const result = await loadCsv('values.csv')

    expect(result).toStrictEqual([
      { acc: 0.69, epoch: 10 },
      { acc: 0.345, epoch: 11 }
    ])
  })

  it('should catch any errors', () => {
    mockedReadFileSync.mockImplementationOnce(() => {
      throw new Error('fake error')
    })
    const result = loadCsv('values.csv')

    expect(result).toStrictEqual(undefined)
  })
})

describe('loadTsv', () => {
  it('should load in tsv file contents as a js object', async () => {
    const mockTsvContent = ['epoch\tacc', '10\t0.69', '11\t0.345'].join('\n')

    mockedReadFileSync.mockReturnValueOnce(mockTsvContent)

    const result = await loadTsv('result.tsv')

    expect(result).toStrictEqual([
      { acc: 0.69, epoch: 10 },
      { acc: 0.345, epoch: 11 }
    ])
  })

  it('should catch any errors', () => {
    mockedReadFileSync.mockImplementationOnce(() => {
      throw new Error('fake error')
    })
    const result = loadTsv('values.tsv')

    expect(result).toStrictEqual(undefined)
  })
})

describe('writeJson', () => {
  it('should write unformatted json in given file', () => {
    writeJson('file-name.json', { array: [1, 2, 3], number: 1 })

    expect(mockedWriteFileSync).toHaveBeenCalledWith(
      'file-name.json',
      '{"array":[1,2,3],"number":1}'
    )
  })

  it('should write formatted json in given file', () => {
    writeJson('file-name.json', { array: [1, 2, 3], number: 1 }, true)

    const formattedJson =
      '{\n    "array": [\n        1,\n        2,\n        3\n    ],\n    "number": 1\n}'

    expect(mockedWriteFileSync).toHaveBeenCalledWith(
      'file-name.json',
      formattedJson
    )
  })
})

describe('writeCsv', () => {
  it('should write csv into given file', async () => {
    await writeCsv('file-name.csv', [
      { nested: { string: 'string1' }, value: 3 },
      { nested: { string: 'string2' }, value: 4 },
      { nested: { string: 'string3' }, value: 6 }
    ])

    expect(mockedWriteFileSync).toHaveBeenCalledWith(
      'file-name.csv',
      'nested.string,value\nstring1,3\nstring2,4\nstring3,6'
    )
  })
})

describe('writeTsv', () => {
  it('should write tsv into given file', async () => {
    await writeTsv('file-name.tsv', [
      { nested: { string: 'string1' }, value: 3 },
      { nested: { string: 'string2' }, value: 4 },
      { nested: { string: 'string3' }, value: 6 }
    ])

    expect(mockedWriteFileSync).toHaveBeenCalledWith(
      'file-name.tsv',
      'nested.string\tvalue\nstring1\t3\nstring2\t4\nstring3\t6'
    )
  })
})

describe('findDvcRootPaths', () => {
  it('should find the dvc root if it exists in the given folder', async () => {
    const dvcRoots = await findDvcRootPaths(dvcDemoPath)

    expect(dvcRoots).toStrictEqual([dvcDemoPath])
  })

  it('should find multiple roots if available one directory below the given folder', async () => {
    const parentDir = resolve(dvcDemoPath, '..')
    const mockDvcRoot = join(parentDir, 'mockDvc')
    ensureDirSync(join(mockDvcRoot, DOT_DVC))

    const dvcRoots = await findDvcRootPaths(parentDir)

    void remove(mockDvcRoot)

    expect([...dvcRoots]).toStrictEqual([dvcDemoPath, mockDvcRoot])
  })

  it('should find a mono-repo root as well as sub-roots if available one directory below the given folder', async () => {
    const parentDir = dvcDemoPath
    const mockFirstDvcRoot = join(parentDir, 'mockFirstDvc')
    const mockSecondDvcRoot = join(parentDir, 'mockSecondDvc')
    ensureDirSync(join(mockFirstDvcRoot, DOT_DVC))
    ensureDirSync(join(mockSecondDvcRoot, DOT_DVC))

    const dvcRoots = await findDvcRootPaths(parentDir)

    void remove(mockFirstDvcRoot)
    void remove(mockSecondDvcRoot)

    expect([...dvcRoots]).toStrictEqual([
      dvcDemoPath,
      mockFirstDvcRoot,
      mockSecondDvcRoot
    ])
  })
})

describe('findAbsoluteDvcRootPath', () => {
  const dataRoot = resolve(dvcDemoPath, 'data')

  it('should find the dvc root if it exists above the given folder', async () => {
    const dvcRoots = await findAbsoluteDvcRootPath(
      dataRoot,
      Promise.resolve('..')
    )

    expect(dvcRoots).toStrictEqual(dvcDemoPath)
  })

  it('should return an empty array given no dvc root in or above the given directory', async () => {
    const dvcRoots = await findAbsoluteDvcRootPath(
      __dirname,
      Promise.resolve(undefined)
    )
    expect(dvcRoots).toBeUndefined()
  })
})

describe('exists', () => {
  it('should return true for a directory on disk', () => {
    expect(exists(__dirname)).toBe(true)
  })
  it('should return true for a file on disk', () => {
    expect(exists(__filename)).toBe(true)
  })
  it('should return false for an empty string', () => {
    expect(exists(join(__dirname, __dirname))).toBe(false)
  })
  it('should return false for a path not on disk', () => {
    expect(exists('')).toBe(false)
  })
})

describe('isDirectory', () => {
  it('should return true for a directory', () => {
    expect(isDirectory(__dirname)).toBe(true)
  })
  it('should return false for a file', () => {
    expect(isDirectory(__filename)).toBe(false)
  })
  it('should return false for an empty string', () => {
    expect(isDirectory('')).toBe(false)
  })
})

describe('isSameOrChild', () => {
  const mockedRoot = resolve('robot', 'files', 'are', 'fun')

  it('should return true for a directory contained within the root', () => {
    expect(isSameOrChild(mockedRoot, join(mockedRoot, 'too'))).toBe(true)
  })

  it('should return true for a file contained within the root', () => {
    expect(isSameOrChild(mockedRoot, join(mockedRoot, 'javascript.js'))).toBe(
      true
    )
  })

  it('should return true for the path being the root', () => {
    expect(isSameOrChild(mockedRoot, mockedRoot)).toBe(true)
  })

  it('should return false for a directory outside of the root', () => {
    expect(isSameOrChild(mockedRoot, resolve(mockedRoot, '..', '..'))).toBe(
      false
    )
  })

  it('should work for relative paths', () => {
    const relPath = relative(
      '/workspaces/magnetic-tiles-defect',
      '/workspaces/magnetic-tiles-defect/training/plots'
    )

    expect(
      isSameOrChild(relPath, 'training/plots/metrics/train/loss.tsv')
    ).toBe(true)

    expect(
      isSameOrChild(relPath, './training/plots/metrics/train/loss.tsv')
    ).toBe(true)
  })
})

describe('getModifiedTime', () => {
  it('should return a number for a file that exists on the system', () => {
    const epoch = getModifiedTime(__filename)

    expect(typeof epoch).toBe('number')
    expect(epoch).toBeGreaterThan(1640995200000)
  })

  it('should return -1 for a file that does not exist on the system', () => {
    const epoch = getModifiedTime('not a path')

    expect(epoch).toStrictEqual(-1)
  })
})

describe('findOrCreateDvcYamlFile', () => {
  it('should make sure a dvc.yaml file exists', () => {
    const cwd = '/cwd'
    void findOrCreateDvcYamlFile(
      cwd,
      '/my/training/script.py',
      'train',
      ScriptCommand.PYTHON,
      true
    )

    expect(mockedEnsureFileSync).toHaveBeenCalledWith(`${cwd}/dvc.yaml`)
  })

  it('should add the stage name to the dvc.yaml file', () => {
    const cwd = '/cwd'
    const uniqueStageName = 'aWesome_STAGE_name48'
    void findOrCreateDvcYamlFile(
      cwd,
      '/script.py',
      uniqueStageName,
      ScriptCommand.PYTHON,
      true
    )

    expect(mockedAppendFileSync).toHaveBeenCalledWith(
      `${cwd}/dvc.yaml`,
      expect.stringContaining(uniqueStageName)
    )
  })

  it('should add the training script as a train stage in the dvc.yaml file', () => {
    const cwd = '/cwd'
    void findOrCreateDvcYamlFile(
      cwd,
      '/my/training/script.py',
      'train',
      ScriptCommand.PYTHON,
      true
    )

    expect(mockedAppendFileSync).toHaveBeenCalledWith(
      `${cwd}/dvc.yaml`,
      expect.stringMatching(/stages:\s+train:/)
    )
  })

  it('should add a comment to direct the user towards the dvc.yaml stages documentation', () => {
    const cwd = '/cwd'
    void findOrCreateDvcYamlFile(
      cwd,
      '/my/training/script.py',
      'train',
      ScriptCommand.PYTHON,
      true
    )

    expect(mockedAppendFileSync).toHaveBeenCalledWith(
      `${cwd}/dvc.yaml`,
      expect.stringContaining(
        '# Type dvc-help in this file and hit enter to get more information on how the extension can help to setup pipelines'
      )
    )
  })

  it('should add the training script as a relative path to the cwd', () => {
    void findOrCreateDvcYamlFile(
      '/dir/my_project/',
      '/dir/my_project/src/training/train.py',
      'train',
      ScriptCommand.PYTHON,
      true
    )

    expect(mockedAppendFileSync).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining(join('src', 'training', 'train.py'))
    )

    void findOrCreateDvcYamlFile(
      '/dir/my_project/',
      '/dir/my_other_project/train.py',
      'train',
      ScriptCommand.PYTHON,
      true
    )

    expect(mockedAppendFileSync).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining(join('..', 'my_other_project', 'train.py'))
    )
  })

  it('should not convert the script path to a relative path if applyRelativePath is set to false', () => {
    mockedOpenTextDocument.mockResolvedValue({} as TextDocument)

    void findOrCreateDvcYamlFile(
      '/dir/my_project/',
      join('dir', 'my_project', 'src', 'training', 'train.py'),
      'train',
      ScriptCommand.PYTHON,
      false
    )

    expect(mockedAppendFileSync).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining(
        join('dir', 'my_project', 'src', 'training', 'train.py')
      )
    )
  })

  it('should use the jupyter nbconvert command if the training script is a Jupyter notebook', () => {
    void findOrCreateDvcYamlFile(
      '/',
      '/train.ipynb',
      'train',
      ScriptCommand.JUPYTER,
      true
    )

    expect(mockedAppendFileSync).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining(ScriptCommand.JUPYTER)
    )
    expect(mockedAppendFileSync).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining(ScriptCommand.PYTHON)
    )
  })

  it('should use the python command if the training script is not a Jupyter notebook', () => {
    void findOrCreateDvcYamlFile(
      '/',
      '/train.py',
      'train',
      ScriptCommand.PYTHON,
      true
    )

    expect(mockedAppendFileSync).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining(ScriptCommand.JUPYTER)
    )
    expect(mockedAppendFileSync).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining(ScriptCommand.PYTHON)
    )
  })

  it('should use the custom command received', () => {
    const command = 'specialCommand'
    void findOrCreateDvcYamlFile('/', '/train.other', 'train', command, true)

    expect(mockedAppendFileSync).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining(command)
    )
  })

  it('should open the dvc.yaml file in the editor', () => {
    mockedOpenTextDocument.mockResolvedValue({} as TextDocument)

    void findOrCreateDvcYamlFile(
      '/',
      '/train.py',
      'train',
      ScriptCommand.PYTHON,
      true
    )

    expect(mockedOpenTextDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        authority: 'dvc.yaml',
        path: '/',
        scheme: 'file'
      })
    )
  })
})

describe('addPlotToDvcYamlFile', () => {
  it('should add plots item with created plot if dvc.yaml file has no plots', () => {
    const mockDvcYamlContent = [
      'stages:',
      '  train:',
      '    cmd: python train.py'
    ].join('\n')
    const mockPlotYamlContent = [
      '',
      'plots:',
      '  - data.json:',
      '      template: simple',
      '      x: epochs',
      '      y: accuracy',
      ''
    ].join('\n')
    mockedReadFileSync.mockReturnValueOnce(mockDvcYamlContent)

    addPlotToDvcYamlFile('/', {
      dataFile: '/data.json',
      template: 'simple',
      x: 'epochs',
      y: 'accuracy'
    })

    expect(mockedWriteFileSync).toHaveBeenCalledWith(
      '//dvc.yaml',
      mockDvcYamlContent + mockPlotYamlContent
    )
  })
})

describe('isPathInProject', () => {
  it('should return true if the path is in the project', () => {
    const path = join(dvcDemoPath, 'dvc.yaml')
    const dvcRoot = dvcDemoPath
    const subProjects: string[] = []
    expect(isPathInProject(path, dvcRoot, subProjects)).toBe(true)
  })

  it('should return false if the path is not in the project', () => {
    const path = resolve(dvcDemoPath, '..', 'dvc.yaml')
    const dvcRoot = dvcDemoPath
    const subProjects: string[] = []
    expect(isPathInProject(path, dvcRoot, subProjects)).toBe(false)
  })

  it('should return false if the path is the project', () => {
    const path = dvcDemoPath
    const dvcRoot = dvcDemoPath
    const subProjects: string[] = []
    expect(isPathInProject(path, dvcRoot, subProjects)).toBe(false)
  })

  it('should return false if the path is in the project but also in a sub-project', () => {
    const path = join(dvcDemoPath, 'nested1', 'dvc.yaml')
    const dvcRoot = dvcDemoPath
    const subProjects: string[] = [join(dvcDemoPath, 'nested1')]
    expect(isPathInProject(path, dvcRoot, subProjects)).toBe(false)
  })

  it('should return false if the path is in the project but also in one of many sub-projects', () => {
    const path = join(dvcDemoPath, 'nested2', 'dvc.yaml')
    const dvcRoot = dvcDemoPath
    const subProjects: string[] = [
      join(dvcDemoPath, 'nested1'),
      join(dvcDemoPath, 'nested2'),
      join(dvcDemoPath, 'nested3'),
      join(dvcDemoPath, 'nested4')
    ]
    expect(isPathInProject(path, dvcRoot, subProjects)).toBe(false)
  })

  it('should return true if the path is in the project but not in a sub-project', () => {
    const path = join(dvcDemoPath, 'nested1', 'dvc.yaml')
    const dvcRoot = dvcDemoPath
    const subProjects: string[] = [join(dvcDemoPath, 'nested2')]
    expect(isPathInProject(path, dvcRoot, subProjects)).toBe(true)
  })
})

describe('getPidFromFile', () => {
  it('should handle a file containing a number', async () => {
    mockedReadFileSync.mockReturnValueOnce(Buffer.from('3675'))
    mockedProcessExists.mockResolvedValueOnce(true)
    const pid = await getPidFromFile(__filename)

    expect(mockedReadFileSync).toHaveBeenCalledTimes(1)
    expect(mockedProcessExists).toHaveBeenCalledTimes(1)
    expect(pid).toBe(3675)
  })

  it('should handle a file containing a JSON object with a numeric pid', async () => {
    mockedReadFileSync.mockReturnValueOnce(
      Buffer.from(JSON.stringify({ pid: 3676 }))
    )
    mockedProcessExists.mockResolvedValueOnce(true)
    const pid = await getPidFromFile(__filename)

    expect(mockedReadFileSync).toHaveBeenCalledTimes(1)
    expect(mockedProcessExists).toHaveBeenCalledTimes(1)
    expect(pid).toBe(3676)
  })

  it('should handle a file containing a JSON object with a string pid', async () => {
    mockedReadFileSync.mockReturnValueOnce(
      Buffer.from(JSON.stringify({ pid: '3676' }))
    )
    mockedProcessExists.mockResolvedValueOnce(true)
    const pid = await getPidFromFile(__filename)

    expect(mockedReadFileSync).toHaveBeenCalledTimes(1)
    expect(mockedProcessExists).toHaveBeenCalledTimes(1)
    expect(pid).toBe(3676)
  })
})

describe('getEntryFromJsonFile', () => {
  it('should return undefined if the file does not exist', () => {
    const undef = getEntryFromJsonFile('no-file', 'no-keys')

    expect(mockedReadFileSync).toHaveBeenCalledTimes(1)
    expect(undef).toBeUndefined()
  })

  it('should return undefined for a file containing a string', () => {
    mockedReadFileSync.mockReturnValueOnce(Buffer.from('string'))
    const undef = getEntryFromJsonFile(__filename, 'no-keys')

    expect(mockedReadFileSync).toHaveBeenCalledTimes(1)
    expect(undef).toBeUndefined()
  })

  it('should return undefined if the file does not contain the key', () => {
    mockedReadFileSync.mockReturnValueOnce(
      JSON.stringify({ 'other-key': '3676' })
    )
    mockedProcessExists.mockResolvedValueOnce(true)
    const undef = getEntryFromJsonFile(__filename, 'key')

    expect(mockedReadFileSync).toHaveBeenCalledTimes(1)
    expect(undef).toBeUndefined()
  })

  it('should return the value if the file contains the key', () => {
    mockedReadFileSync.mockReturnValueOnce(JSON.stringify({ key: 'value' }))
    mockedProcessExists.mockResolvedValueOnce(true)
    const value = getEntryFromJsonFile(__filename, 'key')

    expect(mockedReadFileSync).toHaveBeenCalledTimes(1)
    expect(value).toStrictEqual('value')
  })
})
