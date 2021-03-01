import { accessSync } from 'fs'
import { resolve } from 'path'
import { execPromise } from './util'
import { ExperimentsRepoJSONOutput } from './webviews/experiments/contract'
export interface ReaderOptions {
  bin: string
  cwd: string
}

export const inferDefaultOptions: (
  cwd: string
) => Promise<ReaderOptions> = cwd => {
  const envDvcPath = resolve(cwd, '.env', 'bin', 'dvc')
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
  const parsedData = JSON.parse(String(output.stdout)) as unknown
  const parsedDataType = typeof parsedData
  if (parsedDataType !== 'object')
    throw new Error(
      `Parsed DVC experiment data is not an object! (was "${parsedDataType}")`
    )

  return parsedData as ExperimentsRepoJSONOutput
}
