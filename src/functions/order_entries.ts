export function is_letter(letter: string) {
	return (letter >= 'A' && letter <= 'Z') || (letter >= 'a' && letter <= 'z');
}

export function compare_strings(left: string, right: string): -1 | 1 {
	for (let i = 0; i < left.length; ++i) {
		const a = is_letter(left[i]);
		const b = is_letter(right[i]);
		if (a && !b) return -1;
		else if (b && !a) return 1;
		else if (left[i] > right[i]) return 1;
		else if (left[i] < right[i]) return -1;
		else continue;
	}
	return left.length > right.length ? 1 : -1;
}

export default function order_entries(
	...entries: [string, [boolean, string]][]
): [string, [boolean, string]][] {
	return entries.sort(([aa, [ab, ac]], [ba, [bb, bc]]) =>
		compare_strings(aa, ba)
	);
}
