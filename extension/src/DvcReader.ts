import { accessSync } from "fs";
import * as path from "path";
import { execPromise } from "./util";

interface DVCExtensionOptions {
	bin: string;
	cwd: string;
}

type DVCExperimentId = "baseline" | string;
type DataFileDict = Record<string, Record<string, string | number>>;
export interface DVCExperiment {
	id: string;
	name?: string;
	timestamp: Date;
	params: DataFileDict;
	metrics: DataFileDict;
	queued: boolean;
	checkpoint_tip: string;
}
type DVCExperimentJSONOutput = Omit<DVCExperiment, "id">

type DVCCommitId = "workspace" | string;
type DVCExperimentsCommitJSONOutput = Record<DVCExperimentId, DVCExperimentJSONOutput>;
export interface DVCExperimentsCommit {
	id: DVCExperimentId;
	experiments: DVCExperiment[];
}

type DVCExperimentsRepoJSONOutput = Record<
	DVCCommitId,
	DVCExperimentsCommitJSONOutput
>;
export type DVCExperimentsRepo = DVCExperimentsCommit[];

export const inferDefaultOptions: (
	cwd: string
) => Promise<DVCExtensionOptions> = async (cwd) => {
	const envDvcPath = path.resolve(cwd || ".", ".env", "bin", "dvc");
	let bin;
	try {
		accessSync(envDvcPath);
		bin = envDvcPath;
	} catch (e) {
		bin = "dvc";
	}
	return {
		bin,
		cwd,
	};
};

const execCommand: (
	options: DVCExtensionOptions,
	command: string
) => Promise<{ stdout: string; stderr: string }> = ({ bin, cwd }, command) =>
	execPromise(`${bin} ${command}`, {
		cwd,
	});

export const getTableData: (
	options: DVCExtensionOptions
) => Promise<DVCExperimentsRepo> = async (options) => {
	const { stdout } = await execCommand(options, "exp show --show-json");
	return Object.entries(
		JSON.parse(String(stdout)) as DVCExperimentsRepoJSONOutput
	).map(([commitId, commitData]) => ({
		id: commitId,
		experiments: Object.entries(commitData).map(
			([experimentId, experimentData]) => ({
				id: experimentId,
				...experimentData,
			})
		),
	}));
};
