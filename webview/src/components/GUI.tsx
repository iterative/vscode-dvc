import * as React from "react";
import { observer } from "mobx-react";
import { Model } from "../model/Model";
import classnames = require("classnames");
import { hotComponent } from "../hotComponent";
import { inspect } from "util";
import {
	DVCExperiment,
	DataFilesDict,
	DataFileDict,
} from "dvc-integration/src/DvcReader";
import dayjs from "../dayjs";
import { Column, useTable } from "react-table";

const recursivelyBuildColumnsFromObject: (
	data: DataFileDict,
	parents?: string[]
) => Column<any>[] = (data, parents = []) => {
	return Object.entries(data).map(([fieldName, value]) => {
		const currentPath = [...parents, fieldName.replace(/\./gm, "\\.")];
		const base: {
			Header: string;
			accessor: string;
			columns?: Column<any>[];
		} = {
			Header: fieldName,
			accessor: currentPath.join("."),
		};
		if (typeof value === "object") {
			base.columns = recursivelyBuildColumnsFromObject(
				value,
				currentPath
			);
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
		columns: recursivelyBuildColumnsFromObject(
			experiments[0][accessor] as DataFileDict,
			[accessor]
		),
	};
};

const TruncatedCell = ({ value }: { value: string }) =>
	value.length > 12
		? `${value.slice(0, 4)}...${value.slice(value.length - 4)}`
		: value;

const ExperimentsTable: React.FC<{ experiments: DVCExperiment[] }> = ({
	experiments,
}) => {
	const columns = React.useMemo<Column<DVCExperiment>[]>(() => {
		return [
			{
				Header: "Commit",
				accessor: "commitId",
				Cell: TruncatedCell,
			},
			{
				Header: "Queued",
				accessor: "queued",
			},
			{
				Header: "ID",
				accessor: "experimentId",
				Cell: TruncatedCell,
			},
			{
				Header: "Time",
				accessor: "timestamp",
				Cell: ({ value }: { value: string }) =>
					value ? dayjs(value).fromNow() : "",
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
		].filter(Boolean) as Column<DVCExperiment>[];
	}, [experiments]);
	console.log(columns);
	const {
		getTableProps,
		getTableBodyProps,
		headerGroups,
		rows,
		prepareRow,
	} = useTable({ columns, data: experiments });
	return (
		<table {...getTableProps()}>
			<thead>
				{headerGroups.map((headerGroup) => (
					<tr {...headerGroup.getHeaderGroupProps()}>
						{headerGroup.headers.map((column) => (
							<th {...column.getHeaderProps()}>
								{column.render("Header")}
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
									<td {...cell.getCellProps()}>
										{cell.render("Cell")}
									</td>
								);
							})}
						</tr>
					);
				})}
			</tbody>
		</table>
	);
};

export const GUI: React.FC<{ model: Model }> = hotComponent(module)(
	observer(({ model }) => {
		try {
			const { experiments } = model;
			return (
				<div className="experiments">
					<h1>Experiments</h1>
					{experiments ? (
						<ExperimentsTable experiments={experiments} />
					) : (
						<p>Loading experiments...</p>
					)}
				</div>
			);
		} catch (e) {
			return <p>{e.toString()}</p>;
		}
	})
);
