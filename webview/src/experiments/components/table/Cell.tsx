import React, { FC } from 'react'
import cx from 'classnames'
import { Cell } from 'react-table'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import { ErrorTooltip } from './Errors'
import { IndicatorWithJustTheCounter } from './Indicators'
import styles from './styles.module.scss'
import { CellProp } from './interfaces'
import { RowExpansionButton } from './RowExpansionButton'
import { RowActions, RowActionsProps } from './RowActions'
import { onClickOrEnter } from '../../../util/props'
import { Clock } from '../../../shared/components/icons'
import { pluralize } from '../../../util/strings'
import { cellHasChanges } from '../../util/buildDynamicColumns'

const PlotSelectionsIndicator: FC<{ plotSelections: number }> = ({
  plotSelections
}) => (
  <IndicatorWithJustTheCounter
    aria-label={'Sub-rows selected for plots'}
    count={plotSelections}
    tooltipContent={`${plotSelections} ${pluralize(
      'sub-row',
      plotSelections
    )} selected for plots.`}
  />
)

type BulletIndicatorsProps = {
  plotSelections: number
  queued?: boolean
}

const BulletIndicators: FC<BulletIndicatorsProps> = ({
  plotSelections,
  queued
}) => (
  <>
    <PlotSelectionsIndicator plotSelections={plotSelections} />
    {queued && <Clock />}
  </>
)

type BulletProps = BulletIndicatorsProps & {
  bulletColor?: string
  toggleExperiment: () => void
}

const Bullet: FC<BulletProps> = ({
  bulletColor,
  toggleExperiment,
  ...bulletIndicatorsProps
}) => (
  <span
    className={styles.bullet}
    style={{ color: bulletColor }}
    {...onClickOrEnter(toggleExperiment)}
  >
    <BulletIndicators {...bulletIndicatorsProps} />
  </span>
)

type CellErrorWrapperProps = {
  error?: string
  toggleExperiment: () => void
  children?: React.ReactNode
}

const CellErrorWrapper: FC<CellErrorWrapperProps> = ({
  error,
  toggleExperiment,
  children
}) => (
  <ErrorTooltip error={error}>
    <div
      className={cx(styles.cellContents, error && styles.error)}
      {...onClickOrEnter(toggleExperiment)}
    >
      {children}
    </div>
  </ErrorTooltip>
)

type CellContentsProps = CellProp & CellErrorWrapperProps

const CellContents: FC<CellContentsProps> = ({
  cell: { isPlaceholder, render },
  ...errorProps
}) =>
  isPlaceholder ? null : (
    <CellErrorWrapper {...errorProps}>{render('Cell')}</CellErrorWrapper>
  )

type InnerCellProps = CellProp &
  RowActionsProps & {
    bulletColor?: string
    toggleExperiment: () => void
  }

const InnerCell: FC<InnerCellProps> = ({
  cell,
  bulletColor,
  toggleExperiment,
  ...rowActionsProps
}) => {
  const { row } = cell
  const {
    original: { error, queued }
  } = row

  const {
    subRowStates: { plotSelections }
  } = rowActionsProps
  return (
    <div className={styles.innerCell}>
      <RowActions {...rowActionsProps} />
      <RowExpansionButton {...row} />
      <Bullet
        bulletColor={bulletColor}
        queued={queued}
        toggleExperiment={toggleExperiment}
        plotSelections={plotSelections}
      />
      <CellContents
        toggleExperiment={toggleExperiment}
        error={error}
        cell={cell}
      />
    </div>
  )
}

const getFirstCellProps = (cell: Cell<Experiment>) =>
  cell.getCellProps({
    className: cx(
      styles.td,
      styles.experimentCell,
      cell.isPlaceholder && styles.groupPlaceholder
    )
  })

export const FirstCell: FC<InnerCellProps> = props => {
  const { cell } = props

  return (
    <div {...getFirstCellProps(cell)}>
      <InnerCell {...props} />
    </div>
  )
}

interface CellStyleAssertions {
  hasWorkspaceChanges?: boolean
  hasDependencyChanges: boolean
  isPlaceholder: boolean
}

const cellClassnames = ({
  hasWorkspaceChanges,
  hasDependencyChanges,
  isPlaceholder
}: CellStyleAssertions) => ({
  [styles.workspaceChange]: hasWorkspaceChanges,
  [styles.depChange]: hasDependencyChanges,
  [styles.groupPlaceholder]: isPlaceholder
})

type CellWrapperProps = CellProp & {
  error?: string
  changes?: string[]
  cellId: string
  children?: React.ReactNode
}

const getCellAssertions = (cell: Cell<Experiment>, changes?: string[]) => {
  return {
    hasDependencyChanges: cellHasChanges(cell.value),
    hasWorkspaceChanges: changes?.includes(cell.column.id),
    isPlaceholder: cell.isPlaceholder
  }
}

const getCellProps = (cell: Cell<Experiment>, changes?: string[]) => {
  const cellAssertions: CellStyleAssertions = getCellAssertions(cell, changes)

  return cell.getCellProps({
    className: cx(styles.td, cellClassnames(cellAssertions))
  })
}

export const CellWrapper: FC<CellWrapperProps> = ({
  cell,
  cellId,
  changes
}) => {
  return (
    <div {...getCellProps(cell, changes)} data-testid={cellId}>
      {cell.render('Cell')}
    </div>
  )
}
