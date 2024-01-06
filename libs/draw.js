let draw = {
	Geometry: class {
		#path;
		#color;

		constructor({ color, pathInitializer }) {
			this.color = color;
			this.path = new Path2D();
			pathInitializer(this.path);
		}

		stroke(ctx) {
			if (this.color != undefined) ctx.strokeStyle = this.color;
			ctx.stroke(this.path);
		}
	}

	, randomColor({
		r = { min: 0, max: 255 }
		, g = { min: 0, max: 255 }
		, b = { min: 0, max: 255 }
	}) {
		return "rgb("
			+ (Math.random() * (r.max - r.min) + r.min)
			+ ", " + (Math.random() * (g.max - g.min) + g.min)
			+ ", " + (Math.random() * (b.max - b.min) + b.min)
			+ ")";
	}
}

draw.Drawing = class {
	#inited = false;

	constructor({ id, autoClear = true, initializeCallback, mouseMoveCallback }) {
		this.autoClear = autoClear;

		this.context = this.getContext(id);

		if (this.context != undefined) {
			if (initializeCallback != undefined) initializeCallback(this.context);
			if (mouseMoveCallback != undefined) this.context.canvas.onmousemove = mouseMoveCallback;
		}
	}

	getContext(id) {
		let canvas = document.getElementById(id);
		let context;
		if (canvas && canvas.getContext) context = canvas.getContext("2d");

		if (context == undefined) {
			alert("Can't get " + id + " canvas 2d context");
		}

		return context;
	}

	initialize() { }

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
			this.initialize();
			this.#inited = true;
		}

		if (this.autoClear) this.clear();
	}

	get width() { return this.context.canvas.width }
	get height() { return this.context.canvas.height }
};

draw.TransformedDrawing = class extends draw.Drawing {
	#offset = new math.Vector(0, 0); //in world
	#zoomIndex = 0;
	#zoom = 1;
	#worldMouse;

	constructor({
		id, tipId
		, autoClear = true
		, unit = ""
		, panButton = 0, resetButton = 1
		, zoomPow = 1.1
		, initialZoomIndex = 0, initialOffset = new math.Vector(0, 0)
		, showGrid = true, showAxis = true, showCoords = true
	}) {
		super({ id: id, autoClear: autoClear });

		this.buildTipCanvas();

		this.zoomPow = zoomPow;
		this.panButton = panButton;
		this.resetButton = resetButton;
		this.unit = unit;
		this.initialZoomIndex = initialZoomIndex;
		this.initialOffset = initialOffset;
		this.showGrid = showGrid;
		this.showAxis = showAxis;
		this.showCoords = showCoords;
	}

	buildTipCanvas(id) {
		let canvas = this.context.canvas;
		let tipId = "tip" + canvas.id;

		let tipCanvas = document.createElement('canvas');

		tipCanvas.id = tipId;
		tipCanvas.width = this.width / 2.0;
		tipCanvas.height = this.width / 25;
		tipCanvas.style.position = "relative";
		tipCanvas.style.right = (this.width / 2.0) + "px";
		tipCanvas.style.backgroundColor = "transparent";

		canvas.parentNode.insertBefore(tipCanvas, canvas.nextSibling);

		this.tipContext = this.getContext(tipId);
		this.tipContext.fillStyle = "rgb(255,255, 255)";
		this.tipContext.font = "" + (tipCanvas.width / 20) + "px serif";
		this.tipContext.textAlign = "right";
		this.tipContext.textBaseline = "bottom";
	}

	initialize() {
		this.context.strokeStyle = "rgb(255,255, 255)";
		this.initializeEvents();
	}

	initializeEvents() {
		let canvas = this.context.canvas;

		canvas.addEventListener("pointerdown", (event) => {
			if (event.button == this.panButton) {
				this.panDown = true;
				this.panPosition = this.getPointerPos(event);
				canvas.setPointerCapture(event.pointerId);
			}
		});
		canvas.addEventListener("pointerup", (event) => {
			if (event.button == this.panButton) {
				canvas.releasePointerCapture(event.pointerId);
				this.panDown = false;
			}
			else if (event.button == this.resetButton) {
				this.onReset();
			}
		});
		canvas.addEventListener("pointermove", (event) => {
			let pos = this.getPointerPos(event);
			this.#worldMouse = this.canvasToWorld(pos);

			if (this.panDown) {
				let dP = pos.sub(this.panPosition);
				this.panPosition = pos;
				this.onPan(dP);
			}

			this.drawTip();
		});
		canvas.addEventListener("wheel", event => {
			let canvasPos = this.getPointerPos(event);
			this.onZoom(canvasPos, Math.sign(event.deltaY));
			this.drawTip();
		});
	}

	onPan(pan) {
		this.#offset = this.#offset.add(
			pan.mul(1.0 / this.#zoom)
		);
		this.draw();
	}

	setZoomIndex(zoomIndex) {
		this.#zoomIndex = zoomIndex;
		this.#zoom = Math.pow(this.zoomPow, this.#zoomIndex);
	}

	onZoom(canvasPos, direction) {
		let previousWorldPos = this.canvasToWorld(canvasPos);
		this.setZoomIndex(this.#zoomIndex - direction);
		let newWorldPos = this.canvasToWorld(canvasPos);

		let dP = newWorldPos.sub(previousWorldPos);

		this.#offset = this.#offset.add(dP);

		this.draw();
	}

	onReset() {
		this.#offset = this.initialOffset;
		this.setZoomIndex(this.initialZoomIndex);
		this.draw();
	}

	//convert windows to local math canvas (0 centered y up)
	canvasTransform(pos) {
		return new math.Vector(pos.x - this.width / 2.0, this.height / 2.0 - pos.y);
	}

	getPointerPos(event) {
		return this.canvasTransform(new math.Vector(event.offsetX, event.offsetY));
	}

	getCanvasWorldBounds() {
		return {
			min: this.canvasToWorld(this.canvasTransform(new math.Vector(0, this.height)))
			, max: this.canvasToWorld(this.canvasTransform(new math.Vector(this.width, 0)))
		}
	}

	canvasToWorld(pos) {
		return pos.mul(1.0 / this.#zoom).sub(this.#offset);
	}

	draw() {
		super.draw();

		this.context.transform(1, 0, 0, 1, this.width / 2, this.height / 2); // canvas 0 is center
		this.context.transform(this.#zoom, 0, 0, -1 * this.#zoom, 0, 0); // zoom and inverse y
		this.context.transform(1, 0, 0, 1, this.#offset.x, this.#offset.y); // apply world offset

		this.drawGrid();

		this.transformedDraw();

		this.context.setTransform();
	}

	transformedDraw() {
	}

	drawTip() {
		let ctx = this.tipContext;
		if (ctx != undefined && this.showCoords && this.#worldMouse != undefined) {
			this.clearContext(ctx);
			ctx.fillText(
				this.getValueUnitString(this.#worldMouse.x) + ", "
				+ this.getValueUnitString(this.#worldMouse.y)
				, ctx.canvas.width - 2, ctx.canvas.height
			);
		}
	}

	drawGrid() {
		let ctx = this.context;
		let subdivision = 10;
		let step = this.width / subdivision / this.#zoom;
		this.unitStep = Math.pow(10, Math.ceil(Math.log10(step)));

		if (this.showGrid || this.showAxis) {
			ctx.strokeStyle = "rgb(255,255, 255)";

			let bounds = this.getCanvasWorldBounds();

			let min = (bounds.min.mul(1.0 / this.unitStep)).ceil().mul(this.unitStep);

			for (let s = -10; s < subdivision * 10; ++s) {
				let offset = s * this.unitStep / 10.0;

				let y = offset + min.y;
				if (y == 0 && this.showAxis) {
					ctx.lineWidth = 1.0 / this.#zoom;
					ctx.strokeStyle = "rgb(255, 0, 0)";
				}
				else {
					ctx.strokeStyle = "rgb(255, 255, 255)";
					ctx.lineWidth = ((s % 10) == 0 ? 0.6 : 0.2) / this.#zoom;
				}

				if (this.showGrid || y == 0) {
					ctx.beginPath();
					ctx.moveTo(bounds.min.x, y);
					ctx.lineTo(bounds.max.x, y);
					ctx.stroke();
				}

				let x = offset + min.x;
				if (x == 0 && this.showAxis) {
					ctx.lineWidth = 1.0 / this.#zoom;
					ctx.strokeStyle = "rgb(0, 255, 0)";
				}
				else {
					ctx.strokeStyle = "rgb(255, 255, 255)";
					ctx.lineWidth = ((s % 10) == 0 ? 0.6 : 0.2) / this.#zoom;
				}

				if (this.showGrid || x == 0) {
					ctx.beginPath();
					ctx.moveTo(x, bounds.min.y);
					ctx.lineTo(x, bounds.max.y);
					ctx.stroke();
				}
			}
		}

		if (this.showGrid) {
			let transform = ctx.getTransform();
			ctx.setTransform();
			ctx.font = "" + (this.width / 30) + "px serif";
			ctx.fillStyle = "rgb(255,255, 255)";
			ctx.fillText(this.getValueUnitString(this.unitStep), 10, this.height - 10);
			ctx.setTransform(transform);
		}
	}

	getValueUnitString(value) {
		let str = "";

		if (this.unitStep >= 1e6) {
			str += Math.round((value / 1e6) * 1e2) / 1e2 + " M";
		}
		else if (this.unitStep >= 1e3) {
			str += Math.round(value / 1e3 * 1e2) / 1e2 + " K";
		}
		else if (this.unitStep >= 1) {
			str += Math.round(value * 1e2) / 1e2 + " ";
		}
		else {
			str += Math.round(value / 1e-3 * 1e2) / 1e2 + " m";
		}

		return str + this.unit;
	}
};


//Geometry
draw.Circle = class extends draw.Geometry {
	constructor({ color, position, radius }) {
		super({
			color: color
			, pathInitializer: p => p.arc(position.x, position.y, radius, 0, 2 * Math.PI)
		});
	}
};

draw.Line = class extends draw.Geometry {
	constructor({ color, p0, p1 }) {
		super({
			color: color
			, pathInitializer: p => {
				p.moveTo(p0.x, p0.y);
				p.lineTo(p1.x, p1.y);
			}
		});
	}
};