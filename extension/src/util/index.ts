import { promisify } from 'util'
import { exec } from 'child_process'

export const execPromise = promisify(exec)

export const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms))

export const trimAndSplit = (stdout: string): string[] =>
  stdout
    .trim()
    .split('\n')
    .filter(i => i)
