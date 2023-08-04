import React from 'react'
import { useSelector } from 'react-redux'
import { selectColumns, toggleShowOnlyChanged } from '../../util/messages'
import { ExperimentsState } from '../../store'
import { StartButton } from '../../../shared/components/button/StartButton'
import { IconButton } from '../../../shared/components/button/IconButton'
import { Close } from '../../../shared/components/icons'

export const AddColumns: React.FC = () => {
  const showOnlyChanged = useSelector(
    (state: ExperimentsState) => state.tableData.showOnlyChanged
  )
  return (
    <div>
      <p>No Columns Selected.</p>
      <StartButton onClick={selectColumns} text="Add Columns" />
      {showOnlyChanged && (
        <IconButton
          icon={Close}
          appearance="secondary"
          isNested={true}
          onClick={toggleShowOnlyChanged}
          text="Disable Only Changed"
        />
      )}
    </div>
  )
}
