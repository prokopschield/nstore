import cat from './functions/cat';
import clone from './functions/clone';
import compact from './functions/compact';
import expand from './functions/expand';
import store from './functions/store';

import socket from './nodesite.eu';

export const functions = { cat, clone, compact, expand, store };
export { socket };

export default { functions, socket };
