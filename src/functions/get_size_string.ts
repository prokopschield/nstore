import { cacheFn } from 'ps-std/lib/functions/cacheFn';

const sizes = ['', 'bytes', 'kB', 'MB', 'GB', 'TB'];

function get_size_string(size: number) {
	let sizes_index = 0;
	while (++sizes_index < sizes.length && size > 1024) {
		size /= 1024;
	}
	size *= 100;
	size = Math.floor(size);
	size /= 100;
	return `${size} ${sizes[sizes_index]}`;
}

export default cacheFn(get_size_string);
