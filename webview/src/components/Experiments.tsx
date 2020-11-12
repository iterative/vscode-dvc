import * as React from "react";
const { useCallback, useMemo } = React;
import {
	DVCExperiment,
	DataFileDict,
	DVCExperimentsRepoJSONOutput,
	DVCExperimentJSONOutput,
} from "dvc-integration/src/DvcReader";
import dayjs from "../dayjs";
import {
	Row,
	Column,
	ColumnInstance,
	useTable,
	useGroupBy,
	useExpanded,
	useSortBy,
	useFlexLayout,
} from "react-table";
import cx from "classnames";

interface DVCExperimentRow extends DVCExperiment {
	subRows?: DVCExperimentRow[];
}

const parseExperimentJSONEntry: (
	sha: string,
	experiment: DVCExperimentJSONOutput
) => DVCExperiment = (sha, { checkpoint_tip, ...rest }) => ({
	...rest,
	checkpointTip: checkpoint_tip,
	sha,
});

const parseExperiments = (experimentsData: DVCExperimentsRepoJSONOutput) => {
	return Object.entries(experimentsData).reduce<DVCExperimentRow[]>(
		(acc, [commitId, { baseline, ...childExperiments }]) => {
			return [
				...acc,
				{
					...parseExperimentJSONEntry(commitId, baseline),
					subRows: Object.entries(
						childExperiments
					).map(([sha, experiment]) =>
						parseExperimentJSONEntry(sha, experiment)
					),
				},
			];
		},
		[]
	);
};

interface ObjectEntriesWithParents {
	skippedKeys: string[];
	entries: [string, any][];
}

export const getBranchingEntries: (
	input: Record<string, any>,
	skippedKeys?: string[]
) => ObjectEntriesWithParents = (input, skippedKeys = []) => {
	const entries = Object.entries(input);
	if (entries.length === 1) {
		const [key, value] = entries[0];
		const newPath = [...skippedKeys, key];
		if (typeof value === "object") {
			return getBranchingEntries(value, newPath);
		}
	}
	return {
		skippedKeys: skippedKeys,
		entries: entries,
	};
};

const arrayAccessor: <T = string>(
	pathArray: string[]
) => (originalRow: any) => T = (pathArray) => (originalRow) =>
	pathArray.reduce((acc, cur) => acc[cur], originalRow);

const buildColumnsFromSampleObject: (
	data: Record<string, any>,
	parents?: string[]
) => Column<any>[] = (data, oldParents = []) => {
	const { skippedKeys, entries } = getBranchingEntries(data);
	const newParents = [...oldParents, ...skippedKeys];
	return entries.map(([fieldName, value]) => {
		const currentPath = [...newParents, fieldName];
		const base: Column<any> & {
			columns?: Column<any>[];
		} = {
			Header: fieldName,
			id: currentPath.join("___"),
			accessor: arrayAccessor(currentPath),
		};
		if (typeof value === "object") {
			return {
				...base,
				disableSortBy: true,
				columns: buildColumnsFromSampleObject(value, currentPath),
			};
		}
		return base;
	});
};

const buildNestedColumnFromExperiments: (def: {
	Header: string;
	data: DVCExperimentRow[];
	accessor: keyof DVCExperimentRow;
}) => Column<DVCExperimentRow> = ({ Header, accessor, data }) => {
	return {
		Header,
		accessor,
		disableSortBy: true,
		columns:
			!data || data.length === 0
				? []
				: buildColumnsFromSampleObject(
						data[0][accessor] as DataFileDict,
						[accessor]
				  ),
	};
};

const TruncatedCell = ({ value }: { value: string }) =>
	value && value.length && value.length > 12
		? `${value.slice(0, 4)}...${value.slice(value.length - 4)}`
		: value;

const Blank = <i>Blank</i>;

export const ExperimentsTable: React.FC<{
	experiments: DVCExperimentsRepoJSONOutput;
}> = ({ experiments }) => {
	const [initialState, defaultColumn] = useMemo(() => {
		const initialState = {};
		const defaultColumn: Partial<Column<DVCExperimentRow>> = {
			Cell: ({ value }: { value?: string | number }) => {
				return value === ""
					? Blank
					: typeof value === "number"
					? value.toLocaleString(undefined, {
							maximumFractionDigits: 2,
					  })
					: value;
			},
		};
		return [initialState, defaultColumn];
	}, []);

	const [data, columns] = useMemo(() => {
		const data = parseExperiments(experiments);
		const columns = [
			{
				Header: "Experiment",
				accessor: (item: any) => item.name || item.sha,
				Cell: TruncatedCell,
				disableGroupBy: true,
				width: 150,
			},
			{
				Header: "Time",
				accessor: "timestamp",
				Cell: ({ value }: { value: string }) =>
					value === "" ? Blank : value && dayjs(value).fromNow(),
			},
			buildNestedColumnFromExperiments({
				Header: "Params",
				accessor: "params",
				data,
			}),
			buildNestedColumnFromExperiments({
				Header: "Metrics",
				accessor: "metrics",
				data,
			}),
			{
				Header: "Queued",
				accessor: "queued",
			},
		] as Column<DVCExperimentRow>[];
		return [data, columns];
	}, [experiments]);

	const {
		getTableProps,
		getTableBodyProps,
		prepareRow,
		toggleAllRowsExpanded,
		state,
		groupedColumns,
		sortedColumns,
		headerGroups,
		rows,
		toggleCommitUngroup,
	} = useTable<DVCExperimentRow>(
		{
			columns,
			data,
			initialState,
			isMultiSortEvent: () => true,
			defaultColumn,
		},
		(hooks) => {
			hooks.stateReducers.push((state, action) => {
				if (action.type === "set-ungrouped") {
					return {
						...state,
						ungrouped: action.setting || !state.ungrouped,
					};
				}
			});
			hooks.useInstance.push(function ungroupByCommit(instance) {
				const {
					rows,
					dispatch,
					state: { ungrouped },
				} = instance;
				const toggleCommitUngroup = useCallback(
					(setting) =>
						dispatch({
							type: "set-ungrouped",
							setting,
						}),
					[dispatch]
				);
				Object.assign(instance, {
					toggleCommitUngroup,
				});
				if (!ungrouped) return;
				const ungroupedRows = rows.reduce<Row<DVCExperimentRow>[]>(
					(acc, row) => {
						if (row.subRows) {
							const result = [
								...acc,
								{ ...row, subRows: [] },
								...row.subRows,
							].map((item, index) => ({ ...item, index }));
							return result;
						} else {
							return [...acc, row];
						}
					},
					[]
				);
				Object.assign(instance, {
					preSortedRows: rows,
					rows: ungroupedRows,
				});
			});
		},
		useGroupBy,
		useSortBy,
		useExpanded,
		useFlexLayout
	);

	React.useEffect(() => {
		toggleAllRowsExpanded(true);
	}, []);

	const ColumnOptionSelector: React.FC<{
		label: string;
		columns: ColumnInstance<DVCExperimentRow>[];
		Button: React.FC<ColumnInstance<DVCExperimentRow>>;
	}> = ({ label, columns, Button }) => (
		<div>
			<h3>{label}</h3>
			<div>
				{columns.map((column) => (
					<Button key={column.id} {...column} />
				))}
			</div>
		</div>
	);

	const lastHeaderGroupIndex = headerGroups.length - 1;
	const lastHeaderGroup = headerGroups[lastHeaderGroupIndex];

	return (
		<div>
			<button onClick={() => toggleCommitUngroup()}>
				{state.ungrouped ? "Group" : "Ungroup"} by Commit
			</button>
			<div className="table" {...getTableProps()}>
				<div className="thead">
					{headerGroups
						.slice(0, lastHeaderGroupIndex)
						.map((headerGroup) => (
							<div
								className="tr"
								{...headerGroup.getHeaderGroupProps({
									className: "parent-headers-row",
								})}
							>
								{headerGroup.headers.map((column) => (
									<span
										className="th"
										{...column.getHeaderProps({
											className: cx(
												column.placeholderOf
													? "placeholder-header-cell"
													: "parent-header-cell",
												{
													"grouped-header":
														column.isGrouped,
												}
											),
										})}
									>
										<div>{column.render("Header")}</div>
									</span>
								))}
							</div>
						))}
					<div
						className="tr"
						{...lastHeaderGroup.getHeaderGroupProps({
							className: "headers-row",
						})}
					>
						{lastHeaderGroup.headers.map((column) => (
							<span
								{...column.getHeaderProps({
									className: cx("th", {
										"grouped-header": column.isGrouped,
									}),
								})}
							>
								<div>{column.render("Header")}</div>
								<div>
									<button {...column.getSortByToggleProps()}>
										{column.isSorted
											? column.isSortedDesc
												? "(DESC)"
												: "(ASC)"
											: "(sort)"}
									</button>
									{column.isGrouped ? (
										<span
											{...column.getGroupByToggleProps()}
										>
											{" "}
											<span>(X)</span>
										</span>
									) : null}
								</div>
							</span>
						))}
					</div>
				</div>
				<div className="tbody" {...getTableBodyProps()}>
					{rows.map((row) => {
						prepareRow(row);
						const [firstCell, ...cells] = row.cells;
						return (
							<div className="tr" {...row.getRowProps()}>
								<div
									className="td"
									{...firstCell.getCellProps({
										className: cx({
											"group-placeholder":
												firstCell.isPlaceholder,
											"grouped-column-cell":
												firstCell.column.isGrouped,
											"grouped-cell": firstCell.isGrouped,
										}),
									})}
								>
									{firstCell.row.depth > 0 && (
										<>{"-".repeat(firstCell.row.depth)} </>
									)}
									{firstCell.row.canExpand && (
										<span
											{...firstCell.row.getToggleRowExpandedProps()}
										>
											{firstCell.row.isExpanded
												? "👇"
												: "👉"}{" "}
										</span>
									)}
									{firstCell.isGrouped ? (
										<>
											<span
												{...row.getToggleRowExpandedProps()}
											>
												{row.isExpanded ? "👇" : "👉"}{" "}
												{firstCell.render("Cell")} (
												{row.subRows.length})
											</span>
										</>
									) : firstCell.isAggregated ? (
										firstCell.render("Aggregated")
									) : firstCell.isPlaceholder ? null : (
										firstCell.render("Cell")
									)}
								</div>
								{cells.map((cell) => {
									return (
										<div
											className="td"
											{...cell.getCellProps({
												className: cx({
													"group-placeholder":
														cell.isPlaceholder,
													"grouped-column-cell":
														cell.column.isGrouped,
													"grouped-cell":
														cell.isGrouped,
												}),
											})}
										>
											{cell.isGrouped ? (
												<>
													<span
														{...row.getToggleRowExpandedProps()}
													>
														{row.isExpanded
															? "👇"
															: "👉"}{" "}
														{cell.render("Cell")} (
														{row.subRows.length})
													</span>
												</>
											) : cell.isAggregated ? (
												cell.render("Aggregated")
											) : cell.isPlaceholder ? null : (
												cell.render("Cell")
											)}
										</div>
									);
								})}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

const Experiments: React.FC<{
	experiments: DVCExperimentsRepoJSONOutput | null;
}> = ({ experiments }) => (
	<div className="experiments">
		<h1>Experiments</h1>
		{experiments ? (
			<ExperimentsTable experiments={experiments} />
		) : (
			<p>Loading experiments...</p>
		)}
	</div>
);

export default Experiments;
