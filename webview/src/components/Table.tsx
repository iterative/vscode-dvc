import React from 'react'
import { Cell, HeaderGroup } from 'react-table'
import cx from 'classnames'
import { InstanceProp, RowProp, DVCExperimentRow } from './Experiments'

export const ParentHeaderGroup: React.FC<{
  headerGroup: HeaderGroup<DVCExperimentRow>
}> = ({ headerGroup }) => {
  return (
    <div
      {...headerGroup.getHeaderGroupProps({
        className: cx('parent-headers-row', 'tr')
      })}
    >
      {headerGroup.headers.map(column => (
        <div
          {...column.getHeaderProps({
            className: cx(
              'th',
              column.placeholderOf
                ? 'placeholder-header-cell'
                : 'parent-header-cell',
              {
                'grouped-header': column.isGrouped
              }
            )
          })}
          key={column.id}
        >
          <div>{column.render('Header')}</div>
        </div>
      ))}
    </div>
  )
}

export const FirstCell: React.FC<{ cell: Cell<DVCExperimentRow, any> }> = ({
  cell
}) => {
  const { row } = cell
  const baseFirstCellProps = cell.getCellProps({
    className: cx('td', 'experiment-cell', {
      'group-placeholder': cell.isPlaceholder,
      'grouped-column-cell': cell.column.isGrouped,
      'grouped-cell': cell.isGrouped
    })
  })
  const firstCellProps = row.canExpand
    ? row.getToggleRowExpandedProps({
        ...baseFirstCellProps,
        className: cx(
          baseFirstCellProps.className,
          'expandable-experiment-cell',
          row.isExpanded
            ? 'expanded-experiment-cell'
            : 'contracted-experiment-cell'
        )
      })
    : baseFirstCellProps

  return (
    <div {...firstCellProps}>
      <span
        className={
          row.canExpand
            ? row.isExpanded
              ? 'expanded-row-arrow'
              : 'contracted-row-arrow'
            : 'row-arrow-placeholder'
        }
      />
      <span className={row.original.queued ? 'queued-bullet' : 'bullet'} />
      {cell.isGrouped ? (
        <>
          <span {...row.getToggleRowExpandedProps()}>
            {row.isExpanded ? '👇' : '👉'} {cell.render('Cell')} (
            {row.subRows.length})
          </span>
        </>
      ) : cell.isAggregated ? (
        cell.render('Aggregated')
      ) : cell.isPlaceholder ? null : (
        cell.render('Cell')
      )}
    </div>
  )
}

export const PrimaryHeaderGroup: React.FC<{
  headerGroup: HeaderGroup<DVCExperimentRow>
}> = ({ headerGroup }) => (
  <div
    {...headerGroup.getHeaderGroupProps({
      className: cx('tr', 'headers-row')
    })}
  >
    {headerGroup.headers.map(header => (
      <div
        {...header.getHeaderProps(
          header.getSortByToggleProps({
            className: cx('th', {
              'grouped-header': header.isGrouped,
              'sorted-header': header.isSorted
            })
          })
        )}
      >
        <div>
          {header.render('Header')}
          {header.isSorted && <span>{header.isSortedDesc ? '↓' : '↑'}</span>}
        </div>
      </div>
    ))}
  </div>
)

export const TableRow: React.FC<RowProp & InstanceProp> = ({
  row,
  instance
}) => {
  instance.prepareRow(row)
  const [firstCell, ...cells] = row.cells
  return (
    <div>
      <div
        {...row.getRowProps({
          className: cx(
            'tr',
            row.values.sha === 'workspace' ? 'workspace-row' : 'normal-row'
          )
        })}
      >
        <FirstCell cell={firstCell} />
        {cells.map(cell => {
          return (
            <div
              {...cell.getCellProps({
                className: cx('td', {
                  'group-placeholder': cell.isPlaceholder,
                  'grouped-column-cell': cell.column.isGrouped,
                  'grouped-cell': cell.isGrouped
                })
              })}
              key={`${cell.column.id}___${cell.row.id}`}
            >
              {cell.isPlaceholder ? null : cell.render('Cell')}
            </div>
          )
        })}
      </div>
      {row.isExpanded &&
        row.subRows.map(row => <TableRow row={row} instance={instance} />)}
    </div>
  )
}

export const TableBody: React.FC<RowProp & InstanceProp> = ({
  row,
  instance
}) => {
  return (
    <div
      {...instance.getTableBodyProps({
        className: cx(
          'row-group',
          'tbody',
          row.values.sha === 'workspace'
            ? 'workspace-row-group'
            : 'normal-row-group'
        )
      })}
    >
      <TableRow instance={instance} row={row} />
    </div>
  )
}

export const TableHead: React.FC<InstanceProp> = ({
  instance: { headerGroups }
}) => {
  const lastHeaderGroupIndex = headerGroups.length - 1
  const lastHeaderGroup = headerGroups[lastHeaderGroupIndex]

  return (
    <div className="thead">
      {headerGroups.slice(0, lastHeaderGroupIndex).map((headerGroup, i) => (
        <ParentHeaderGroup
          headerGroup={headerGroup}
          key={`header-group-${i}`}
        />
      ))}
      <PrimaryHeaderGroup headerGroup={lastHeaderGroup} />
    </div>
  )
}
