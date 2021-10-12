import fs from 'fs';
import { JSDOM } from 'jsdom';
import nsblob from 'nsblob';
import path from 'path';
import io from 'serial-async-io';

export default async function expand(file_i: string): Promise<number> {
	try {
		const stat = await fs.promises.stat(file_i);
		if (stat.isDirectory()) {
			const rd = (await fs.promises.readdir(file_i)).map((f) =>
				path.resolve(file_i, f)
			);
			let expanded = 0;
			for (const file_s of rd) {
				try {
					const parsed = path.parse(file_s);
					const stat = await fs.promises.stat(file_s);
					if (stat.isDirectory() || parsed.ext === '.html') {
						expanded += await expand(file_s);
					}
				} catch (error) {
					console.error(error);
				}
			}
			return expanded;
		} else {
			const parsed_name = path.parse(file_i);
			const dirname = parsed_name.name;
			const dir = path.resolve(file_i, '..', dirname);
			const data = await io.read(file_i);
			const html = data.toString();
			const datamap = new Map<string, Buffer>();
			const DOM = new JSDOM(html);
			const { window } = DOM;
			const { document } = window;
			const { documentElement } = document;
			const links = documentElement.querySelectorAll('a');
			const matches = [...links].map((link) =>
				link.href.match(/([0-9a-f]{64})\/(.*)/)
			);
			if (!matches?.length) return 0;
			const promises = Array<Promise<void>>();
			for (const match of matches) {
				if (!match)
					throw `${file_i} is not a valid nstore compacted file.`;
				const [, hash, name] = match;
				if (path.basename(name) !== name) {
					throw `${file_i} was maliciously crafted to cause damage and was not processed.`;
				}
				promises.push(
					nsblob.fetch(hash).then((data) => {
						datamap.set(name, data);
					})
				);
			}
			await Promise.all(promises);
			if (fs.existsSync(dir)) {
				throw `${dir} exists!`;
			} else {
				await fs.promises.mkdir(dir);
			}
			for (const [filename, data] of datamap.entries()) {
				const file = path.resolve(
					dir,
					path.relative('/', path.resolve('/', filename))
				);
				process.stdout.write(`Writing ${path.relative('.', file)}...`);
				await io.write(file, data);
				process.stdout.write(` ✔️\r\n`);
			}
			await fs.promises.unlink(file_i);
			return promises.length + (await expand(dir));
		}
	} catch (error) {
		console.error(error);
		return 0;
	}
}
