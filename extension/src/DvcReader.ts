import { accessSync } from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'
import { execPromise } from './util'

interface DVCExtensionOptions {
  bin: string
  cwd: string
}

export interface DataFileDict {
  [name: string]: string | number | DataFileDict
}
export interface DataFilesDict {
  [filename: string]: DataFileDict
}
export interface DVCExperiment {
  name?: string
  timestamp?: Date
  params?: DataFilesDict
  metrics?: DataFilesDict
  queued?: boolean
  checkpoint_tip?: string
  checkpoint_parent?: string
}
export interface DVCExperimentWithSha extends DVCExperiment {
  sha: string
}

type DVCCommitId = 'workspace' | string
interface DVCExperimentsCommitJSONOutput extends Record<string, DVCExperiment> {
  baseline: DVCExperiment
}

export type DVCExperimentsRepoJSONOutput = Record<
  DVCCommitId,
  DVCExperimentsCommitJSONOutput
>

let _channel: vscode.OutputChannel
function getOutputChannel(): vscode.OutputChannel {
  if (!_channel) {
    _channel = vscode.window.createOutputChannel('DVC')
  }
  return _channel
}

export const inferDefaultOptions: (
  cwd: string
) => Promise<DVCExtensionOptions> = async cwd => {
  const envDvcPath = path.resolve(cwd || '.', '.env', 'bin', 'dvc')
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
  options: DVCExtensionOptions,
  command: string
) => Promise<{ stdout: string; stderr: string }> = ({ bin, cwd }, command) =>
  execPromise(`${bin} ${command}`, {
    cwd
  })

export const getExperiments: (
  options: DVCExtensionOptions
) => Promise<DVCExperimentsRepoJSONOutput> = async options => {
  const output = await execCommand(options, 'exp show --show-json')
  const { stdout } = output
  return JSON.parse(String(stdout))
}

export async function runExperiment(options: DVCExtensionOptions) {
  const { stdout, stderr } = await execCommand(options, 'exp run -v')
  if (stdout) {
    getOutputChannel().append(stdout)
  }
  if (stderr) {
    getOutputChannel().append(stderr)
  }
}
