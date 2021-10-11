import fs from 'fs';
import { JSDOM } from 'jsdom';
import nsblob from 'nsblob';
import io from 'serial-async-io';
import path from 'path';
import expand from './expand';

export default async function clone(hash: string) {
	try {
		const data = await nsblob.fetch(hash);
		const html = data.toString();
		const { window } = new JSDOM(html);
		const { document } = window;
		const title = document.querySelector('title');
		if (!title) throw `Error: ${hash} does not contain a valid title!`;
		const match = title.innerHTML.match(/Index of (.+)\//);
		if (!match) throw `Error: ${hash} has an invalid title!`;
		const { name } = path.parse(match[1]);
		const index = `${name}.html`;
		if (fs.existsSync(index)) {
			throw `File exists: ${index}`;
		}
		await io.write(index, data);
		return await expand(index);
	} catch (error) {
		console.error(error);
	}
}
