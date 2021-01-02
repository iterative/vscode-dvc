import {
  FileSystemError
} from 'vscode';
import * as fs from 'fs';
import { normalizeNFC } from './stringUtils';

function processError(error: Error & { code?: string }): Error {
	if (error.code === 'ENOENT') {
		return FileSystemError.FileNotFound();
	}
	if (error.code === 'EISDIR') {
		return FileSystemError.FileIsADirectory();
	}
	if (error.code === 'EEXIST') {
		return FileSystemError.FileExists();
	}
	if (error.code === 'EPERM' || error.code === 'EACCESS') {
		return FileSystemError.NoPermissions();
	}
  return error;
}

function handleResult<T>({ resolve, reject, error, result }: { resolve: (result: T) => void; reject: (error: Error) => void; error: Error | null | undefined; result: T; }): void {
  if (error) {
		reject(processError(error));
	} else {
		resolve(result);
	}
}

export function exists(path: string): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    fs.exists(path, exists => handleResult({ resolve, reject, error: null, result: exists }));
  });
}

export function readdir(path: string): Promise<string[]> {
  return new Promise<string[]>((resolve, reject) => {
    fs.readdir(path, (error, children) => handleResult({ resolve, reject, error, result: normalizeNFC(children) }));
  });
}

export function stat(path: string): Promise<fs.Stats> {
  return new Promise<fs.Stats>((resolve, reject) => {
    fs.stat(path, (error, stat) => handleResult({ resolve, reject, error, result: stat }));
  });
}
