import { accessSync } from "fs";
import * as path from "path";
import { execPromise } from "./util";

interface DVCExtensionOptions {
	bin: string;
	cwd: string;
}

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

interface Experiment {
	sha: "baseline" | string;
	timestamp: Date;
	params: Record<string, string>;
	metrics: Record<string, string>;
	queued: boolean;
	label: string;
	name?: string;
	checkpointTip?: string;
}

interface ExperimentsRepo {
	sha: "workspace" | string;
	experiments: Experiment[];
}

export interface AllExperiments {
	workspace: ExperimentsRepo;
	experiments: ExperimentsRepo[];
}

const buildTableDataItem = (sha: string, data: any) => {
	return {
		...data,
		label: data.name || sha,
		sha,
	};
};

export const getTableData: (
	options: DVCExtensionOptions
) => Promise<AllExperiments> = async (options) => {
	const { stdout } = await execCommand(options, "exp show --show-json");
	const originalOutput = JSON.parse(String(stdout));
	const { workspace, ...rest } = originalOutput;
	const processedRest = Object.entries(rest)
		.sort()
		.map(([sha, value]) => buildTableDataItem(sha, value));
	const result = {
		workspace: buildTableDataItem("workspace", workspace),
		experiments: processedRest,
	};
	return result;
};
