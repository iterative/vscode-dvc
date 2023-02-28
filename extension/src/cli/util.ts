import { EventEmitter } from 'vscode'
import { CliEvent, CliResult } from '.'
import { Process } from '../process/execution'

export const notifyStarted = (
  baseEvent: CliEvent,
  processStarted: EventEmitter<CliEvent>
): void => processStarted.fire(baseEvent)

export const notifyOutput = (
  process: Process,
  processOutput: EventEmitter<string>
): void => {
  process.all?.on('data', chunk =>
    processOutput.fire(
      (chunk as Buffer)
        .toString()
        .split(/(\r?\n)/g)
        .join('\r')
    )
  )
}

export const notifyCompleted = (
  { command, pid, cwd, duration, exitCode, stderr }: CliResult,
  processCompleted: EventEmitter<CliResult>
): void =>
  processCompleted.fire({
    command,
    cwd,
    duration,
    exitCode,
    pid,
    stderr: stderr?.replace(/\n+/g, '\n')
  })

export const captureStdErr = (process: Process): string => {
  let stderr = ''
  process.stderr?.on('data', chunk => (stderr += (chunk as Buffer).toString()))
  return stderr
}
