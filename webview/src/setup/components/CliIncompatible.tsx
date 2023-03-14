import React from 'react'
import { MIN_CLI_VERSION } from 'dvc/src/cli/dvc/contract'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { Button } from '../../shared/components/button/Button'

type CliIncompatibleProps = { checkCompatibility: () => void }

export const CliIncompatible: React.FC<CliIncompatibleProps> = ({
  checkCompatibility
}) => (
  <EmptyState isFullScreen={false}>
    <div>
      <h1>DVC is incompatible</h1>
      <p>The located CLI is incompatible with the extension.</p>
      <p>The minimum version is {MIN_CLI_VERSION}.</p>
      <p>Please update your install and try again.</p>
      <Button text="Check Compatibility" onClick={checkCompatibility} />
    </div>
  </EmptyState>
)
