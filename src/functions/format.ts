import { format } from 'prettier';

export default function fmt(html: string): string {
	return format(html, {
		parser: 'html',
		singleQuote: true,
		tabWidth: 4,
		useTabs: true,
	});
}
