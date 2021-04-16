import { Config } from '../Config'
import { Commands } from './commands'
import { getProcessEnv } from '../env'
import { PseudoTerminal } from '../PseudoTerminal'
import { spawn } from 'child_process'

const getPATH = (existingPath: string, pythonBinPath?: string): string => {
  if (!pythonBinPath) {
    return existingPath
  }
  if (!existingPath) {
    return pythonBinPath
  }

  return [pythonBinPath, existingPath].join(':')
}

const getEnv = (config: Config): NodeJS.ProcessEnv => {
  const env = getProcessEnv()
  const existingPath = (env?.PATH as string) || ''
  const PATH = getPATH(existingPath, config.pythonBinPath)
  return {
    ...env,
    PATH
  }
}

interface cliExecutionDetails {
  cwd: string
  env: NodeJS.ProcessEnv
  executionCommand: string
  outputCommand: string
}

export const getExecutionDetails = (
  config: Config,
  command: Commands,
  cwd: string
): cliExecutionDetails => {
  const cliPath = config.dvcPath || 'dvc'
  const env = getEnv(config)
  return {
    cwd,
    env,
    executionCommand: `${cliPath} ${command}`,
    outputCommand: `dvc ${command}`
  }
}

export const run = async (
  executionDetails: cliExecutionDetails,
  pseudoTerminal: PseudoTerminal
): Promise<void> =>
  new Promise(resolve => {
    const { cwd, env, executionCommand, outputCommand } = executionDetails
    pseudoTerminal.openCurrentInstance().then(() => {
      pseudoTerminal.writeEmitter.fire(`${outputCommand}\r\n`)

      const stream = spawn(`${executionCommand}`, {
        cwd,
        env,
        shell: true
      })

      stream.stdout?.on('data', stdout => {
        const output = stdout
          .toString()
          .split(/(\r?\n)/g)
          .join('\r')
        pseudoTerminal.writeEmitter.fire(output)
      })

      stream.stderr?.on('data', stdout => {
        const output = stdout
          .toString()
          .split(/(\r?\n)/g)
          .join('\r')
        pseudoTerminal.writeEmitter.fire(output)
      })

      stream.on('close', () => {
        pseudoTerminal.writeEmitter.fire(
          '\r\nTerminal will be reused by DVC, press any key to close it\r\n\n'
        )
        resolve()
      })
    })
  })
