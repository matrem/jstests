draw.TransformedDrawing = class extends draw.Drawing {
	#offset = new math.Vector(0, 0); //in world
	#largeWorldOffset = new math.Vector(0, 0);
	#largeWorldTile = 1000.0;
	#zoomIndex = 0;
	#zoom = 1;

	get zoom() { return this.#zoom; };
	get offset() { return this.#offset; };
	get largeWorldOffset() { return this.#largeWorldOffset; }

	constructor({
		containerId
		, autoClear = true, autoTransform = true, largeWorld = false
		, unit = ""
		, zoomPow = 1.1, minZoomIndex, maxZoomIndex
		, initialZoomIndex = 0, initialOffset = new math.Vector(0, 0)
		, showGrid = true, showAxis = true
	}) {
		super({ containerId: containerId, autoClear: autoClear });

		this.autoTransform = autoTransform;
		this.largeWorld = largeWorld;
		this.zoomPow = zoomPow;
		this.minZoomIndex = minZoomIndex;
		this.maxZoomIndex = maxZoomIndex;
		this.unit = unit;
		this.initialZoomIndex = initialZoomIndex;
		this.initialOffset = initialOffset;
		this.showGrid = showGrid;
		this.showAxis = showAxis;
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

				this.#buildTipCanvas();
			}

			return inited;
		});
	}

	#setupTipCanvasSize(canvas) {
		let tipW = Math.min(this.width, this.height) - 10;
		let tipH = tipW / 20.0;

		canvas.width = tipW;
		canvas.height = tipH;

		this.tipContext.font = "" + (tipW / 20) + "px serif";
		this.tipContext.fillStyle = "rgb(255,255, 255)";
		this.tipContext.textAlign = "left";
		this.tipContext.textBaseline = "top";
	}

	#buildTipCanvas() {
		this.tipContext = draw.appendCanvas({
			container: this.container
			, initializeCallback: (canvas) => {
				canvas.style.position = "absolute";
				canvas.style.left = "5px";
				canvas.style.top = "5px";
				canvas.style.backgroundColor = "transparent";
			}
		});

		this.#setupTipCanvasSize(this.tipContext.canvas);
	}

	onResize() {
		super.onResize();

		if (this.tipContext != undefined) {
			this.#setupTipCanvasSize(this.tipContext.canvas);
		}
	}

	#updateLargeWorldOffset() {
		if (this.largeWorld) {
			this.#largeWorldOffset = this.#offset.div(this.#largeWorldTile).round().mul(this.#largeWorldTile);
		}
	}

	//pan is in local pixel unit (x right, y down)
	panView(pan) {
		pan.y *= -1;
		this.#offset = this.#offset.add(pan.mul(1.0 / this.#zoom));
		this.#updateLargeWorldOffset();
		this.draw();
	}

	#setZoomIndex(zoomIndex) {
		if (this.maxZoomIndex != undefined && zoomIndex > this.maxZoomIndex) zoomIndex = this.maxZoomIndex;
		if (this.minZoomIndex != undefined && zoomIndex < this.minZoomIndex) zoomIndex = this.minZoomIndex;
		this.#zoomIndex = zoomIndex;
		this.#zoom = Math.pow(this.zoomPow, this.#zoomIndex);
	}

	//canvasPos are in local pixel unit (x right, y down)
	//direction >0 to zoom, <0 to dezoom
	zoomView(canvasPos, direction) {
		canvasPos = this.#canvasTransform(canvasPos);
		let previousWorldPos = this.#canvasToWorld(canvasPos);
		this.#setZoomIndex(this.#zoomIndex + direction);
		let newWorldPos = this.#canvasToWorld(canvasPos);

		let dP = newWorldPos.sub(previousWorldPos);

		this.#offset = this.#offset.add(dP);
		this.#updateLargeWorldOffset();

		this.draw();
	}

	resetView() {
		this.#offset = this.initialOffset;
		this.#updateLargeWorldOffset();
		this.#setZoomIndex(this.initialZoomIndex);
		this.draw();
	}

	//convert windows to local math canvas (0 centered y up)
	#canvasTransform(pos) {
		return new math.Vector(pos.x - this.width / 2.0, this.height / 2.0 - pos.y);
	}

	// getPointerPos(event) {
	// 	return this.canvasTransform(new math.Vector(event.offsetX, event.offsetY));
	// }

	get canvasWorldCenter() { return this.#offset.mul(-1); }
	get canvasSmallWorldCenter() { return this.transformToSmallWorld(this.canvasWorldCenter); }
	get canvasWorldSize() { return this.size.mul(1.0 / this.zoom); }

	get canvasWorldBounds() {
		let center = this.canvasWorldCenter;
		let demiSize = this.size.mul(0.5 / this.zoom);

		return { min: center.sub(demiSize), max: center.add(demiSize) }
	}

	#canvasToWorld(pos) {
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

			this.#drawGrid();

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

	plotPosition(position) {

		position = this.#canvasToWorld(this.#canvasTransform(position));

		let ctx = this.tipContext;
		if (ctx != undefined) {
			this.clearContext(ctx);
			ctx.fillStyle = "rgb(255,0,0)";
			let x = this.#getValueUnitString(position.x)
			let xLen = ctx.measureText(x).width;
			let sep = " | ";
			ctx.fillText(x, 0, 0);
			ctx.fillStyle = "rgb(255,255,255)";
			ctx.fillText(sep, xLen, 0);
			ctx.fillStyle = "rgb(0,255,0)";
			ctx.fillText(
				this.#getValueUnitString(position.y)
				, xLen + ctx.measureText(sep).width, 0
			);
		}
	}

	#drawGrid() {
		let ctx = this.context;

		let minCellSize = 100;

		let step = minCellSize / this.#zoom;

		this.unitStep = Math.pow(10, Math.ceil(Math.log10(step)));

		let subdivisionX = Math.ceil(this.width / this.unitStep / this.#zoom);
		let subdivisionY = Math.ceil(this.height / this.unitStep / this.#zoom);

		if (this.showGrid || this.showAxis) {
			let bounds = this.canvasWorldBounds;
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
			ctx.fillText(this.#getValueUnitString(this.unitStep), 10, this.height - 10);
			ctx.setTransform(transform);
		}
	}

	#getValueUnitString(value) {
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