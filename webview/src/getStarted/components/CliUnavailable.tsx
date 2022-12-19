import React from 'react'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { Button } from '../../shared/components/button/Button'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { sendMessage } from '../../shared/vscode'

export type CliUnavailableProps = {
  isPythonExtensionUsed: boolean
  pythonBinPath: string | undefined
}

const PythonExtensionUsed: React.FC<{ pythonBinPath: string }> = ({
  pythonBinPath
}) => (
  <div>
    <p>
      {`DVC & DVCLive can be auto-installed as packages with ${pythonBinPath}`}
    </p>
    <Button
      onClick={() => sendMessage({ type: MessageFromWebviewType.INSTALL_DVC })}
      text="Install"
    />
    <p>To update the interpreter and/or locate DVC</p>
    <Button
      onClick={() =>
        sendMessage({ type: MessageFromWebviewType.SELECT_PYTHON_INTERPRETER })
      }
      text="Select Python Interpreter"
    />
  </div>
)

const PythonBinFound: React.FC<{ pythonBinPath: string }> = ({
  pythonBinPath
}) => (
  <div>
    <p>
      {`DVC & DVCLive can be auto-installed as packages with ${pythonBinPath}`}
    </p>
    <Button
      onClick={() => sendMessage({ type: MessageFromWebviewType.INSTALL_DVC })}
      text="Install"
    />
    <p>To update the install location or locate DVC</p>
    <Button onClick={() => undefined} text="Setup The Workspace" />
  </div>
)

const PythonBinNotFound: React.FC = () => (
  <div>
    <p>DVC & DVCLive cannot be auto-installed as Python was not located.</p>
    <p>To locate a Python Interpreter or DVC</p>
    <Button onClick={() => undefined} text="Setup The Workspace" />
  </div>
)

export const CliUnavailable: React.FC<CliUnavailableProps> = ({
  isPythonExtensionUsed,
  pythonBinPath
}) => {
  return (
    <EmptyState>
      <div>
        <h1>DVC is currently unavailable</h1>
        {isPythonExtensionUsed ? (
          <PythonExtensionUsed pythonBinPath={pythonBinPath as string} />
        ) : (
          (pythonBinPath && (
            <PythonBinFound pythonBinPath={pythonBinPath} />
          )) || <PythonBinNotFound />
        )}
      </div>
    </EmptyState>
  )
}
