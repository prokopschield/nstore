import nsblob from 'nsblob';

export default async function cat(hash: string) {
	return await nsblob.fetch(hash);
}
