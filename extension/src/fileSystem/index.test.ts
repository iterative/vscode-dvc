import { join, relative, resolve } from 'path'
import { appendFileSync, ensureDirSync, ensureFileSync, remove } from 'fs-extra'
import { TextDocument, window, workspace } from 'vscode'
import {
  exists,
  findAbsoluteDvcRootPath,
  findDvcRootPaths,
  isDirectory,
  isSameOrChild,
  getModifiedTime,
  findOrCreateDvcYamlFile,
  scriptCommand
} from '.'
import { dvcDemoPath } from '../test/util'
import { DOT_DVC } from '../cli/dvc/constants'

jest.mock('../cli/dvc/reader')
jest.mock('fs-extra', () => {
  const actualModule = jest.requireActual('fs-extra')
  return {
    __esModule: true,
    ...actualModule,
    appendFileSync: jest.fn(),
    ensureFileSync: jest.fn()
  }
})

const mockedAppendFileSync = jest.mocked(appendFileSync)
const mockedEnsureFileSync = jest.mocked(ensureFileSync)
const mockedWorkspace = jest.mocked(workspace)
const mockedWindow = jest.mocked(window)
const mockedOpenTextDocument = jest.fn()
const mockedShowTextDocument = jest.fn()

mockedWorkspace.openTextDocument = mockedOpenTextDocument
mockedWindow.showTextDocument = mockedShowTextDocument

beforeEach(() => {
  jest.resetAllMocks()
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
})

describe('findOrCreateDvcYamlFile', () => {
  it('should make sure a dvc.yaml file exists', () => {
    const cwd = '/cwd'
    void findOrCreateDvcYamlFile(cwd, '/my/training/script.py', 'train')

    expect(mockedEnsureFileSync).toHaveBeenCalledWith(`${cwd}/dvc.yaml`)
  })

  it('should add the stage name to the dvc.yaml file', () => {
    const cwd = '/cwd'
    const uniqueStageName = 'aWesome_STAGE_name48'
    findOrCreateDvcYamlFile(cwd, '/script.py', uniqueStageName)

    expect(mockedAppendFileSync).toHaveBeenCalledWith(
      `${cwd}/dvc.yaml`,
      expect.stringContaining(uniqueStageName)
    )
  })

  it('should add the training script as a train stage in the dvc.yaml file', () => {
    const cwd = '/cwd'
    void findOrCreateDvcYamlFile(cwd, '/my/training/script.py', 'train')

    expect(mockedAppendFileSync).toHaveBeenCalledWith(
      `${cwd}/dvc.yaml`,
      expect.stringMatching(/stages:\s+train:/)
    )
  })

  it('should add a comment to direct the user towards the dvc.yaml stages documentation', () => {
    const cwd = '/cwd'
    void findOrCreateDvcYamlFile(cwd, '/my/training/script.py', 'train')

    expect(mockedAppendFileSync).toHaveBeenCalledWith(
      `${cwd}/dvc.yaml`,
      expect.stringContaining(
        `# Read about DVC pipeline configuration (https://dvc.org/doc/user-guide/project-structure/dvcyaml-files#stages)
# to customize your stages even more`
      )
    )
  })

  it('should add the training script as a relative path to the cwd', () => {
    void findOrCreateDvcYamlFile(
      '/dir/my_project/',
      '/dir/my_project/src/training/train.py',
      'train'
    )

    expect(mockedAppendFileSync).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining(join('src', 'training', 'train.py'))
    )

    void findOrCreateDvcYamlFile(
      '/dir/my_project/',
      '/dir/my_other_project/train.py',
      'train'
    )

    expect(mockedAppendFileSync).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining(join('..', 'my_other_project', 'train.py'))
    )
  })

  it('should use the jupyter nbconvert command if the training script is a Jupyter notebook', () => {
    void findOrCreateDvcYamlFile('/', '/train.ipynb', 'train')

    expect(mockedAppendFileSync).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining(scriptCommand.JUPYTER)
    )
    expect(mockedAppendFileSync).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining(scriptCommand.PYTHON)
    )
  })

  it('should use the python command if the training script is not a Jupyter notebook', () => {
    void findOrCreateDvcYamlFile('/', '/train.py', 'train')

    expect(mockedAppendFileSync).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining(scriptCommand.JUPYTER)
    )
    expect(mockedAppendFileSync).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining(scriptCommand.PYTHON)
    )
  })

  it('should open the dvc.yaml file in the editor', () => {
    mockedOpenTextDocument.mockResolvedValue({} as TextDocument)

    void findOrCreateDvcYamlFile('/', '/train.py', 'train')

    expect(mockedOpenTextDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        authority: 'dvc.yaml',
        path: '/',
        scheme: 'file'
      })
    )
  })
})
