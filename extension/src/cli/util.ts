import { EventEmitter } from 'vscode'
import { CliEvent, CliResult } from '.'
import { Process } from '../process/execution'

export const notifyStarted = (
  baseEvent: CliEvent,
  processStarted: EventEmitter<CliEvent>
): void => processStarted.fire(baseEvent)

export const transformChunkToString = (chunk: Buffer): string =>
  chunk
    .toString()
    .split(/(\r?\n)/g)
    .join('\r')

export const notifyOutput = (
  process: Process,
  processOutput: EventEmitter<string>
): void => {
  process.all?.on('data', chunk =>
    processOutput.fire(transformChunkToString(chunk as Buffer))
  )
}

export const notifyCompleted = (
  { command, pid, cwd, duration, exitCode, errorOutput: stderr }: CliResult,
  processCompleted: EventEmitter<CliResult>
): void =>
  processCompleted.fire({
    command,
    cwd,
    duration,
    errorOutput: stderr?.replace(/\n+/g, '\n'),
    exitCode,
    pid
  })

export const captureStdErr = (process: Process): string => {
  let stderr = ''
  process.stderr?.on('data', chunk => (stderr += (chunk as Buffer).toString()))
  return stderr
}
