import fs from 'fs';
import { JSDOM } from 'jsdom';
import nsblob from 'nsblob';
import path from 'path';
import io from 'serial-async-io';
import format from './format';
import order_entries from './order_entries';
import store from './store';

export default async function compact(file: string): Promise<string | false> {
	file = path.resolve(file);
	try {
		const stat = await fs.promises.stat(file);
		if (stat.isDirectory()) {
			const files = (await fs.promises.readdir(file)).map(
				(name: string) => path.resolve(file, name)
			);
			const hashmap = new Map<string, [boolean, string]>();
			let ret = true;
			for (const file of files) {
				const is_dir = (await fs.promises.stat(file)).isDirectory();
				let hash = await compact(file);
				if (hash && fs.existsSync(file)) {
					hash = await compact(file);
				}
				if (hash) {
					hashmap.set(path.basename(file), [is_dir, hash]);
				} else ret = false;
			}
			if (ret) {
				const dirname = path.basename(path.resolve(file));
				const title_text = `Index of ${dirname}/`;
				const { window } = new JSDOM();
				const { document } = window;
				const { documentElement } = document;
				const head = documentElement.querySelector('head');
				const title = document.createElement('title');
				head?.appendChild(title);
				title.innerHTML = title_text;
				const body = documentElement.querySelector('body');
				const header = document.createElement('h1');
				header.innerHTML = title_text;
				body?.appendChild(header);
				const ul = document.createElement('ul');
				const hashmap_entries = order_entries(...hashmap.entries());
				for (const [name, [is_dir, hash]] of hashmap_entries) {
					const li = document.createElement('li');
					const a = document.createElement('a');
					a.href = `../${dirname}/${hash}/${name}${
						is_dir ? '.html' : ''
					}`;
					a.innerHTML = `${name}${is_dir ? '/' : ''}`;
					li.appendChild(a);
					ul.appendChild(li);
				}
				body?.appendChild(ul);
				const html = format(documentElement.innerHTML);
				let html_fp = path.format({
					dir: path.dirname(file),
					name: path.basename(file),
					ext: '.html',
				});
				while (fs.existsSync(html_fp)) {
					console.error(`Index file ${html_fp} already exists!`);
					html_fp = html_fp.slice(0, html_fp.length - 5) + '.d.html';
				}
				await io.write(html_fp, html);
				const dirread = await fs.promises.readdir(file);
				for (const rdl of dirread) {
					const rf = path.resolve(file, rdl);
					const hash = await nsblob.store_file(rf);
					if (html.includes(hash)) {
						await fs.promises.unlink(rf);
					} else {
						const error = `Compact error: ${rf} processing failed!`;
						throw error;
					}
				}
				await fs.promises.rmdir(file);
				return await nsblob.store(html);
			} else return false;
		} else return await store(file, true);
	} catch (error) {
		console.error(error);
		return false;
	}
}
