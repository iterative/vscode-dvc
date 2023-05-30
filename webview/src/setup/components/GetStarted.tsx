import React from 'react'
import { showWalkthrough } from './messages'
import { DvcNotSetup } from './shared/DvcNotSetup'
import { Button } from '../../shared/components/button/Button'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'

export const GetStarted: React.FC<{ isDvcSetup: boolean }> = ({
  isDvcSetup
}) => {
  if (!isDvcSetup) {
    return (
      <DvcNotSetup>
        <p>
          This extension&apos;s features cannot be accessed without DVC being
          installed.
        </p>
      </DvcNotSetup>
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
