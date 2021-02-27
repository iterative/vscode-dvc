import { accessSync } from 'fs'
import * as path from 'path'
import { execPromise } from './util'
import { ExperimentsRepoJSONOutput } from './webviews/experiments/contract'
export interface ReaderOptions {
  bin: string
  cwd: string
}

export const inferDefaultOptions: (
  cwd: string
) => Promise<ReaderOptions> = async cwd => {
  const envDvcPath = path.resolve(cwd, '.env', 'bin', 'dvc')
  let bin
  try {
    accessSync(envDvcPath)
    bin = envDvcPath
  } catch (e) {
    bin = 'dvc'
  }
  return {
    bin,
    cwd
  }
}

const execCommand: (
  options: ReaderOptions,
  command: string
) => Promise<{ stdout: string; stderr: string }> = ({ bin, cwd }, command) =>
  execPromise(`${bin} ${command}`, {
    cwd
  })

export const getExperiments: (
  options: ReaderOptions
) => Promise<ExperimentsRepoJSONOutput> = async options => {
  const output = await execCommand(options, 'exp show --show-json')
  const { stdout } = output
  return JSON.parse(String(stdout))
}
