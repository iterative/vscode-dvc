import { RowData, TableData } from 'dvc/src/experiments/webview/contract'

export const sortableRowsExperimentsFixture = [
  {
    id: 'exp-48faa',
    label: 'expA',
    checkpoint_tip: 'expA77f41d59cfefd43be78f77a5c4126332f',
    timestamp: '2022-02-15T14:57:26',
    queued: false,
    running: false,
    executor: null,
    name: 'exp-48faa',
    checkpoint_parent: 'expAcheckpointA666e721095997077f57af661eca94b763',
    mutable: false,
    displayNameOrParent: '[exp-48faa]',
    sha: 'expA77f41d59cfefd43be78f77a5c4126332f',
    displayColor: '#cca700',
    params: {
      'params.yaml': {
        sortable: 2
      }
    },
    selected: true,
    subRows: [
      {
        id: 'expAcheckpointA666e721095997077f57af661eca94b763',
        label: 'expAcheckpointA',
        checkpoint_tip: 'expA77f41d59cfefd43be78f77a5c4126332f',
        timestamp: '2022-02-15T14:57:26',
        queued: false,
        running: false,
        executor: null,
        checkpoint_parent: 'expAcheckpointB356c6f78de7ef842305a26e0bbef3e243',
        mutable: false,
        sha: 'expAcheckpointA666e721095997077f57af661eca94b763',
        displayColor: '#cca700',
        params: {
          'params.yaml': {
            sortable: 2
          }
        },
        selected: false
      },
      {
        id: 'expAcheckpointB356c6f78de7ef842305a26e0bbef3e243',
        label: 'expAcheckpointB',
        checkpoint_tip: 'expA77f41d59cfefd43be78f77a5c4126332f',
        timestamp: '2022-02-15T14:57:18',
        queued: false,
        running: false,
        executor: null,
        checkpoint_parent: '11c01dfb4aa5fb41915610c3a256b418fc095610',
        mutable: false,
        sha: 'expAcheckpointB356c6f78de7ef842305a26e0bbef3e243',
        displayColor: '#cca700',
        params: {
          'params.yaml': {
            sortable: 2
          }
        },
        selected: false
      }
    ]
  },
  {
    id: 'exp-ad39e',
    label: 'expB',
    checkpoint_tip: 'expB2a1b7e728c4a70b0bf94d26e9de1e6a90',
    timestamp: '2022-02-15T14:56:55',
    queued: false,
    running: false,
    executor: null,
    name: 'exp-ad39e',
    checkpoint_parent: 'expBcheckpointA27e173ace79781d188688ff245c61dfe9',
    mutable: false,
    displayNameOrParent: '[exp-ad39e]',
    sha: 'expB2a1b7e728c4a70b0bf94d26e9de1e6a90',
    displayColor: '#3794ff',
    params: {
      'params.yaml': {
        sortable: 3
      }
    },
    selected: true,
    subRows: [
      {
        id: 'expBcheckpointA27e173ace79781d188688ff245c61dfe9',
        label: 'expBcheckpointA',
        checkpoint_tip: 'expB2a1b7e728c4a70b0bf94d26e9de1e6a90',
        timestamp: '2022-02-15T14:56:54',
        queued: false,
        running: false,
        executor: null,
        checkpoint_parent: 'expBcheckpointB998c67d58beb91737fdccba2b27d271cc',
        mutable: false,
        sha: 'expBcheckpointA27e173ace79781d188688ff245c61dfe9',
        displayColor: '#3794ff',
        params: {
          'params.yaml': {
            sortable: 3
          }
        },
        selected: false
      },
      {
        id: 'expBcheckpointB998c67d58beb91737fdccba2b27d271cc',
        label: 'expBcheckpointB',
        checkpoint_tip: 'expB2a1b7e728c4a70b0bf94d26e9de1e6a90',
        timestamp: '2022-02-15T14:56:46',
        queued: false,
        running: false,
        executor: null,
        checkpoint_parent: 'expC2c758474faff7fa2958999f7c1a31101a',
        mutable: false,
        displayNameOrParent: '(expC)',
        sha: 'expBcheckpointB998c67d58beb91737fdccba2b27d271cc',
        displayColor: '#3794ff',
        params: {
          'params.yaml': {
            sortable: 3
          }
        },
        selected: false
      }
    ]
  },
  {
    id: 'exp-c0dde',
    label: 'expC',
    checkpoint_tip: 'expC2c758474faff7fa2958999f7c1a31101a',
    timestamp: '2022-02-15T14:56:19',
    queued: false,
    running: false,
    executor: null,
    name: 'exp-c0dde',
    checkpoint_parent: 'expCcheckpointAe73c5921356f83c45703eb89351a18fca',
    mutable: false,
    displayNameOrParent: '[exp-c0dde]',
    sha: 'expC2c758474faff7fa2958999f7c1a31101a',
    displayColor: '#f14c4c',
    params: {
      'params.yaml': {
        sortable: 1
      }
    },
    selected: true,
    subRows: [
      {
        id: 'expCcheckpointAe73c5921356f83c45703eb89351a18fca',
        label: 'expCcheckpointA',
        checkpoint_tip: 'expC2c758474faff7fa2958999f7c1a31101a',
        timestamp: '2022-02-15T14:56:17',
        queued: false,
        running: false,
        executor: null,
        checkpoint_parent: 'expCcheckpointB86d4ed4255b8e69f0739820d601b7cc43',
        mutable: false,
        sha: 'expCcheckpointAe73c5921356f83c45703eb89351a18fca',
        displayColor: '#f14c4c',
        params: {
          'params.yaml': {
            sortable: 1
          }
        },
        selected: false
      },
      {
        id: 'expCcheckpointB86d4ed4255b8e69f0739820d601b7cc43',
        label: 'expCcheckpointB',
        checkpoint_tip: 'expC2c758474faff7fa2958999f7c1a31101a',
        timestamp: '2022-02-15T14:56:10',
        queued: false,
        running: false,
        executor: null,
        checkpoint_parent: '11c01dfb4aa5fb41915610c3a256b418fc095610',
        mutable: false,
        sha: 'expCcheckpointB86d4ed4255b8e69f0739820d601b7cc43',
        displayColor: '#f14c4c',
        params: {
          'params.yaml': {
            sortable: 1
          }
        },
        selected: false
      }
    ]
  }
]

export const sortableRowsWorkspaceRowFixture = {
  id: 'workspace',
  label: 'workspace',
  timestamp: null,
  queued: false,
  running: false,
  executor: null,
  mutable: false,
  displayColor: '#945dd6',
  params: {
    'params.yaml': {
      sortable: 2
    }
  },
  selected: true
}

export const sortableRowsBranchRowFixture = {
  id: 'main',
  label: 'main',
  timestamp: '2022-02-14T22:00:05',
  queued: false,
  running: false,
  executor: null,
  name: 'main',
  mutable: false,
  sha: '11c01dfb4aa5fb41915610c3a256b418fc095610',
  displayColor: '#13adc7',
  params: {
    'params.yaml': {
      sortable: 2
    }
  },
  selected: true,
  subRows: sortableRowsExperimentsFixture
}

export const buildSortableRowsFixture = (
  sortableRows: RowData[]
): TableData => ({
  changes: [],
  columnOrder: [],
  columnWidths: {},
  columns: [
    {
      group: 'params',
      hasChildren: true,
      name: 'params.yaml',
      parentPath: 'params',
      path: 'params:params.yaml'
    },
    {
      group: 'params',
      hasChildren: false,
      maxStringLength: 1,
      name: 'sortable',
      parentPath: 'params:params.yaml',
      path: 'params:params.yaml:sortable',
      pathArray: ['params', 'params.yaml', 'sortable'],
      types: ['number'],
      maxNumber: 3,
      minNumber: 1
    }
  ],
  rows: [
    sortableRowsWorkspaceRowFixture,
    { ...sortableRowsBranchRowFixture, subRows: sortableRows }
  ],
  sorts: []
})

export const sortableRowsTableDataFixture = buildSortableRowsFixture(
  sortableRowsExperimentsFixture
)

const sortedSortableRows = [...sortableRowsExperimentsFixture].sort(
  (
    {
      params: {
        'params.yaml': { sortable: a }
      }
    },
    {
      params: {
        'params.yaml': { sortable: b }
      }
    }
  ) => (a === b ? 0 : a < b ? -1 : 1)
)

export const ascendingSortableRowsTableDataFixture =
  buildSortableRowsFixture(sortedSortableRows)

export const descendingSortableRowsTableDataFixture = buildSortableRowsFixture(
  [...sortedSortableRows].reverse()
)
