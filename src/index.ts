import cat from './functions/cat';
import clone from './functions/clone';
import compact from './functions/compact';
import expand from './functions/expand';
import format from './functions/format';
import get_size_string from './functions/get_size_string';
import order_entries from './functions/order_entries';
import store_file from './functions/store_file';
import store from './functions/store';

import socket from './nodesite.eu';

export const functions = {
	cat,
	clone,
	compact,
	expand,
	format,
	get_size_string,
	order_entries,
	store_file,
	store,
};

export { socket };

export default { functions, socket };
