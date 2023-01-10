import { Value } from 'dvc/src/cli/dvc/contract'
import {
  Column,
  Experiment,
  ValueWithChanges
} from 'dvc/src/experiments/webview/contract'
import { formatNumber } from 'dvc/src/util/number'
import React from 'react'
import { CellContext } from '@tanstack/react-table'
import { ErrorCell } from './ErrorCell'
import { UndefinedCell } from './UndefinedCell'
import styles from '../styles.module.scss'
import Tooltip, {
  NORMAL_TOOLTIP_DELAY
} from '../../../../shared/components/tooltip/Tooltip'
import { CellContents } from './CellContent'
import { CopyButton } from '../../../../shared/components/copyButton/CopyButton'
import { CellTooltip } from './CellTooltip'

export type CellValue = Value | ValueWithChanges

export const isValueWithChanges = (raw: CellValue): raw is ValueWithChanges =>
  typeof (raw as ValueWithChanges)?.changes === 'boolean'

export const cellValue = (raw: CellValue) =>
  isValueWithChanges(raw) ? raw.value : raw

export const Cell: React.FC<CellContext<Column, CellValue>> = cell => {
  const value = cell.getValue()
  const {
    row: {
      original: { error }
    }
  } = cell as unknown as CellContext<Experiment, CellValue>

  if (error && value === undefined) {
    return <ErrorCell error={error} />
  }

  if (value === undefined) {
    return <UndefinedCell />
  }

  const rawValue = cellValue(value)
  const stringValue = String(rawValue)

  const displayValue =
    typeof rawValue === 'number'
      ? formatNumber(rawValue as number)
      : stringValue

  return (
    <Tooltip
      content={<CellTooltip>{stringValue}</CellTooltip>}
      placement="bottom-end"
      delay={NORMAL_TOOLTIP_DELAY}
      interactive={true}
    >
      <div className={styles.innerCell}>
        <CopyButton
          value={stringValue}
          className={styles.copyButton}
          tooltip="Copy cell contents"
        />
        <CellContents>{displayValue}</CellContents>
      </div>
    </Tooltip>
  )
}
