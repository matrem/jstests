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
				, showCoords: true
				, autoTransform: true
				, largeWorld: true
			});
			this.draw();
		}


		drawCircle(center, radius, penW) {
			this.context.lineWidth = penW;
			center = this.transformToSmallWorld(center);
			this.context.beginPath();
			this.context.arc(center.x, center.y, radius - penW / 2.0, 0, 2 * Math.PI);
			this.context.stroke();
		}

		transformedDraw() {
			//this.context.lineWidth = 3.0;

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
		}
	}
}

new main.MainDraw();