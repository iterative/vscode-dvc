import { exists, realpath } from 'fs'
import { execPromise } from './util'
import { Uri, window } from 'vscode'
import { dirname } from 'path'

function fsExists(path: string): Promise<boolean> {
  return new Promise<boolean>(resolve =>
    exists(path, exists => resolve(exists))
  )
}

const isWindows = process.platform === 'win32'

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

const emptyStr = ''
const driveLetterNormalizeRegex = /(?<=^\/?)([A-Z])(?=:\/)/
const pathNormalizeRegex = /\\/g
const pathStripTrailingSlashRegex = /\/$/g

function normalizePath(
  fileName: string,
  options: { addLeadingSlash?: boolean; stripTrailingSlash?: boolean } = {
    stripTrailingSlash: true
  }
) {
  if (fileName == null || fileName.length === 0) return fileName

  let normalized = fileName.replace(pathNormalizeRegex, '/')

  const { addLeadingSlash, stripTrailingSlash } = {
    stripTrailingSlash: true,
    ...options
  }

  if (stripTrailingSlash) {
    normalized = normalized.replace(pathStripTrailingSlashRegex, emptyStr)
  }

  if (addLeadingSlash && normalized.charCodeAt(0) !== CharCode.Slash) {
    normalized = `/${normalized}`
  }

  if (isWindows) {
    // Ensure that drive casing is normalized (lower case)
    normalized = normalized.replace(
      driveLetterNormalizeRegex,
      (drive: string) => drive.toLowerCase()
    )
  }

  return normalized
}

export async function rev_parse__show_toplevel(
  cwd: string
): Promise<string | undefined> {
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
      let exists = await fsExists(cwd)
      if (!exists) {
        do {
          const parent = dirname(cwd)
          if (parent === cwd || parent.length === 0) return undefined

          cwd = parent
          exists = await fsExists(cwd)
        } while (!exists)

        return rev_parse__show_toplevel(cwd)
      }
    }
    return undefined
  }
}

const driveLetterRegex = /(?<=^\/?)([a-zA-Z])(?=:\/)/

export const getRepoPathCore = async (
  filePath: string,
  isDirectory: boolean
): Promise<string | undefined> => {
  //   const cc = Logger.getCorrelationContext()

  let repoPath: string | undefined
  try {
    const path = isDirectory ? filePath : dirname(filePath)

    repoPath = await rev_parse__show_toplevel(path)
    if (repoPath == null) return repoPath

    if (isWindows) {
      // On Git 2.25+ if you call `rev-parse --show-toplevel` on a mapped drive, instead of getting the mapped drive path back, you get the UNC path for the mapped drive.
      // So try to normalize it back to the mapped drive path, if possible

      const repoUri = Uri.file(repoPath)
      const pathUri = Uri.file(path)
      if (repoUri.authority.length !== 0 && pathUri.authority.length === 0) {
        const match = driveLetterRegex.exec(pathUri.path)
        if (match != null) {
          const [, letter] = match

          try {
            const networkPath = await new Promise<string | undefined>(resolve =>
              realpath.native(
                `${letter}:\\`,
                { encoding: 'utf8' },
                (err, resolvedPath) =>
                  resolve(err != null ? undefined : resolvedPath)
              )
            )
            if (networkPath != null) {
              repoPath = normalizePath(
                repoUri.fsPath.replace(
                  networkPath,
                  `${letter.toLowerCase()}:${
                    networkPath.endsWith('\\') ? '\\' : ''
                  }`
                )
              )
              return repoPath
            }
          } catch (e) {
            console.error(e)
          }
        }

        repoPath = normalizePath(pathUri.fsPath)
      }

      return repoPath
    }

    // If we are not on Windows (symlinks don't seem to have the same issue on Windows), check if we are a symlink and if so, use the symlink path (not its resolved path)
    // This is because VS Code will provide document Uris using the symlinked path
    repoPath = await new Promise<string | undefined>(resolve => {
      realpath(path, { encoding: 'utf8' }, (err, resolvedPath) => {
        if (err != null) {
          //   Logger.debug(cc, `fs.realpath failed; repoPath=${repoPath}`)
          resolve(repoPath)
          return
        }

        if (path.toLowerCase() === resolvedPath.toLowerCase()) {
          //   Logger.debug(cc, `No symlink detected; repoPath=${repoPath}`)
          resolve(repoPath)
          return
        }

        const linkPath = normalizePath(resolvedPath, {
          stripTrailingSlash: true
        })
        repoPath = repoPath?.replace(linkPath, path)
        // Logger.debug(
        //   cc,
        //   `Symlink detected; repoPath=${repoPath}, path=${path}, resolvedPath=${resolvedPath}`
        // )
        resolve(repoPath)
      })
    })

    return repoPath
  } catch (ex) {
    // Logger.error(ex, cc)
    repoPath = undefined
    return repoPath
  } finally {
    if (repoPath) {
      void ensureProperWorkspaceCasing(repoPath, filePath)
    }
  }
}

async function ensureProperWorkspaceCasing(repoPath: string, filePath: string) {
  filePath = filePath.replace(/\\/g, '/')

  let regexPath
  let testPath
  if (filePath > repoPath) {
    regexPath = filePath
    testPath = repoPath
  } else {
    testPath = filePath
    regexPath = repoPath
  }

  let pathRegex = new RegExp(`^${regexPath}`)
  if (!pathRegex.test(testPath)) {
    pathRegex = new RegExp(pathRegex, 'i')
    if (pathRegex.test(testPath)) {
      await showIncorrectWorkspaceCasingWarningMessage()
    }
  }
}

async function showIncorrectWorkspaceCasingWarningMessage(): Promise<void> {
  void (await window.showWarningMessage(
    'This workspace was opened with a different casing than what exists on disk. Please re-open this workspace with the exact casing as it exists on disk, otherwise you may experience issues with certain Git features, such as missing blame or history.'
  ))
}
