import { accessSync } from 'fs'
import * as path from 'path'
import { execPromise } from './util'

export interface ReaderOptions {
  bin: string
  cwd: string
}

export interface DataDict {
  [name: string]: string | number | DataDict
}
export interface DataDictRoot {
  [filename: string]: DataDict
}

export interface ExperimentJSONOutput {
  name?: string
  timestamp?: string | Date | null
  params?: DataDictRoot
  metrics?: DataDictRoot
  queued?: boolean
  checkpoint_tip?: string
  checkpoint_parent?: string
}

export interface ExperimentsCommitJSONOutput
  extends Record<string, ExperimentJSONOutput> {
  baseline: ExperimentJSONOutput
}

export interface ExperimentsRepoJSONOutput
  extends Record<string, ExperimentsCommitJSONOutput> {
  workspace: ExperimentsCommitJSONOutput
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

export const runExperiment: (
  options: ReaderOptions
) => Promise<string> = async options => {
  const output = await execCommand(options, 'exp run -v')
  const { stdout } = output
  return stdout
}
