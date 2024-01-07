let main = {
	MainDraw: class extends draw.TransformedDrawing {
		constructor(containerId) {
			super({
				containerId: containerId
				, unit: "m"
				, zoomPow: 1.05
				, showGrid: true
				, showAxis: true
				, showCoords: true
				, autoTransform: true
				, largeWorld: true
				, maxZoomIndex: 240
			});
			this.draw();
		}

		drawCross(center, radius, penW) {
			this.context.setLineDash([5 / this.zoom, 5 / this.zoom]);
			this.context.lineWidth = penW;
			center = this.transformToSmallWorld(center);
			this.context.beginPath();

			this.context.moveTo(center.x - radius, center.y);
			this.context.lineTo(center.x - 3 * radius / 5.0, center.y);
			this.context.moveTo(center.x + 3 * radius / 5.0, center.y);
			this.context.lineTo(center.x + radius, center.y);

			this.context.moveTo(center.x, center.y - radius);
			this.context.lineTo(center.x, center.y - 3 * radius / 5.0);
			this.context.moveTo(center.x, center.y + 3 * radius / 5.0);
			this.context.lineTo(center.x, center.y + radius);
			this.context.stroke();
			this.context.setLineDash([]);
		}

		drawCircle(center, radius, penW) {
			this.context.lineWidth = penW;
			center = this.transformToSmallWorld(center);
			this.context.beginPath();
			this.context.arc(center.x, center.y, radius - penW / 2.0, 0, 2 * Math.PI);
			this.context.stroke();
		}

		transformedDraw() {
			this.drawCircle(new math.Vector(100, 50), 50, 3);
			this.drawCircle(new math.Vector(0, 5), 5, 3);

			//Draw earth
			let earthRadius = physx.earth.radius_m;
			let earthCenter = new math.Vector(0, -1 * earthRadius);
			let canvasCenter = this.canvasSmallWorldCenter;
			draw.bigCircle({
				context: this.context
				, canvasCenter: canvasCenter
				, canvasSize: this.canvasWorldSize
				, center: this.transformToSmallWorld(earthCenter), radius: earthRadius
				, penW: 10 / this.zoom
			});

			//Draw moon
			let moonRadius = physx.moon.radius_m;
			let moonCenter = earthCenter.add(new math.Vector(0, physx.moon.earthDistance_m));
			draw.bigCircle({
				context: this.context
				, canvasCenter: canvasCenter
				, canvasSize: this.canvasWorldSize
				, center: this.transformToSmallWorld(moonCenter), radius: moonRadius
				, penW: 10 / this.zoom
			});

			//Draw sun
			let sunRadius = physx.sun.radius_m;
			let sunCenter = earthCenter.sub(new math.Vector(0, physx.sun.earthDistance_m));
			draw.bigCircle({
				context: this.context
				, canvasCenter: canvasCenter
				, canvasSize: this.canvasWorldSize
				, center: this.transformToSmallWorld(sunCenter), radius: sunRadius
				, penW: 10 / this.zoom
			});

			if (this.zoom < 1 / (2 << 15)) {

				let zoomScale = Math.pow(1 / (this.zoom * (2 << 16)), 0.6);

				this.drawCross(moonCenter, moonRadius * 10 * zoomScale, 2 / this.zoom);
				this.drawCross(earthCenter, earthRadius * 5 * zoomScale, 2 / this.zoom);
				this.drawCross(sunCenter, sunRadius * 0.5 * zoomScale, 2 / this.zoom);
			}
		}
	}
	, ToolBar: class {
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
}

let draw0 = new main.MainDraw("draw0");

let layoutElement = document.getElementById("layout");

const toolModes = {
	Pan: "pan",
	Zoom: "zoom",
	Info: "info"
};

let toolBar0 = new main.ToolBar({
	toolModes: Object.values(toolModes), defaultToolMode: toolModes.Pan
	, buttonMappings: [
		{
			buttonId: "fullscreen"
			, callback: () => {
				toolBar0.updateFullScreenImg(
					interaction.toggleFullScreen(layoutElement)
				);
			}
		}
		, { buttonId: "reset", callback: () => draw0.resetView() }
	]
	, fullscreenButtonId: "fullscreen"
});

new interaction.PrimaryDragInteraction({
	element: draw0.canvas, mouseButton: 0
	, dragStartCallback: (current) => {
		switch (toolBar0.toolMode) {
			case toolModes.Info:
				draw0.plotPosition(current);
				break;
		}
	}
	, dragCallback: (start, current, dp) => {
		switch (toolBar0.toolMode) {
			case toolModes.Pan:
				draw0.panView(dp);
				break;
			case toolModes.Zoom:
				draw0.zoomView(start, dp.y);
				break;
			case toolModes.Info:
				draw0.plotPosition(current);
				break;
		}
	}
});