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
		this.canvas = document.getElementById(id);
		this.autoClear = autoClear;

		if (this.canvas && this.canvas.getContext) {
			this.context = this.canvas.getContext("2d");
		}

		if (this.context == undefined) {
			alert("Can't get " + id + "canvas 2d context");
		}
		else {
			if (initializeCallback != undefined) initializeCallback(this.context);
			if (mouseMoveCallback != undefined) this.canvas.onmousemove = mouseMoveCallback;
		}
	}

	initialize() { }

	clear() {
		this.context.clearRect(
			0, 0, this.context.canvas.width, this.context.canvas.height
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
	offset = new math.Vector(0, 0); //in world
	zoomIndex = 0;
	zoom = 1;

	constructor({ id, autoClear = true, zoomPow = 1.1, panButton = 0, resetButton = 1, unit = "", initialZoomIndex = 0, initialOffset = new math.Vector(0, 0) }) {
		super({ id: id, autoClear: autoClear });

		this.zoomPow = zoomPow;
		this.panButton = panButton;
		this.resetButton = resetButton;
		this.unit = unit;
		this.initialZoomIndex = initialZoomIndex;
		this.initialOffset = initialOffset;
	}

	initialize() {
		this.initializeEvents();
	}

	initializeEvents() {
		this.canvas.addEventListener("pointerdown", (event) => {
			if (event.button == this.panButton) {
				this.panDown = true;
				this.panPosition = this.getPointerPos(event);
				this.canvas.setPointerCapture(event.pointerId);
			}
		});
		this.canvas.addEventListener("pointerup", (event) => {
			if (event.button == this.panButton) {
				this.canvas.releasePointerCapture(event.pointerId);
				this.panDown = false;
			}
			else if (event.button == this.resetButton) {
				this.onReset();
			}
		});
		this.canvas.addEventListener("pointermove", (event) => {
			if (this.panDown) {
				let newPanPosition = this.getPointerPos(event);
				let dP = newPanPosition.sub(this.panPosition);
				this.panPosition = newPanPosition;
				this.onPan(dP);
			}
		});
		this.canvas.addEventListener("wheel", event => {
			let canvasPos = this.getPointerPos(event);
			this.onZoom(canvasPos, Math.sign(event.deltaY));
		});
	}

	onPan(pan) {
		this.offset = this.offset.add(
			pan.mul(1.0 / this.zoom)
		);
		this.draw();
	}

	setZoomIndex(zoomIndex) {
		this.zoomIndex = zoomIndex;
		this.zoom = Math.pow(this.zoomPow, this.zoomIndex);
	}

	onZoom(canvasPos, direction) {
		let previousWorldPos = this.canvasToWorld(canvasPos);
		this.setZoomIndex(this.zoomIndex - direction);
		let newWorldPos = this.canvasToWorld(canvasPos);

		let dP = newWorldPos.sub(previousWorldPos);

		this.offset = this.offset.add(dP);

		this.draw();
	}

	onReset() {
		this.offset = this.initialOffset;
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
		return pos.mul(1.0 / this.zoom).sub(this.offset);
	}

	draw() {
		super.draw();

		this.context.transform(1, 0, 0, 1, this.width / 2, this.height / 2); // canvas 0 is center
		this.context.transform(this.zoom, 0, 0, -1 * this.zoom, 0, 0); // zoom and inverse y
		this.context.transform(1, 0, 0, 1, this.offset.x, this.offset.y); // apply world offset

		this.drawGrid();

		this.transformedDraw();

		this.context.setTransform();
	}

	transformedDraw() {
	}

	drawGrid() {
		let ctx = this.context;

		ctx.strokeStyle = "rgb(255,255, 255)";

		let bounds = this.getCanvasWorldBounds();

		let subdivision = 10;
		let step = this.width / subdivision / this.zoom;
		step = Math.pow(10, Math.ceil(Math.log10(step)));

		let min = (bounds.min.mul(1.0 / step)).ceil().mul(step);
		let max = (bounds.max.mul(1.0 / step)).floor().mul(step);

		let width = max.x - min.x;
		let height = max.y - min.y;

		for (let s = -1; s < subdivision * 2; ++s) {
			ctx.lineWidth = ((s % 2) == 0 ? 0.6 : 0.2) / this.zoom;
			ctx.beginPath();
			ctx.moveTo(bounds.min.x, s * step / 2.0 + min.y);
			ctx.lineTo(bounds.max.x, s * step / 2.0 + min.y);
			ctx.stroke();
		}
		for (let s = -1; s < subdivision * 2; ++s) {
			ctx.lineWidth = ((s % 2) == 0 ? 0.6 : 0.2) / this.zoom;
			ctx.beginPath();
			ctx.moveTo(s * step / 2.0 + min.x, bounds.min.y);
			ctx.lineTo(s * step / 2.0 + min.x, bounds.max.y);
			ctx.stroke();
		}

		let transform = ctx.getTransform();
		ctx.setTransform();
		ctx.font = "" + (this.width / 30) + "px serif";
		ctx.fillStyle = "rgb(255,255, 255)";
		ctx.fillText(this.getStepString(step), 10, this.height - 10);

		ctx.setTransform(transform);
	}

	getStepString(step) {
		let str = "";

		if (step >= 1e6) {
			str += (step / 1e6) + " M";
		}
		else if (step >= 1e3) {
			str += (step / 1e3) + " K";
		}
		else if (step >= 1) {
			str += (step) + " ";
		}
		else {
			str += (step / 1e-3) + " m";
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