import React from 'react'
import { Button } from '../../shared/components/button/Button'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'

const Title: React.FC = () => <h1>DVC is currently unavailable</h1>

export type CliUnavailableProps = {
  installDvc: () => void
  isPythonExtensionInstalled: boolean
  pythonBinPath: string | undefined
  selectPythonInterpreter: () => void
  setupWorkspace: () => void
}

const OfferToInstall: React.FC<{
  children: React.ReactNode
  pythonBinPath: string
  installDvc: () => void
}> = ({ installDvc, pythonBinPath, children }) => (
  <div>
    <p>DVC & DVCLive can be auto-installed as packages with {pythonBinPath}</p>
    <Button onClick={installDvc} text="Install" />
    {children}
  </div>
)

const UpdateInterpreterOrFind: React.FC<{
  action: string
  description: string
  onClick: () => void
}> = ({ action, description, onClick }) => (
  <div>
    <p>{description}</p>
    <Button onClick={onClick} text={action} />
  </div>
)

export const CliUnavailable: React.FC<CliUnavailableProps> = ({
  installDvc,
  isPythonExtensionInstalled,
  pythonBinPath,
  selectPythonInterpreter,
  setupWorkspace
}) => {
  const SetupWorkspace: React.FC<{ description: string }> = ({
    description
  }) => (
    <UpdateInterpreterOrFind
      description={description}
      action="Setup The Workspace"
      onClick={setupWorkspace}
    />
  )

  const canInstall = !!pythonBinPath

  if (!canInstall) {
    return (
      <EmptyState isFullScreen={false}>
        <Title />
        <p>DVC & DVCLive cannot be auto-installed as Python was not located.</p>
        <SetupWorkspace description="To locate a Python Interpreter or DVC." />
      </EmptyState>
    )
  }

  return (
    <EmptyState isFullScreen={false}>
      <Title />
      <OfferToInstall pythonBinPath={pythonBinPath} installDvc={installDvc}>
        {isPythonExtensionInstalled ? (
          <UpdateInterpreterOrFind
            action="Select Python Interpreter"
            description="To update the interpreter and/or locate DVC."
            onClick={selectPythonInterpreter}
          />
        ) : (
          <SetupWorkspace description="To update the install location or locate DVC." />
        )}
      </OfferToInstall>
    </EmptyState>
  )
}
