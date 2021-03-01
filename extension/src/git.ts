import { pathExists, realpath } from 'fs-extra'
import { execPromise } from './util'
import { Uri, window } from 'vscode'
import { dirname } from 'path'

const isWindows = process.platform === 'win32'

export const getRepoRootPath = async (
  dirPath: string
): Promise<string | undefined> => {
  let rootPath: string | undefined
  try {
    rootPath = await revParseShowToplevel(dirPath)
    if (rootPath == null) {
      return rootPath
    }

    if (isWindows) {
      return getWindowsRepoRootPath(dirPath, rootPath)
    }

    return getNonWidowsRepoRootPath(dirPath, rootPath)
  } catch (ex) {
    console.error(ex)
    rootPath = undefined
    return rootPath
  } finally {
    if (rootPath) {
      void ensureProperWorkspaceCasing(rootPath, dirPath)
    }
  }
}

const revParseShowToplevel = async (
  cwd: string
): Promise<string | undefined> => {
  try {
    const { stdout: data } = await execPromise(
      'git rev-parse --show-toplevel',
      {
        cwd
      }
    )
    // Make sure to normalize: https://github.com/git-for-windows/git/issues/2478
    // Keep trailing spaces which are part of the directory name
    return data.length === 0
      ? undefined
      : normalizePath(data.trimLeft().replace(/[\r|\n]+$/, ''))
  } catch (ex) {
    if (ex.code === 'ENOENT') {
      // If the `cwd` doesn't exist, walk backward to see if any parent folder exists
      let exists = await pathExists(cwd)
      if (!exists) {
        do {
          const parent = dirname(cwd)
          if (parent === cwd || parent.length === 0) {
            return undefined
          }

          cwd = parent
          exists = await pathExists(cwd)
        } while (!exists)

        return revParseShowToplevel(cwd)
      }
    }
    return undefined
  }
}

const getWindowsRepoRootPath = async (
  dirPath: string,
  rootPath: string
): Promise<string | undefined> => {
  // On Git 2.25+ if you call `rev-parse --show-toplevel` on a mapped drive,
  // instead of getting the mapped drive path back, you get the UNC path for the mapped drive.
  // So try to normalize it back to the mapped drive path, if possible

  const repoUri = Uri.file(rootPath)
  const pathUri = Uri.file(dirPath)
  if (repoUri.authority.length !== 0 && pathUri.authority.length === 0) {
    const driveLetterRegex = /(?<=^\/?)([a-zA-Z])(?=:\/)/
    const match = driveLetterRegex.exec(pathUri.path)
    if (match != null) {
      const [, letter] = match

      try {
        const networkPath = await new Promise<string | undefined>(resolve =>
          realpath(`${letter}:\\`, { encoding: 'utf8' }, (err, resolvedPath) =>
            resolve(err != null ? undefined : resolvedPath)
          )
        )
        if (networkPath != null) {
          rootPath = normalizePath(
            repoUri.fsPath.replace(
              networkPath,
              `${letter.toLowerCase()}:${
                networkPath.endsWith('\\') ? '\\' : ''
              }`
            )
          )
          return rootPath
        }
      } catch (e) {
        console.error(e)
      }
    }

    rootPath = normalizePath(pathUri.fsPath)
  }

  return rootPath
}

const getNonWidowsRepoRootPath = async (dirPath: string, rootPath?: string) => {
  // If we are not on Windows (symlinks don't seem to have the same issue on Windows), check if we are a symlink and if so, use the symlink path (not its resolved path)
  // This is because VS Code will provide document Uris using the symlinked path
  rootPath = await new Promise<string | undefined>(resolve => {
    realpath(dirPath, { encoding: 'utf8' }, (err, resolvedPath) => {
      if (err != null) {
        resolve(rootPath)
        return
      }

      if (dirPath.toLowerCase() === resolvedPath.toLowerCase()) {
        resolve(rootPath)
        return
      }

      const linkPath = normalizePath(resolvedPath, {
        stripTrailingSlash: true
      })
      rootPath = rootPath?.replace(linkPath, dirPath)
      resolve(rootPath)
    })
  })

  return rootPath
}

const enum CharCode {
  /**
   * The `/` character.
   */
  Slash = 47,
  /**
   * The `\` character.
   */
  Backslash = 92,
  A = 65,
  Z = 90,
  a = 97,
  z = 122
}

const normalizePath = (
  fileName: string,
  options: { addLeadingSlash?: boolean; stripTrailingSlash?: boolean } = {
    stripTrailingSlash: true
  }
) => {
  if (fileName == null || fileName.length === 0) {
    return fileName
  }

  let normalized = fileName.replace(/\\/g, '/')

  const { addLeadingSlash, stripTrailingSlash } = {
    stripTrailingSlash: true,
    ...options
  }

  if (stripTrailingSlash) {
    normalized = normalized.replace(/\/$/g, '')
  }

  if (addLeadingSlash && normalized.charCodeAt(0) !== CharCode.Slash) {
    normalized = `/${normalized}`
  }

  if (isWindows) {
    // Ensure that drive casing is normalized (lower case)
    const driveLetterNormalizeRegex = /(?<=^\/?)([A-Z])(?=:\/)/
    normalized = normalized.replace(
      driveLetterNormalizeRegex,
      (drive: string) => drive.toLowerCase()
    )
  }

  return normalized
}

const ensureProperWorkspaceCasing = (rootPath: string, filePath: string) => {
  filePath = filePath.replace(/\\/g, '/')

  let regexPath
  let testPath
  if (filePath > rootPath) {
    regexPath = filePath
    testPath = rootPath
  } else {
    testPath = filePath
    regexPath = rootPath
  }

  let pathRegex = new RegExp(`^${regexPath}`)
  if (!pathRegex.test(testPath)) {
    pathRegex = new RegExp(pathRegex, 'i')
    if (pathRegex.test(testPath)) {
      return showIncorrectWorkspaceCasingWarningMessage()
    }
  }
}

const showIncorrectWorkspaceCasingWarningMessage = async (): Promise<void> => {
  void (await window.showWarningMessage(
    'This workspace was opened with a different casing than what exists on disk. Please re-open this workspace with the exact casing as it exists on disk, otherwise you may experience issues with certain Git features, such as missing blame or history.'
  ))
}
