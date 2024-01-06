let main = {
	MainDraw: class extends draw.TransformedDrawing {
		constructor() {
			super({
				id: "canvas"
				, tipId: "tipcanvas"
				, unit: "m"
				, zoomPow: 2.0
				, showGrid: true
				, showAxis: true
			});
			this.draw();
		}

		transformedDraw() {
			this.context.lineWidth = 3.0;

			this.context.beginPath();
			this.context.arc(100, 50, 50 - 1.5, 0, 2 * Math.PI);
			this.context.stroke();

			this.context.beginPath();
			this.context.arc(0, 5, 5 - 1.5, 0, 2 * Math.PI);
			this.context.stroke();

			//Draw earth
			let earthRadius = physx.earth.radius_m;
			let earthCenter = new math.Vector(0, -1 * earthRadius);
			let canvasCenter = this.getCanvasWorldCenter();
			draw.bigCircle({
				context: this.context
				, canvasCenter: canvasCenter
				, center: earthCenter, radius: earthRadius
				, penW: 10, zoom: this.zoom
			});

			//Draw moon
			let moonRadius = physx.moon.radius_m;
			let moonCenter = earthCenter.add(new math.Vector(0, physx.moon.earthDistance_m));
			draw.bigCircle({
				context: this.context
				, canvasCenter: canvasCenter
				, center: moonCenter, radius: moonRadius
				, penW: 10, zoom: this.zoom
			});
		}
	}
}

new main.MainDraw();