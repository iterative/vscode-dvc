import { accessSync } from "fs";
import * as path from "path";
import { execPromise } from "./util";

interface DVCExtensionOptions {
	bin: string;
	cwd: string;
}

type DVCExperimentId = "baseline" | string;
export interface DataFileDict {
	[name: string]: string | DataFileDict;
}
export interface DataFilesDict {
	[filename: string]: DataFileDict;
}
interface DVCExperimentCore {
	name?: string;
	timestamp: Date;
	params: DataFilesDict;
	metrics: DataFilesDict;
	queued: boolean;
}
export interface DVCExperiment extends DVCExperimentCore {
	experimentId: DVCExperimentId;
	commitId: DVCCommitId;
	checkpointTip: string;
}
interface DVCExperimentJSONOutput extends DVCExperimentCore {
	checkpoint_tip: string;
}

type DVCCommitId = "workspace" | string;
type DVCExperimentsCommitJSONOutput = Record<
	DVCExperimentId,
	DVCExperimentJSONOutput
>;

type DVCExperimentsRepoJSONOutput = Record<
	DVCCommitId,
	DVCExperimentsCommitJSONOutput
>;

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

export const getExperiments: (
	options: DVCExtensionOptions
) => Promise<DVCExperiment[]> = async (options) => {
	const { stdout } = await execCommand(options, "exp show --show-json");
	const experiments = Object.entries(
		JSON.parse(String(stdout)) as DVCExperimentsRepoJSONOutput
	).reduce<DVCExperiment[]>(
		(acc, [commitId, commitData]) => [
			...acc,
			...Object.entries(commitData).map(
				([
					experimentId,
					{ checkpoint_tip: checkpointTip, ...experiment },
				]) => {
					return {
						experimentId,
						commitId,
						...experiment,
						checkpointTip,
					};
				}
			),
		],
		[]
	);

	return experiments;
};
