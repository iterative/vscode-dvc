import { promisify } from 'util'
import { exec } from 'child_process'
import { FileType } from 'vscode'
import { lstatSync } from 'fs'

export const execPromise = promisify(exec)

export const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms))

export const execDvcCmd = (cmd: string): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    exec(cmd, (err, out) => {
      if (err) {
        return reject(err)
      }
      return resolve(out)
    })
  })
}

export const isDirOrFile = (path: string): FileType => {
  try {
    const stat = lstatSync(path)
    if (stat.isDirectory()) {
      return FileType.Directory
    }
    return FileType.File
  } catch (e) {
    return FileType.File
  }
}
