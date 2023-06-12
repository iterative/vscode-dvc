import React from 'react'
import { Welcome } from './Welcome'
import { AddColumns } from './AddColumns'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'

export const GetStarted: React.FC<{ showWelcome: boolean }> = ({
  showWelcome
}) => <EmptyState>{showWelcome ? <Welcome /> : <AddColumns />}</EmptyState>
