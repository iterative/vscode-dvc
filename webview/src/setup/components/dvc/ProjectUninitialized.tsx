import React, { PropsWithChildren } from 'react'
import { useSelector } from 'react-redux'
import { GitUninitialized } from './GitUnitialized'
import { DvcUninitialized } from './DvcUnitialized'
import { SetupState } from '../../store'

export const ProjectUninitialized: React.FC<PropsWithChildren> = ({
  children
}) => {
  const needsGitInitialized = useSelector(
    (state: SetupState) => state.dvc.needsGitInitialized
  )

  if (needsGitInitialized) {
    return <GitUninitialized>{children}</GitUninitialized>
  }

  return <DvcUninitialized>{children}</DvcUninitialized>
}
