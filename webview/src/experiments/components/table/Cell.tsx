import React from 'react'
import { useInView } from 'react-intersection-observer'
import cx from 'classnames'
import { VSCodeCheckbox } from '@vscode/webview-ui-toolkit/react'
import { Indicator, IndicatorWithJustTheCounter } from './Indicators'
import styles from './styles.module.scss'
import { CellProp, WithTableRoot, RowProp } from './interfaces'
import ClockIcon from '../../../shared/components/icons/Clock'
import { clickAndEnterProps } from '../../../util/props'
import { StarFull, StarEmpty } from '../../../shared/components/icons'
import { pluralize } from '../../../util/strings'
import { cellHasChanges } from '../../util/buildDynamicColumns'

const RowExpansionButton: React.FC<RowProp> = ({ row }) =>
  row.canExpand ? (
    <button
      title={`${row.isExpanded ? 'Contract' : 'Expand'} Row`}
      className={styles.rowArrowContainer}
      onClick={e => {
        e.preventDefault()
        e.stopPropagation()
        row.toggleRowExpanded()
      }}
      onKeyDown={e => {
        e.stopPropagation()
      }}
    >
      <span
        className={
          row.isExpanded ? styles.expandedRowArrow : styles.contractedRowArrow
        }
      />
    </button>
  ) : (
    <span className={styles.rowArrowContainer} />
  )

export type RowActionsProps = {
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

export type RowActionProps = {
  showSubRowStates: boolean
  subRowsAffected: number
  actionAppliedLabel: string
  children: React.ReactElement
  hidden?: boolean
  testId?: string
}

export const RowAction: React.FC<RowActionProps> = ({
  showSubRowStates,
  subRowsAffected,
  actionAppliedLabel,
  children,
  hidden,
  testId
}) => {
  const count = (showSubRowStates && subRowsAffected) || 0

  return (
    <div
      className={cx(styles.rowActions, hidden && styles.hidden)}
      data-testid={testId}
    >
      <Indicator
        count={count}
        tooltipContent={
          count &&
          `${count} ${pluralize('sub-row', count)} ${actionAppliedLabel}.`
        }
      >
        {children}
      </Indicator>
    </div>
  )
}

export const RowActions: React.FC<RowActionsProps> = ({
  isRowSelected,
  showSubRowStates,
  starred,
  subRowStates: { selections, stars },
  toggleRowSelection,
  toggleStarred
}) => {
  return (
    <>
      <RowAction
        showSubRowStates={showSubRowStates}
        subRowsAffected={selections}
        actionAppliedLabel={'selected'}
        testId={'row-action-checkbox'}
      >
        <VSCodeCheckbox
          {...clickAndEnterProps(toggleRowSelection)}
          checked={isRowSelected}
        />
      </RowAction>
      <RowAction
        showSubRowStates={showSubRowStates}
        subRowsAffected={stars}
        actionAppliedLabel={'starred'}
        testId={'row-action-star'}
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
      </RowAction>
    </>
  )
}

export const FirstCell: React.FC<
  CellProp &
    RowActionsProps &
    WithTableRoot & {
      bulletColor?: string
      toggleExperiment: () => void
      isRowSelected: boolean
      toggleRowSelection: () => void
      toggleStarred: () => void
    }
> = ({ cell, bulletColor, toggleExperiment, root, ...rowActionsProps }) => {
  const { row, isPlaceholder } = cell
  const {
    original: { queued }
  } = row
  const {
    subRowStates: { plotSelections }
  } = rowActionsProps

  const [ref, needsShadow] = useInView({
    root,
    rootMargin: '0px 0px 0px -15px',
    threshold: 1
  })

  return (
    <div
      ref={ref}
      {...cell.getCellProps({
        className: cx(
          styles.td,
          styles.experimentCell,
          isPlaceholder && styles.groupPlaceholder,
          needsShadow && styles.withExpCellShadow
        )
      })}
    >
      <div className={styles.innerCell}>
        <RowActions {...rowActionsProps} />
        <RowExpansionButton row={row} />
        <span
          className={styles.bullet}
          style={{ color: bulletColor }}
          {...clickAndEnterProps(toggleExperiment)}
        >
          <IndicatorWithJustTheCounter
            aria-label={'Sub-rows selected for plots'}
            count={plotSelections}
            tooltipContent={`${plotSelections} ${pluralize(
              'sub-row',
              plotSelections
            )} selected for plots.`}
          />
          {queued && <ClockIcon />}
        </span>
        {isPlaceholder ? null : (
          <div
            className={styles.cellContents}
            {...clickAndEnterProps(toggleExperiment)}
          >
            {cell.render('Cell')}
          </div>
        )}
      </div>
    </div>
  )
}

export const CellWrapper: React.FC<
  CellProp & {
    changes?: string[]
    cellId: string
    children?: React.ReactNode
  }
> = ({ cell, cellId, changes }) => {
  return (
    <div
      {...cell.getCellProps({
        className: cx(styles.td, {
          [styles.workspaceChange]: changes?.includes(cell.column.id),
          [styles.depChange]: cellHasChanges(cell.value),
          [styles.groupPlaceholder]: cell.isPlaceholder
        })
      })}
      data-testid={cellId}
    >
      {cell.render('Cell')}
    </div>
  )
}
