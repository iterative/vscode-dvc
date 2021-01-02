import * as vscode from 'vscode';
import * as fs from 'fs';

export class FileInfo implements vscode.FileStat {

	constructor(private fsStat: fs.Stats) {		
	}

	get type(): vscode.FileType {
		let fileType: vscode.FileType = vscode.FileType.File;
		if (this.fsStat.isDirectory()) {
			fileType = vscode.FileType.Directory;
		}
		else if (this.fsStat.isSymbolicLink()) {
			fileType = vscode.FileType.SymbolicLink;
		}
		else {
			fileType = vscode.FileType.Unknown;
		} 
		return fileType;
	}

	get isFile(): boolean | undefined {
		return this.fsStat.isFile();
	}

	get isDirectory(): boolean | undefined {
		return this.fsStat.isDirectory();
	}

	get isSymbolicLink(): boolean | undefined {
		return this.fsStat.isSymbolicLink();
	}

	get size(): number {
		return this.fsStat.size;
	}

	get ctime(): number {
		return this.fsStat.ctime.getTime();
	}

	get mtime(): number {
		return this.fsStat.mtime.getTime();
	}
}