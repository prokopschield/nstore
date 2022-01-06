import { getConfig } from 'doge-config';
import fs from 'fs';
import nsblob from 'nsblob';
import path from 'path';
import get_size_string from './get_size_string';

const { file_size_limit } = getConfig('nsblob').num;

const last_known_hash = new Map<string, string>();

export default async function store_file(
	file: string
): Promise<string | undefined> {
	file = path.resolve(file);
	try {
		const stat = await fs.promises.stat(file);
		if (!stat.isFile()) {
			console.error(`${path.resolve('.', file)} is not a file.`);
			return last_known_hash.get(file);
		}
		const data = await fs.promises.readFile(file);
		if (data.length > file_size_limit) {
			console.error(
				`The size of ${path.resolve('.', file)} is ${get_size_string(
					data.length
				)}, which exceeds the ${get_size_string(
					file_size_limit
				)} limit.`
			);
			return last_known_hash.get(file);
		}
		const hash = await nsblob.store(data);
		if (hash) {
			last_known_hash.set(file, hash);
			return hash;
		}
	} catch (error) {
		console.error(error);
	}
	return last_known_hash.get(file);
}
