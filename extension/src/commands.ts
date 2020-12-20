// REMOVE
/* eslint-disable */

import * as vscode from 'vscode'
import * as cp from 'child_process'

let _channel: vscode.OutputChannel

function getOutputChannel(): vscode.OutputChannel {
  if (!_channel) {
    _channel = vscode.window.createOutputChannel('DVC')
  }
  return _channel
}

function exec(
  command: string,
  options: cp.ExecOptions
): Promise<{ stdout: string; stderr: string }> {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    cp.exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stdout, stderr })
      }
      resolve({ stdout, stderr })
    })
  })
}

export async function runCommand(command: string, callback: Function) {
  if (!vscode.workspace.workspaceFolders) {
    return
  }
  const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath
  const channel = getOutputChannel()
  try {
    const { stdout, stderr } = await exec(command, { cwd: workspaceFolder })
    if (stderr && stderr.length > 0) {
      channel.appendLine(stderr)
      channel.show(true)
    }
    if (stdout) {
      const lines = stdout.split(/\r{0,1}\n/)
      for (const line of lines) {
        channel.appendLine(line)
      }
    }
  } catch (err) {
    if (err.stderr) {
      channel.appendLine(err.stderr)
    }
    if (err.stdout) {
      channel.appendLine(err.stdout)
    }
    channel.appendLine(`Command: '${command}' failed.`)
    channel.show(true)
  }
  callback()
}
