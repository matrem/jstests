draw.TransformedDrawing = class extends draw.Drawing {
	#offset = new math.Vector(0, 0); //in world
	#largeWorldOffset = new math.Vector(0, 0);
	#largeWorldTile = 1000.0;
	#zoomIndex = 0;
	#zoom = 1;
	#zoomMouse = true;
	#pinPosition;
	#touches = [];
	#panButtonDown = false;
	#panPosition;
	#pinchPosition;
	#pointerMoved = false;

	get zoom() { return this.#zoom; };
	get offset() { return this.#offset; };
	get largeWorldOffset() { return this.#largeWorldOffset; }

	constructor({
		containerId
		, autoClear = true, autoTransform = true, largeWorld = false
		, unit = ""
		, panButton = 0, resetButton = 1
		, zoomPow = 1.1
		, initialZoomIndex = 0, initialOffset = new math.Vector(0, 0)
		, showGrid = true, showAxis = true, showCoords = true
	}) {
		super({ containerId: containerId, autoClear: autoClear });

		this.autoTransform = autoTransform;
		this.largeWorld = largeWorld;
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

	initialize(initializeCallback) {
		super.initialize(() => {

			let inited = true;
			if (initializeCallback != undefined) {
				inited = initializeCallback();
			}

			if (inited) {
				this.context.canvas.style.touchAction = "none";
				this.context.strokeStyle = "rgb(255,255, 255)";

				this.buildTipCanvas();

				this.initializeEvents();
			}

			return inited;
		});
	}

	setupTipCanvasSize(canvas) {
		let tipW = this.width / 2.0;
		let tipH = tipW / 15.0;

		canvas.width = tipW;
		canvas.height = tipH;

		this.tipContext.font = "" + (canvas.width / 20) + "px serif";
		this.tipContext.fillStyle = "rgb(255,255, 255)";
		this.tipContext.textAlign = "right";
		this.tipContext.textBaseline = "bottom";
	}

	buildTipCanvas() {
		this.tipContext = draw.appendCanvas({
			container: this.container
			, initializeCallback: (canvas) => {
				canvas.style.position = "absolute";
				canvas.style.right = "0px";
				canvas.style.bottom = "0px";
				canvas.style.backgroundColor = "transparent";
			}
		});

		this.setupTipCanvasSize(this.tipContext.canvas);
	}

	onResize() {
		super.onResize();

		this.setupTipCanvasSize(this.tipContext.canvas);
	}

	initializeEvents() {
		let canvas = this.context.canvas;

		canvas.addEventListener("pointerdown", (event) => {
			canvas.setPointerCapture(event.pointerId);

			if (event.pointerType == "touch") {
				this.#touches.push(event.pointerId);
			}

			if (event.pointerType == "mouse" && event.button == this.panButton || event.pointerType == "touch" && this.#touches.length == 1) {
				this.#panPosition = this.getPointerPos(event);
				if (event.pointerType == "mouse") this.#panButtonDown = true;
			}
			else if (event.pointerType == "touch" && this.#touches.length == 2) {
				this.#pinchPosition = this.getPointerPos(event);
			}
			else if (event.pointerType == "mouse" && event.button == this.resetButton || event.pointerType == "touch" && this.#touches.length == 3) {
				this.onReset();
			}
		});
		canvas.addEventListener("pointerup", (event) => {
			canvas.releasePointerCapture(event.pointerId);

			if (event.pointerType == "touch") {
				this.#touches = this.#touches.filter(e => e != event.pointerId);
			}

			if (event.pointerType == "mouse" && event.button == this.panButton
				|| event.pointerType == "touch" && this.#touches.length == 0
			) {
				if (!this.#pointerMoved) {
					this.#pinPosition = this.canvasToWorld(this.getPointerPos(event));
					this.drawTip();
				}
				this.#pointerMoved = false;
				this.#panButtonDown = false;
			}
		});
		canvas.addEventListener("pointermove", (event) => {
			if (event.pointerType == "mouse" && this.#panButtonDown
				|| event.pointerType == "touch" && this.#touches.length == 1 && this.#touches[0] == event.pointerId
			) {
				this.#pointerMoved = true;
				let pos = this.getPointerPos(event);
				let dp = pos.sub(this.#panPosition);
				this.#panPosition = pos;
				this.onPan(dp);
			}
			else if (event.pointerType == "touch" && this.#touches.length == 2) {
				let pos = this.getPointerPos(event);
				let d0 = this.#panPosition.distance(this.#pinchPosition);
				let center = this.#panPosition.mean(this.#pinchPosition);

				if (this.#touches[0] == event.pointerId) {
					this.#panPosition = pos;
				}
				if (this.#touches[1] == event.pointerId) {
					this.#pinchPosition = pos;
				}

				let d1 = this.#panPosition.distance(this.#pinchPosition);

				if (this.#zoomMouse) {
					this.#zoomMouse = false;
					this.zoomPow = 1 + (this.zoomPow - 1) * 0.07;
				}
				this.onZoom(center, Math.sign(d0 - d1));
			}
		});
		canvas.addEventListener("wheel", event => {
			let canvasPos = this.getPointerPos(event);
			this.onZoom(canvasPos, Math.sign(event.deltaY));
			this.drawTip();
		});
	}

	updateLargeWorldOffset() {
		if (this.largeWorld) {
			this.#largeWorldOffset = this.#offset.div(this.#largeWorldTile).round().mul(this.#largeWorldTile);
		}
	}

	onPan(pan) {
		this.#offset = this.#offset.add(pan.mul(1.0 / this.#zoom));
		this.updateLargeWorldOffset();
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
		this.updateLargeWorldOffset();

		this.draw();
	}

	onReset() {
		this.#offset = this.initialOffset;
		this.updateLargeWorldOffset();
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

	get canvasWorldCenter() { return this.#offset.mul(-1); }
	get canvasSmallWorldCenter() { return this.transformToSmallWorld(this.canvasWorldCenter); }
	get canvasWorldSize() { return this.size.mul(1.0 / this.zoom); }

	getCanvasWorldBounds() {
		let center = this.canvasWorldCenter;
		let demiSize = this.size.mul(0.5 / this.zoom);

		return { min: center.sub(demiSize), max: center.add(demiSize) }
	}

	canvasToWorld(pos) {
		return pos.mul(1.0 / this.#zoom).sub(this.#offset);
	}

	draw() {
		super.draw();

		if (this.inited) {

			this.context.transform(1, 0, 0, 1, this.width / 2, this.height / 2); // canvas 0 is center

			if (this.autoTransform) {
				this.context.transform(this.#zoom, 0, 0, -1 * this.#zoom, 0, 0); // zoom and inverse y
				this.context.transform(1, 0, 0, 1, this.#offset.x - this.#largeWorldOffset.x, this.#offset.y - this.#largeWorldOffset.y); // apply world offset
			}
			else {
				this.context.transform(1, 0, 0, -1, 0, 0); // inverse y
			}

			this.drawGrid();

			this.context.strokeStyle = "rgb(255, 255, 255)";

			this.transformedDraw();

			this.context.setTransform();
		}
	}

	transformToSmallWorld(value) {
		if (this.largeWorld) return value.add(this.#largeWorldOffset);
		return value;
	}

	transformedDraw() { }

	drawTip() {
		let ctx = this.tipContext;
		if (ctx != undefined && this.showCoords && this.#pinPosition != undefined) {
			this.clearContext(ctx);
			ctx.fillText(
				this.getValueUnitString(this.#pinPosition.x) + ", "
				+ this.getValueUnitString(this.#pinPosition.y)
				, ctx.canvas.width - 2, ctx.canvas.height
			);
		}
	}

	drawGrid() {
		let ctx = this.context;

		let minCellSize = 100;

		let step = minCellSize / this.#zoom;

		this.unitStep = Math.pow(10, Math.ceil(Math.log10(step)));

		let subdivisionX = Math.ceil(this.width / this.unitStep / this.#zoom);
		let subdivisionY = Math.ceil(this.height / this.unitStep / this.#zoom);

		if (this.showGrid || this.showAxis) {
			let bounds = this.getCanvasWorldBounds();
			let min = (bounds.min.mul(1.0 / this.unitStep)).ceil().mul(this.unitStep);

			let drawXAxis = false;
			let drawYAxis = false;

			if (this.showGrid) {
				ctx.strokeStyle = "rgb(200, 200, 200)";
				ctx.lineWidth = 0.2 / this.#zoom;
				ctx.beginPath();

				for (let s = -10; s < subdivisionY * 10; ++s) {
					if (s % 10 != 0) {
						let offset = s * this.unitStep / 10.0;
						let y = offset + min.y;
						ctx.moveTo(bounds.min.x + this.#largeWorldOffset.x, y + this.#largeWorldOffset.y);
						ctx.lineTo(bounds.max.x + this.#largeWorldOffset.x, y + this.#largeWorldOffset.y);
					}
				}

				for (let s = -10; s < subdivisionX * 10; ++s) {
					if (s % 10 != 0) {
						let offset = s * this.unitStep / 10.0;
						let x = offset + min.x;
						ctx.moveTo(x + this.#largeWorldOffset.x, bounds.min.y + this.#largeWorldOffset.y);
						ctx.lineTo(x + this.#largeWorldOffset.x, bounds.max.y + this.#largeWorldOffset.y);
					}
				}

				ctx.stroke();

				ctx.strokeStyle = "rgb(255, 255, 255)";
				ctx.lineWidth = 0.6 / this.#zoom;
				ctx.beginPath();
				for (let s = 0; s < subdivisionY; ++s) {
					let offset = s * this.unitStep;
					let y = offset + min.y;
					if (y != 0) {
						ctx.moveTo(bounds.min.x + this.#largeWorldOffset.x, y + this.#largeWorldOffset.y);
						ctx.lineTo(bounds.max.x + this.#largeWorldOffset.x, y + this.#largeWorldOffset.y);
					}
					else {
						drawXAxis = true;
					}
				}

				for (let s = 0; s < subdivisionX; ++s) {
					let offset = s * this.unitStep;
					let x = offset + min.x;
					if (x != 0) {
						ctx.moveTo(x + this.#largeWorldOffset.x, bounds.min.y + this.#largeWorldOffset.y);
						ctx.lineTo(x + this.#largeWorldOffset.x, bounds.max.y + this.#largeWorldOffset.y);
					}
					else {
						drawYAxis = true;
					}
				}
				ctx.stroke();
			}

			if (this.showAxis) {
				ctx.lineWidth = 1.0 / this.#zoom;

				if (drawXAxis) {
					ctx.strokeStyle = "rgb(255, 0, 0)";

					ctx.beginPath();
					ctx.moveTo(bounds.min.x + this.#largeWorldOffset.x, this.#largeWorldOffset.y);
					ctx.lineTo(bounds.max.x + this.#largeWorldOffset.x, this.#largeWorldOffset.y);
					ctx.stroke();
				}
				if (drawYAxis) {
					ctx.strokeStyle = "rgb(0, 255, 0)";

					ctx.beginPath();
					ctx.moveTo(this.#largeWorldOffset.x, bounds.min.y + this.#largeWorldOffset.y);
					ctx.lineTo(this.#largeWorldOffset.x, bounds.max.y + this.#largeWorldOffset.y);
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