draw.appendCanvas = function ({ container, initializeCallback }) {
	let context;
	let canvas = document.createElement("canvas");

	initializeCallback(canvas);

	container.appendChild(canvas);
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;

	context = canvas.getContext("2d");

	if (context == undefined) {
		console.error("Can't get " + containerId + " canvas 2d context");
	}

	return context;
}

draw.Drawing = class {
	#inited = false;
	get inited() { return this.#inited; }

	#containerId;
	get containerId() { return this.#containerId; }

	#container;
	get container() { return this.#container; }

	#initializeCallback;
	context;
	canvas;

	constructor({
		containerId
		, autoClear = true, autoResize = true
		, initializeCallback
	}) {
		this.autoClear = autoClear;
		this.autoResize = autoResize;
		this.#containerId = containerId;
		this.#initializeCallback = initializeCallback;
	}

	initialize(initializeCallback) {
		this.#container = document.getElementById(this.containerId);

		if (this.container != undefined) {
			this.container.style.position = "relative";

			this.context = draw.appendCanvas({
				container: this.container
				, initializeCallback: (canvas) => {
					canvas.style.width = "100%";
					canvas.style.height = "100%";
				}
			});

			if (this.context != undefined) {
				this.canvas = this.context.canvas;

				window.addEventListener('resize', this.onResize.bind(this));

				let subInit = true;
				if (initializeCallback != undefined) {
					subInit = initializeCallback();
				}

				this.#inited = subInit;
			}
		}
		else {
			console.error("Invalid container id : " + this.containerId);
		}
	}

	onResize() {
		if (this.autoResize) {
			this.canvas.width = this.canvas.clientWidth;
			this.canvas.height = this.canvas.clientHeight;
			this.draw();
		}
	}

	clear() {
		this.clearContext(this.context);
	}

	clearContext(context) {
		context.clearRect(
			0, 0, context.canvas.width, context.canvas.height
		)
	}

	draw() {
		if (!this.#inited) {
			this.initialize(this.#initializeCallback);
		}

		if (this.#inited) {
			if (this.autoClear) this.clear();
		}
	}

	get width() { return this.context.canvas.width }
	get height() { return this.context.canvas.height }

	get size() { return new math.Vector(this.width, this.height) }
};