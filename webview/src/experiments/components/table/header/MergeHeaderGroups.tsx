import React from 'react'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import { HeaderGroup, Header } from '@tanstack/react-table'
import { TableHeader } from './TableHeader'
import styles from '../styles.module.scss'
import { DragFunction } from '../../../../shared/components/dragDrop/Draggable'

export const MergedHeaderGroups: React.FC<{
  headerGroup: HeaderGroup<Experiment>
  onDragEnter: DragFunction
  onDragStart: DragFunction
  onDragEnd: DragFunction
  onDrop: DragFunction
  onDragLeave: DragFunction
  setExpColumnNeedsShadow: (needsShadow: boolean) => void
  root: HTMLElement | null
  onlyOneLine?: boolean
}> = ({
  headerGroup,
  onDragEnter,
  onDragEnd,
  onDragStart,
  onDrop,
  onDragLeave,
  root,
  setExpColumnNeedsShadow,
  onlyOneLine
}) => {
  return (
    <tr className={styles.headRow}>
      {headerGroup.headers.map((header: Header<Experiment, unknown>) => (
        <TableHeader
          setExpColumnNeedsShadow={setExpColumnNeedsShadow}
          key={header.id}
          header={header}
          onDragEnter={onDragEnter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDrop={onDrop}
          onDragLeave={onDragLeave}
          root={root}
          onlyOneLine={onlyOneLine}
        />
      ))}
    </tr>
  )
}
