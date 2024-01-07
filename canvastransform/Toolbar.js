ToolBar = class {
	#toolModes;
	#toolMode;

	get toolMode() { return this.#toolMode; }

	#fullscreenButton;

	browseModes(browser) {
		this.#toolModes.forEach(v => {
			let button = document.getElementById(v);
			browser(v, button);
		});
	}

	updateToolButtons() {
		this.browseModes((mode, button) => {
			button.className = (mode == this.#toolMode ? "active" : "");
		});
	}

	setToolMode(mode) {
		this.#toolMode = mode;
		this.updateToolButtons();
	}

	initToolButtons() {
		this.browseModes((mode, button) => {
			button.addEventListener("click", (event) => {
				this.setToolMode(mode);
			});
		});

		this.updateToolButtons();
	}

	updateFullScreenImg(fullscreen) {
		let img = this.#fullscreenButton.getElementsByTagName('img')[0];
		img.src = "icons/" + (fullscreen ? "exit" : "") + "fullscreen.png";
	}

	constructor({
		toolModes, defaultToolMode
		, buttonMappings, fullscreenButtonId
	}) {
		this.#toolModes = toolModes;
		this.#toolMode = defaultToolMode;

		buttonMappings.forEach(m => {
			let button = document.getElementById(m.buttonId);
			if (fullscreenButtonId == m.buttonId) {
				this.#fullscreenButton = button;
			}
			button.addEventListener("click", event => m.callback());
		});

		this.initToolButtons();
	}
}