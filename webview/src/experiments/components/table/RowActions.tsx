import React, { FC, ReactElement } from 'react'
import cx from 'classnames'
import { VSCodeCheckbox } from '@vscode/webview-ui-toolkit/react'
import { Indicator } from './Indicators'
import styles from './styles.module.scss'
import { onClickOrEnter } from '../../../util/props'
import { StarFull, StarEmpty } from '../../../shared/components/icons'
import { pluralize } from '../../../util/strings'

interface RowToggle {
  checked?: boolean
  showSubRowsIndicator: boolean
  subRowsChecked: number
  toggleAction: () => void
}

export type RowActionsProps = {
  rowSelection: RowToggle
  experimentStar: RowToggle
  showSubRowStates: boolean
  subRowStates: {
    plotSelections: number
  }
}

export type RowActionProps = {
  subRowsChecked: number
  showSubRowsIndicator: boolean
  actionAppliedLabel: string
  children: ReactElement
  hidden?: boolean
  testId?: string
}

interface SubRowsIndicatorProps {
  showSubRowsIndicator: boolean
  subRowsChecked: number
  actionAppliedLabel: string
  children: React.ReactElement
}

const indicatorLabel = (count: number, label: string) =>
  count && `${count} ${pluralize('sub-row', count)} ${label}.`

const SubRowsIndicator: FC<SubRowsIndicatorProps> = ({
  showSubRowsIndicator,
  subRowsChecked,
  actionAppliedLabel,
  children
}) => (
  <Indicator
    count={(showSubRowsIndicator && subRowsChecked) || 0}
    tooltipContent={indicatorLabel(subRowsChecked, actionAppliedLabel)}
  >
    {children}
  </Indicator>
)

const RowAction: FC<RowActionProps> = ({ hidden, testId, ...otherProps }) => (
  <div
    className={cx(styles.rowActions, hidden && styles.hidden)}
    data-testid={testId}
  >
    <SubRowsIndicator {...otherProps} />
  </div>
)

interface StarToggleProps {
  starred?: boolean
  toggleStarred: () => void
}

const StarToggle: FC<StarToggleProps> = ({ starred, toggleStarred }) => (
  <div
    className={styles.starSwitch}
    role="switch"
    aria-checked={starred}
    {...onClickOrEnter(toggleStarred)}
    data-testid="star-icon"
  >
    {starred ? <StarFull /> : <StarEmpty />}
  </div>
)

const rowToggleConstants = {
  SELECTIONS: {
    actionAppliedLabel: 'selected',
    testId: 'row-action-checkbox'
  },
  STARS: {
    actionAppliedLabel: 'starred',
    testId: 'row-action-star'
  }
}

const RowSelectionToggle: FC<RowToggle> = ({
  toggleAction,
  checked,
  ...otherProps
}) => {
  return (
    <RowAction {...rowToggleConstants.SELECTIONS} {...otherProps}>
      <VSCodeCheckbox {...onClickOrEnter(toggleAction)} checked={checked} />
    </RowAction>
  )
}

const RowStarToggle: FC<RowToggle> = ({
  toggleAction,
  checked,
  ...otherProps
}) => (
  <RowAction {...rowToggleConstants.STARS} {...otherProps}>
    <StarToggle starred={checked} toggleStarred={toggleAction} />
  </RowAction>
)

export const RowActions: FC<RowActionsProps> = ({
  rowSelection,
  experimentStar
}) => (
  <>
    <RowSelectionToggle {...rowSelection} />
    <RowStarToggle {...experimentStar} />
  </>
)
