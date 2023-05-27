import React from 'react'
import { showWalkthrough } from './messages'
import { CliIncompatible } from './shared/CliIncompatible'
import { Button } from '../../shared/components/button/Button'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'

export const GetStarted: React.FC<{ cliCompatible: boolean | undefined }> = ({
  cliCompatible
}) => {
  if (!cliCompatible) {
    return (
      <CliIncompatible>
        <p>
          This extension&apos;s features cannot be accessed without DVC being
          installed.
        </p>
      </CliIncompatible>
    )
  }

  return (
    <EmptyState isFullScreen={false}>
      <h1>Get Started</h1>
      <p>
        New to the extension? Go through the walkthrough to familiarize yourself
        with the different features.
      </p>
      <Button onClick={showWalkthrough} text="Show Walkthrough" />
    </EmptyState>
  )
}
