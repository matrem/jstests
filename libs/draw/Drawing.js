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
	#containerId;
	get containerId() { return this.#containerId; }

	#container;
	get container() { return this.#container; }

	context;
	canvas;

	constructor({
		containerId,
		autoClear = true, autoResize = true
	}) {
		this.autoClear = autoClear;
		this.autoResize = autoResize;
		this.#containerId = containerId;
	}

	static build({
		containerId,
		autoClear = true, autoResize = true
		, initializeContextCallback
	}) {
		let d = new draw.Drawing({
			containerId: containerId, autoClear: autoClear, autoResize: autoResize
		});
		d.initialize(initializeContextCallback);
		return d;
	}

	initialize(initializeContextCallback) {
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

				window.addEventListener('resize', this.#onResize.bind(this));

				if (initializeContextCallback != undefined) initializeContextCallback(this.context);
			}
		}
		else {
			console.error("Invalid container id : " + this.containerId);
		}
	}

	#onResize() {
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
		if (this.autoClear && this.context != undefined) this.clear();
	}

	get width() { return this.context.canvas.width }
	get height() { return this.context.canvas.height }

	get size() { return new math.Vector(this.width, this.height) }
};