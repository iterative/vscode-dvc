import * as React from "react";
import { DVCExperiment, DataFileDict } from "dvc-integration/src/DvcReader";
import dayjs from "../dayjs";
import {
	Column,
	ColumnInstance,
	useTable,
	useGroupBy,
	useExpanded,
	useSortBy,
	useFlexLayout,
} from "react-table";
import cx from "classnames";

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
	experiments: DVCExperiment[];
	accessor: keyof DVCExperiment;
}) => Column<DVCExperiment> = ({ Header, accessor, experiments }) => {
	return {
		Header,
		accessor,
		disableSortBy: true,
		columns:
			!experiments || experiments.length === 0
				? []
				: buildColumnsFromSampleObject(
						experiments[0][accessor] as DataFileDict,
						[accessor]
				  ),
	};
};

const TruncatedCell = ({ value }: { value: string }) =>
	value && value.length && value.length > 12
		? `${value.slice(0, 4)}...${value.slice(value.length - 4)}`
		: value;

const Blank = <i>Blank</i>;

export const ExperimentsTable: React.FC<{ experiments: DVCExperiment[] }> = ({
	experiments,
}) => {
	const columns = React.useMemo<ColumnInstance<DVCExperiment>[]>(() => {
		return [
			{
				Header: "Commit",
				accessor: "commitId",
				Cell: TruncatedCell,
			},
			{
				Header: "Experiment",
				accessor: "experimentId",
				Cell: TruncatedCell,
				disableGroupBy: true,
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
				experiments,
			}),
			buildNestedColumnFromExperiments({
				Header: "Metrics",
				accessor: "metrics",
				experiments,
			}),
			{
				Header: "Queued",
				accessor: "queued",
			},
		] as ColumnInstance<DVCExperiment>[];
	}, [experiments]);
	const initialState = React.useMemo(
		() => ({
			groupBy: ["commitId"],
		}),
		[]
	);
	const defaultColumn: Partial<Column<DVCExperiment>> = React.useMemo(
		() => ({
			width: 120,
			Cell: ({ value }: { value?: string | number }) => {
				return value === ""
					? Blank
					: typeof value === "number"
					? value.toLocaleString(undefined, {
							maximumFractionDigits: 2,
					  })
					: value;
			},
		}),
		[]
	);
	const {
		getTableProps,
		getTableBodyProps,
		prepareRow,
		toggleAllRowsExpanded,
		flatHeaders,
		headers,
		columns: instanceColumns,
		groupedColumns,
		sortedColumns,
		headerGroups,
		rows,
	} = useTable<DVCExperiment>(
		{
			columns,
			data: experiments,
			initialState,
			isMultiSortEvent: () => true,
			defaultColumn,
		},
		useGroupBy,
		useSortBy,
		useExpanded,
		useFlexLayout,
		(hooks) => {
			hooks.useInstance.push((instance) => {
				const { headerGroups } = instance;
				const [groupedColumns, sortedColumns] = (headerGroups[
					headerGroups.length - 1
				].headers as ColumnInstance<DVCExperiment>[]).reduce<
					[
						ColumnInstance<DVCExperiment>[],
						ColumnInstance<DVCExperiment>[]
					]
				>(
					([groupedAcc, sortedAcc], column) => [
						column.isGrouped ? [...groupedAcc, column] : groupedAcc,
						column.isSorted ? [...sortedAcc, column] : sortedAcc,
					],
					[[], []]
				);

				Object.assign(instance, { groupedColumns, sortedColumns });
			});
		}
	);

	React.useEffect(() => {
		toggleAllRowsExpanded(true);
	}, []);

	const ColumnOptionSelector: React.FC<{
		label: string;
		columns: ColumnInstance<DVCExperiment>[];
		Button: React.FC<ColumnInstance<DVCExperiment>>;
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
			{sortedColumns.length > 0 && (
				<ColumnOptionSelector
					label="Sorts"
					columns={sortedColumns}
					Button={({
						getSortByToggleProps,
						render,
						isSortedDesc,
					}) => (
						<button {...getSortByToggleProps()}>
							{render("Header")} ({isSortedDesc ? "DESC" : "ASC"})
						</button>
					)}
				/>
			)}
			{groupedColumns.length > 0 && (
				<ColumnOptionSelector
					label="Groups"
					columns={groupedColumns}
					Button={({ getGroupByToggleProps, render }) => (
						<button {...getGroupByToggleProps()}>
							{render("Header")}
						</button>
					)}
				/>
			)}
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
								className="th"
								{...column.getHeaderProps(
									column.getSortByToggleProps({
										className: cx({
											"grouped-header": column.isGrouped,
										}),
									})
								)}
							>
								<div>{column.render("Header")}</div>
								<div>
									<span>
										{column.isSorted
											? column.isSortedDesc
												? " (^)"
												: " (v)"
											: ""}
									</span>
									{column.isGrouped ? (
										<span
											{...column.getGroupByToggleProps()}
										>
											{" "}
											<span>(X)</span>
										</span>
									) : column.canGroupBy ? (
										// If the column can be grouped, let's add a toggle
										<>
											{" "}
											<span
												{...column.getGroupByToggleProps()}
											>
												(G)
											</span>
										</>
									) : null}
								</div>
							</span>
						))}
					</div>
				</div>
				<div className="tbody" {...getTableBodyProps()}>
					{rows.map((row) => {
						prepareRow(row);
						return (
							<div className="tr" {...row.getRowProps()}>
								{row.cells.map((cell) => {
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

const Experiments: React.FC<{ experiments: DVCExperiment[] | null }> = ({
	experiments,
}) => (
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
