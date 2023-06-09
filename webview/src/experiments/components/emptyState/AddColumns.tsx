import React from 'react'
import { StartButton } from '../../../shared/components/button/StartButton'
import { selectColumns } from '../../util/messages'

export const AddColumns: React.FC = () => (
  <div>
    <p>No Columns Selected.</p>
    <StartButton onClick={selectColumns} text="Add Columns" />
  </div>
)
