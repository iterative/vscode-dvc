/* eslint-disable @typescript-eslint/no-empty-interface */

import {
  UseColumnOrderInstanceProps,
  UseColumnOrderState,
  UseExpandedHooks,
  UseExpandedInstanceProps,
  UseExpandedOptions,
  UseExpandedRowProps,
  UseExpandedState,
  UseResizeColumnsColumnOptions,
  UseResizeColumnsColumnProps,
  UseResizeColumnsOptions,
  UseResizeColumnsState
} from 'react-table'

declare module 'react-table' {
  export interface TableOptions<D extends Record<string, unknown>>
    // UseFiltersOptions<D>,
    // UseGlobalFiltersOptions<D>,
    // UseGroupByOptions<D>,
    // UsePaginationOptions<D>,
    // UseRowSelectOptions<D>,
    // UseRowStateOptions<D>,
    // UseSortByOptions<D>,
    extends UseExpandedOptions<D>,
      UseResizeColumnsOptions<D> {}

  export interface Hooks<
      D extends Record<string, unknown> = Record<string, unknown>
    >
    // UseGroupByHooks<D>,
    // UseRowSelectHooks<D>,
    // UseSortByHooks<D>
    extends UseExpandedHooks<D> {}

  export interface TableInstance<
      D extends Record<string, unknown> = Record<string, unknown>
    >
    // UseFiltersInstanceProps<D>,
    // UseGlobalFiltersInstanceProps<D>,
    // UseGroupByInstanceProps<D>,
    // UsePaginationInstanceProps<D>,
    // UseRowSelectInstanceProps<D>,
    // UseRowStateInstanceProps<D>,
    // UseSortByInstanceProps<D>,
    extends UseColumnOrderInstanceProps<D>,
      UseExpandedInstanceProps<D> {}

  export interface TableState<
      D extends Record<string, unknown> = Record<string, unknown>
    >
    // UseFiltersState<D>,
    // UseGlobalFiltersState<D>,
    // UseGroupByState<D>,
    // UsePaginationState<D>,
    // UseRowSelectState<D>,
    // UseRowStateState<D>,
    // UseSortByState<D>,
    extends UseColumnOrderState<D>,
      UseExpandedState<D>,
      UseResizeColumnsState<D> {}

  export interface ColumnInterface<
      D extends Record<string, unknown> = Record<string, unknown>
    >
    // UseFiltersColumnOptions<D>,
    // UseGlobalFiltersColumnOptions<D>,
    // UseGroupByColumnOptions<D>,
    // UseSortByColumnOptions<D>,
    extends UseResizeColumnsColumnOptions<D> {}

  // UseFiltersColumnProps<D>,
  // UseGroupByColumnProps<D>,
  // UseSortByColumnProps<D>
  export interface ColumnInstance<
    D extends Record<string, unknown> = Record<string, unknown>
  > extends UseResizeColumnsColumnProps<D> {}

  // UseGroupByCellProps<D>,
  // UseRowStateCellProps<D>
  export interface Cell<
    D extends Record<string, unknown> = Record<string, unknown>,
    V = unknown
  > {
    isPlaceholder: boolean
  }

  // UseGroupByRowProps<D>,
  // UseRowSelectRowProps<D>,
  // UseRowStateRowProps<D>
  export interface Row<
    D extends Record<string, unknown> = Record<string, unknown>
  > extends UseExpandedRowProps<D> {
    flatIndex: number
  }
}
