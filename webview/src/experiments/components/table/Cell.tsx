import React from 'react'
import { useInView } from 'react-intersection-observer'
import cx from 'classnames'
import { VSCodeCheckbox } from '@vscode/webview-ui-toolkit/react'
import styles from './styles.module.scss'
import { CellProp, WithTableRoot, RowProp } from './interfaces'
import ClockIcon from '../../../shared/components/icons/Clock'
import { clickAndEnterProps } from '../../../util/props'
import { StarFull, StarEmpty } from '../../../shared/components/icons'

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

const FirstCellRowActions: React.FC<{
  isRowSelected: boolean
  toggleRowSelection: () => void
  starred: boolean | undefined
  toggleStarred: () => void
}> = ({ toggleRowSelection, isRowSelected, starred, toggleStarred }) => {
  return (
    <div className={styles.rowActions}>
      <VSCodeCheckbox
        {...clickAndEnterProps(toggleRowSelection)}
        checked={isRowSelected}
      />
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
    </div>
  )
}

export const FirstCell: React.FC<
  CellProp &
    WithTableRoot & {
      bulletColor?: string
      isRowSelected: boolean
      toggleExperiment: () => void
      toggleRowSelection: () => void
      toggleStarred: () => void
    }
> = ({
  cell,
  bulletColor,
  isRowSelected,
  toggleExperiment,
  toggleRowSelection,
  toggleStarred,
  root
}) => {
  const { row, isPlaceholder } = cell
  const {
    original: { starred, queued }
  } = row

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
        <FirstCellRowActions
          isRowSelected={isRowSelected}
          starred={starred}
          toggleRowSelection={toggleRowSelection}
          toggleStarred={toggleStarred}
        />
        <RowExpansionButton row={row} />
        <span
          className={styles.bullet}
          style={{ color: bulletColor }}
          {...clickAndEnterProps(toggleExperiment)}
        >
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
> = ({ cell, cellId, changes }) => (
  <div
    {...cell.getCellProps({
      className: cx(styles.td, cell.isPlaceholder && styles.groupPlaceholder, {
        [styles.workspaceChange]: changes?.includes(cell.column.id)
      })
    })}
    data-testid={cellId}
  >
    {cell.render('Cell')}
  </div>
)
