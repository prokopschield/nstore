import { blake2sHex } from 'blakets';
import fs from 'fs';
import { JSDOM } from 'jsdom';
import nsblob from 'nsblob';
import path from 'path';
import io from 'serial-async-io';
import socket from '../nodesite.eu';
import format from './format';
import order_entries from './order_entries';

export default async function store(
	file: string,
	returnFullIndex: boolean
): Promise<string | false> {
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
				let hash = await store(file, false);
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
				return returnFullIndex ? html : await nsblob.store(html);
			} else return false;
		} else {
			const data = await io.read(file);
			const bhash = blake2sHex(data);
			const rhash = await nsblob.store(data);
			const are_equal: boolean = await new Promise((resolve) => {
				socket.once(rhash, (rbhash: string) => {
					resolve(rbhash === bhash);
				});
				socket.emit('hash2blake', rhash);
			});
			if (are_equal) return rhash;
			else return false;
		}
	} catch (error) {
		console.error(error);
		return false;
	}
}
