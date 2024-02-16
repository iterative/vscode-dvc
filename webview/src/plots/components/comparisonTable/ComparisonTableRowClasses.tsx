import React from 'react'
import { ComparisonClassDetails } from 'dvc/src/plots/webview/contract'
import cx from 'classnames'
import styles from './styles.module.scss'
import { ComparisonTablePinnedContentRow } from './ComparisonTablePinnedContentRow'

export const ComparisonTableRowClasses: React.FC<{
  classDetails: ComparisonClassDetails
  pinnedColumn: string
  nbColumns: number
  cellClasses: string
}> = ({ classDetails, pinnedColumn, nbColumns, cellClasses }) => {
  const classDetailsArr = Object.entries(classDetails)

  if (classDetailsArr.length === 0) {
    return
  }

  return (
    <ComparisonTablePinnedContentRow
      pinnedColumn={pinnedColumn}
      nbColumns={nbColumns}
    >
      <div
        data-testid="row-bounding-box-classes"
        className={cx(styles.classes, cellClasses)}
      >
        <p className={styles.classesTitle}>Classes</p>
        {classDetailsArr.map(([label, { color, selected }]) => (
          <label
            key={label}
            className={styles.classButton}
            style={{ '--class-color': color } as React.CSSProperties}
          >
            <input
              type="checkbox"
              name="labels"
              value={label}
              defaultChecked={selected}
              className={styles.hiddenInput}
            />
            {label}
          </label>
        ))}
      </div>
    </ComparisonTablePinnedContentRow>
  )
}
