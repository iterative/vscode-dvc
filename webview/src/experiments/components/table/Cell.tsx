import React from 'react'
import cx from 'classnames'
import { ErrorTooltip } from './Errors'
import { IndicatorWithJustTheCounter } from './Indicators'
import styles from './styles.module.scss'
import { CellProp, RowProp } from './interfaces'
import { CellRowActionsProps, CellRowActions } from './CellRowActions'
import { clickAndEnterProps } from '../../../util/props'
import { Clock } from '../../../shared/components/icons'
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

export const FirstCell: React.FC<
  CellProp &
    CellRowActionsProps & {
      bulletColor?: string
      toggleExperiment: () => void
    }
> = ({ cell, bulletColor, toggleExperiment, ...rowActionsProps }) => {
  const { row, isPlaceholder } = cell
  const {
    original: { error, queued }
  } = row

  const {
    subRowStates: { plotSelections }
  } = rowActionsProps

  return (
    <div
      {...cell.getCellProps({
        className: cx(
          styles.td,
          styles.experimentCell,
          isPlaceholder && styles.groupPlaceholder
        )
      })}
    >
      <div className={styles.innerCell}>
        <CellRowActions {...rowActionsProps} />
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
          {queued && <Clock />}
        </span>
        {isPlaceholder ? null : (
          <ErrorTooltip error={error}>
            <div
              className={cx(styles.cellContents, error && styles.error)}
              {...clickAndEnterProps(toggleExperiment)}
            >
              {cell.render('Cell')}
            </div>
          </ErrorTooltip>
        )}
      </div>
    </div>
  )
}

export const CellWrapper: React.FC<
  CellProp & {
    error?: string
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
