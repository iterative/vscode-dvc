import React, { PropsWithChildren } from 'react'
import { useSelector } from 'react-redux'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { Button } from '../../../shared/components/button/Button'
import { SetupState } from '../../store'
import { initializeGit } from '../../util/messages'

export const GitUninitialized: React.FC<PropsWithChildren> = ({ children }) => {
  const canGitInitialize = useSelector(
    (state: SetupState) => state.dvc.canGitInitialize
  )

  const startingSentence =
    'A Git repository is a prerequisite of project initialization.'

  const conditionalContent = canGitInitialize ? (
    <>
      <p>{startingSentence}</p>
      <Button onClick={initializeGit} text="Initialize Git" />
    </>
  ) : (
    <p>
      {startingSentence} Please open a different folder which contains no Git
      repositories or a single existing Git repository at the root.
    </p>
  )

  return (
    <EmptyState isFullScreen={false}>
      <h1>DVC is not initialized</h1>
      {children}
      {conditionalContent}
    </EmptyState>
  )
}
