import React from 'react'
import cx from 'classnames'
import { VSCodeCheckbox } from '@vscode/webview-ui-toolkit/react'
import { Indicator } from './Indicators'
import styles from './styles.module.scss'
import { CellHintTooltip } from './CellHintTooltip'
import { clickAndEnterProps } from '../../../util/props'
import { StarFull, StarEmpty } from '../../../shared/components/icons'

export type CellRowActionsProps = {
  isRowSelected: boolean
  showSubRowStates: boolean
  starred?: boolean
  subRowStates: {
    selections: number
    stars: number
    plotSelections: number
  }
  toggleRowSelection: () => void
  toggleStarred: () => void
}

export type CellRowActionProps = {
  showSubRowStates: boolean
  subRowsAffected: number
  children: React.ReactElement
  hidden?: boolean
  testId?: string
  tooltipContent: string
}

export const CellRowAction: React.FC<CellRowActionProps> = ({
  showSubRowStates,
  subRowsAffected,
  children,
  hidden,
  testId,
  tooltipContent
}) => {
  const count = (showSubRowStates && subRowsAffected) || 0

  return (
    <CellHintTooltip tooltipContent={tooltipContent}>
      <div
        className={cx(styles.rowActions, hidden && styles.hidden)}
        data-testid={testId}
      >
        <Indicator tooltipContent="" count={count}>
          {children}
        </Indicator>
      </div>
    </CellHintTooltip>
  )
}

export const CellRowActions: React.FC<CellRowActionsProps> = ({
  isRowSelected,
  showSubRowStates,
  starred,
  subRowStates: { selections, stars },
  toggleRowSelection,
  toggleStarred
}) => {
  return (
    <>
      <CellRowAction
        showSubRowStates={showSubRowStates}
        subRowsAffected={selections}
        testId={'row-action-checkbox'}
        tooltipContent={isRowSelected ? 'Unselect' : 'Select'}
      >
        <VSCodeCheckbox
          {...clickAndEnterProps(toggleRowSelection)}
          checked={isRowSelected}
        />
      </CellRowAction>
      <CellRowAction
        showSubRowStates={showSubRowStates}
        subRowsAffected={stars}
        testId={'row-action-star'}
        tooltipContent={starred ? 'Star' : 'Unstar'}
      >
        <div
          className={styles.starSwitch}
          role="switch"
          aria-checked={starred}
          tabIndex={0}
          {...clickAndEnterProps(toggleStarred)}
          data-testid="star-icon"
        >
          {starred && <StarFull />}
          {!starred && <StarEmpty />}
        </div>
      </CellRowAction>
    </>
  )
}
