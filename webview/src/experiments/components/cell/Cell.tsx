import { Experiment } from 'dvc/src/experiments/webview/contract'
import React from 'react'
import { Cell } from 'react-table'
import { CopyButton } from '../copyButton/CopyButton'
import Tooltip, {
  CELL_TOOLTIP_DELAY
} from '../../../shared/components/tooltip/Tooltip'
import { formatFloat } from '../../util/numberFormatting'
import styles from '../table/styles.module.scss'

const groupLabels: Record<string, string> = {
  metrics: 'Metric',
  params: 'Parameter'
}

const CellTooltip: React.FC<{
  cell: Cell<Experiment, string | number>
}> = ({ cell }) => {
  const {
    column: { group },
    value
  } = cell
  return (
    <>
      {groupLabels[group as string]}: {value}
    </>
  )
}

const UndefinedCell = (
  <div className={styles.innerCell}>
    <span className={styles.cellContents}>. . .</span>
  </div>
)

export const CellComponent: React.FC<
  Cell<Experiment, string | number>
> = cell => {
  const { value } = cell
  if (value === undefined) {
    return UndefinedCell
  }

  const stringValue = String(value)

  const displayValue =
    typeof value === 'number' && !Number.isInteger(value)
      ? formatFloat(value as number)
      : stringValue

  return (
    <Tooltip
      content={<CellTooltip cell={cell} />}
      placement="bottom"
      arrow={true}
      delay={[CELL_TOOLTIP_DELAY, 0]}
    >
      <div className={styles.innerCell}>
        <CopyButton value={stringValue} />
        <span className={styles.cellContents}>{displayValue}</span>
      </div>
    </Tooltip>
  )
}
