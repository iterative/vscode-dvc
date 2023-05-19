import React from 'react'
import { showWalkthrough } from './messages'
import { Button } from '../../shared/components/button/Button'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'

export const GetStarted: React.FC = () => {
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
