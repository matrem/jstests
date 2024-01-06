let main = {
	MainDraw: class extends draw.TransformedDrawing {
		constructor() {
			super({
				id: "canvas"
				, tipId: "tipcanvas"
				, unit: "m"
				, zoomPow: 1.1
				, showGrid: true
				, showAxis: true
				, showCoords: true
				, autoTransform: true
				, largeWorld: true
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
}

new main.MainDraw();