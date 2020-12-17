import * as vscode from 'vscode'

export function runExperiment(): void {
  const terminal = vscode.window.createTerminal('DVC')
  terminal.sendText('dvc exp run')
  terminal.show()
}
