import * as vscode from 'vscode'
import * as cp from 'child_process'

let _channel: vscode.OutputChannel

function getOutputChannel(): vscode.OutputChannel {
  if (!_channel) {
    _channel = vscode.window.createOutputChannel('DVC')
  }
  return _channel
}

async function execute(
  command: string,
  options: cp.ExecOptions
): Promise<{ stdout: string; stderr: string }> {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    cp.exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr))
      }
      resolve({ stdout, stderr })
    })
  })
}

export async function runCommand(command: string) {
  const { workspaceFolders } = vscode.workspace
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return
  }
  const workspaceFolder = workspaceFolders[0].uri.fsPath
  const channel = getOutputChannel()
  try {
    const { stdout, stderr } = await execute(command, {
      cwd: workspaceFolder
    })
    if (stderr && stderr.length > 0) {
      channel.appendLine(stderr)
      channel.show(true)
    }
    if (stdout) {
      channel.appendLine(stdout)
    }
  } catch (err) {
    if (err.stderr) {
      channel.appendLine(err.stderr)
    }
    if (err.stdout) {
      channel.appendLine(err.stdout)
    }
    channel.show(true)
  }
}
