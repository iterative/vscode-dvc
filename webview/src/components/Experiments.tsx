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
} from "react-table";
import cx from "classnames";

const arrayAccessor: <T = string>(
	pathArray: string[]
) => (originalRow: any) => T = (pathArray) => (originalRow) =>
	pathArray.reduce((acc, cur) => acc[cur], originalRow);

const recursivelyBuildColumnsFromObject: (
	data: DataFileDict,
	parents?: string[]
) => Column<any>[] = (data, parents = []) => {
	return Object.entries(data).map(([fieldName, value]) => {
		const currentPath = [...parents, fieldName];
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
				columns: recursivelyBuildColumnsFromObject(value, currentPath),
			};
		}
		return base;
	});
};

const buildInferredColumn: (def: {
	Header: string;
	experiments: DVCExperiment[];
	accessor: keyof DVCExperiment;
}) => Column<DVCExperiment> | null = ({ Header, accessor, experiments }) => {
	if (!experiments || experiments.length <= 0) {
		return null;
	}
	return {
		Header,
		accessor,
		disableSortBy: true,
		columns: recursivelyBuildColumnsFromObject(
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
			buildInferredColumn({
				Header: "Params",
				accessor: "params",
				experiments,
			}),
			buildInferredColumn({
				Header: "Metrics",
				accessor: "metrics",
				experiments,
			}),
			{
				Header: "Queued",
				accessor: "queued",
			},
		].filter(Boolean) as ColumnInstance<DVCExperiment>[];
	}, [experiments]);
	const initialState = React.useMemo(
		() => ({
			groupBy: ["commitId"],
		}),
		[]
	);
	const {
		getTableProps,
		getTableBodyProps,
		prepareRow,
		toggleAllRowsExpanded,
		groupedColumns,
		sortedColumns,
		headerGroups,
		rows,
	} = useTable(
		{
			columns,
			data: experiments,
			initialState,
			isMultiSortEvent: () => true,
			defaultColumn: {
				Cell: (instance: any) => {
					console.log(instance);
					return instance.value === "" ? Blank : instance.value;
				},
			},
		},
		useGroupBy,
		useSortBy,
		useExpanded,
		(hooks) => {
			hooks.useInstance.push((instance) => {
				const { allColumns } = instance;
				const [groupedColumns, sortedColumns] = allColumns.reduce<
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

	return (
		<div>
			{sortedColumns.length > 0 && (
				<div>
					<b>Sorts: </b>
					{sortedColumns.map(
						({ getSortByToggleProps, render, isSortedDesc }) => (
							<button {...getSortByToggleProps()}>
								{render("Header")} (
								{isSortedDesc ? "DESC" : "ASC"})
							</button>
						)
					)}
				</div>
			)}
			{groupedColumns.length > 0 && (
				<div>
					<b>Grouped by: </b>
					{groupedColumns.map(({ getGroupByToggleProps, render }) => (
						<button {...getGroupByToggleProps()}>
							{render("Header")}
						</button>
					))}
				</div>
			)}
			<table {...getTableProps()}>
				<thead>
					{headerGroups.map((headerGroup) => (
						<tr {...headerGroup.getHeaderGroupProps()}>
							{headerGroup.headers.map((column) => (
								<th
									{...column.getHeaderProps(
										column.getSortByToggleProps({
											className: cx({
												"grouped-heading":
													column.isGrouped,
											}),
										})
									)}
								>
									{column.render("Header")}
									<span>
										{column.isSorted
											? column.isSortedDesc
												? " (DESC)"
												: " (ASC)"
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
										<span
											{...column.getGroupByToggleProps()}
										>
											{" "}
											<span>(grp)</span>
										</span>
									) : null}
								</th>
							))}
						</tr>
					))}
				</thead>
				<tbody {...getTableBodyProps()}>
					{rows.map((row) => {
						prepareRow(row);
						return (
							<tr {...row.getRowProps()}>
								{row.cells.map((cell) => {
									return (
										<td
											{...cell.getCellProps({
												className: cx({
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
										</td>
									);
								})}
							</tr>
						);
					})}
				</tbody>
			</table>
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
