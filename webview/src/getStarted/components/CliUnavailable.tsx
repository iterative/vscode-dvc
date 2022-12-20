import React from 'react'
import { Button } from '../../shared/components/button/Button'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'

export type CliUnavailableProps = {
  installDvc: () => void
  isPythonExtensionInstalled: boolean
  pythonBinPath: string | undefined
  selectPythonInterpreter: () => void
  setupWorkspace: () => void
}

const CanInstall: React.FC<{
  children: React.ReactNode
  pythonBinPath: string
  installDvc: () => void
}> = ({ installDvc, pythonBinPath, children }) => (
  <div>
    <p>
      {`DVC & DVCLive can be auto-installed as packages with ${pythonBinPath}`}
    </p>
    <Button onClick={installDvc} text="Install" />
    {children}
  </div>
)

export const CliUnavailable: React.FC<CliUnavailableProps> = ({
  installDvc,
  isPythonExtensionInstalled,
  pythonBinPath,
  selectPythonInterpreter,
  setupWorkspace
}) => {
  if (!pythonBinPath) {
    return (
      <EmptyState>
        <div>
          <h1>DVC is currently unavailable</h1>
          <p>
            DVC & DVCLive cannot be auto-installed as Python was not located.
          </p>
          <p>To locate a Python Interpreter or DVC</p>
          <Button onClick={setupWorkspace} text="Setup The Workspace" />
        </div>
      </EmptyState>
    )
  }

  return (
    <EmptyState>
      <div>
        <h1>DVC is currently unavailable</h1>
        <CanInstall pythonBinPath={pythonBinPath} installDvc={installDvc}>
          {isPythonExtensionInstalled ? (
            <div>
              <p>To update the interpreter and/or locate DVC</p>
              <Button
                onClick={selectPythonInterpreter}
                text="Select Python Interpreter"
              />
            </div>
          ) : (
            <div>
              <p>To update the install location or locate DVC</p>
              <Button onClick={setupWorkspace} text="Setup The Workspace" />
            </div>
          )}
        </CanInstall>
      </div>
    </EmptyState>
  )
}
