export class EditorStore {
	currentCode = $state('<html lang="en"><body><h1>Hello World!</h1></body></html>');

	setCode = (v: string) => (this.currentCode = v);
	clearEditor = async () => {
		this.currentCode = '';
	};
}

export const editorStore = new EditorStore();
