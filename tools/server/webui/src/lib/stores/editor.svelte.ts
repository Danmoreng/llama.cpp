export class EditorStore {
	isOpen = $state(false);

	currentCode = $state(`<html lang="en">
	<style>
		body {
			display: flex;
			justify-content: center;
			align-items: center;
			font-family: "Segoe UI", sans-serif;
			width: 100vw;
			height: 100vh;
			overflow: hidden;
		}
	</style>
	<body>
		<h1>Hello World!</h1>
	</body>
</html>`);

	openEditor = () => (this.isOpen = true);

	closeEditor = () => (this.isOpen = false);

	toggleEditor = () => (this.isOpen = !this.isOpen);

	setCode = (v: string) => (this.currentCode = v);

	clearEditor = async () => {
		this.currentCode = '';
	};
}

export const editorStore = new EditorStore();
