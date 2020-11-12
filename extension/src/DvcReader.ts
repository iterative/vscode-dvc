import { accessSync } from "fs";
import * as path from "path";
import { execPromise } from "./util";

interface DVCExtensionOptions {
	bin: string;
	cwd: string;
}

export interface DataFileDict {
	[name: string]: string | DataFileDict;
}
export interface DataFilesDict {
	[filename: string]: DataFileDict;
}
interface DVCExperimentCommon {
	name?: string;
	timestamp: Date;
	params: DataFilesDict;
	metrics: DataFilesDict;
	queued: boolean;
}
export interface DVCExperiment extends DVCExperimentCommon {
	checkpointTip: string;
}
export interface DVCExperimentWithSha extends DVCExperiment {
	sha: string;
}
export interface DVCExperimentJSONOutput extends DVCExperimentCommon {
	checkpoint_tip: string;
}

type DVCCommitId = "workspace" | string;
interface DVCExperimentsCommitJSONOutput
	extends Record<string, DVCExperimentJSONOutput> {
	baseline: DVCExperimentJSONOutput;
}

export type DVCExperimentsRepoJSONOutput = Record<
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
) => Promise<DVCExperimentsRepoJSONOutput> = async (options) => {
	const { stdout } = await execCommand(options, "exp show --show-json");
	return JSON.parse(String(stdout));
};
