import { accessSync } from 'fs'
import { resolve } from 'path'
import { execPromise } from './util'
import { ExperimentsRepoJSONOutput } from './webviews/experiments/contract'
export interface ReaderOptions {
  bin: string
  cwd: string
}

export const inferDefaultOptions = async (
  cwd: string,
  dvcPath = 'dvc'
): Promise<ReaderOptions> => {
  const envDvcPath = resolve(cwd, dvcPath)
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
  const { stdout } = await execCommand(options, 'exp show --show-json')
  return JSON.parse(stdout)
}
