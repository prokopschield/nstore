#!/usr/bin/env node

import { functions } from '.';

function main() {
	const flags: {
		[index: string]: boolean;
	} = {
		'-': false,
		h: false,
	};

	const stack = [];

	function color(n: number = 0, t: string = '') {
		return `\x1b[${n}m${t}`;
	}

	function printc(...a: [number, string][]) {
		console.log(a.map((a) => color(...a)).join(' ') + color());
	}

	function runtime_error(e: string) {
		console.error(e);
		process.exit(1);
	}

	function runtime_exit() {
		if (prog?.includes('nsmt')) {
			printc([32, 'Program terminated, nsmt detected, not exiting.']);
		} else {
			process.exit(0);
		}
	}

	for (const arg of process.argv) {
		switch (arg) {
			case '--help': {
				flags.h = true;
				continue;
			}
		}
		if (arg[0] === '-') {
			for (const L of arg) {
				if (L in flags) {
					flags[L] = true;
				} else {
					return runtime_error(`Unknown flag: -${L} in ${arg}`);
				}
			}
			continue;
		}
		stack.push(arg);
	}

	const [node, prog, cmdi, ...args] = stack as (string | undefined)[];

	const cmd = `${cmdi}`.toLowerCase();

	if (flags.h || !args.length || !(cmd in functions)) {
		switch (cmd) {
			case 'compact': {
				printc(
					[0, 'Syntax:'],
					[31, 'nstore compact'],
					[32, '[...folders]']
				);
				return runtime_exit();
			}
			case 'store': {
				printc(
					[0, 'Syntax:'],
					[31, 'nstore store'],
					[32, '[...files]']
				);
				return runtime_exit();
			}
			case 'expand': {
				printc(
					[0, 'Syntax:'],
					[31, 'nstore expand'],
					[32, '[...files]']
				);
				return runtime_exit();
			}
			default: {
				printc(
					[32, 'Commands:'],
					[31, 'compact' + color(32) + ','],
					[31, 'expand' + color(32) + ','],
					[31, 'store']
				);
				printc([32, 'Try'], [31, 'nstore <command> --help']);
				return runtime_exit();
			}
		}
	}

	switch (cmd) {
		case 'cat': {
			(async function run() {
				for (const arg of args) {
					arg &&
						(await functions
							.cat(arg)
							.then((b) => process.stdout.write(b)));
				}
				runtime_exit();
			})();
			break;
		}

		default: {
			const cb = (functions as { [index: string]: Function })[cmd];
			if (!cb) {
				return runtime_error(`Command not found: ${cmd}`);
			}

			(async function run() {
				for (const arg of args) {
					if (arg) {
						printc([32, `Running ${cmd} ${arg}`]);
						try {
							const res = await cb(arg);
							res
								? printc([32, res])
								: printc([31, 'Execution failed.']);
						} catch (error) {
							printc([31, 'Error in execution:']);
							console.log(error);
						}
					}
				}
				return runtime_exit();
			})();
		}
	}
}

main();
