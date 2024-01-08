Drawing = class extends draw.TransformedDrawing {
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
		this.initialize();
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

	drawText(txt, size, position) {
		position = this.transformToSmallWorld(position);
		this.context.font = size + "px serif";
		this.context.textAlign = "center";
		this.context.textBaseline = "middle";
		if (this.gravityActivated) {
			this.context.fillStyle = "rgb(255, 0, 0 )";
		}
		else {
			this.context.fillStyle = "rgb(255, 255, 255)";
		}
		let transform = this.context.getTransform();
		this.context.transform(1, 0, 0, -1, position.x, position.y);
		this.context.fillText(txt, 0, 0);
		this.context.setTransform(transform);
	}

	gravityActivated = false;
	gravityDetected = false;
	time_s = 0;

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

		this.drawText("Fly me to the moon", 20, new math.Vector(0, 100));
		this.drawText("You found me, I'm G the Gravity.", 100, new math.Vector(0, -physx.earth.radius_m));
		this.drawText("Let's put my force in motion!", 100, new math.Vector(0, -physx.earth.radius_m - 100));

		//Draw moon
		let moonRadius = physx.moon.radius_m;
		let direction = new math.Vector(Math.cos(this.time_s + Math.PI / 2.0), Math.sin(this.time_s + Math.PI / 2.0));
		let moonCenter = earthCenter.add(direction.mul(physx.moon.earthDistance_m));

		draw.bigCircle({
			context: this.context
			, canvasCenter: canvasCenter
			, canvasSize: this.canvasWorldSize
			, center: this.transformToSmallWorld(moonCenter), radius: moonRadius
			, penW: 10 / this.zoom
		});

		this.drawText("Welcome to the moon", 20, new math.Vector(0, 376291570));
		this.drawText("Find the key at center", 20, new math.Vector(0, 376291550));

		this.drawText("Key : [L B U R S A N X C]", 100, new math.Vector(0, 376291500 + physx.moon.radius_m));
		this.drawText("Continue to the chest", 100, new math.Vector(0, 376291600 + physx.moon.radius_m));

		this.drawText("Destination : [X-R+L][L-B+R][R+A-U]", 20, new math.Vector(0, 379766420));

		//Draw sun
		let sunRadius = physx.sun.radius_m;
		let sunDirection = new math.Vector(Math.cos(this.time_s / 13 + Math.PI / 2.0), Math.sin(this.time_s / 13 + Math.PI / 2.0));
		let sunCenter = earthCenter.sub(sunDirection.mul(physx.sun.earthDistance_m));
		draw.bigCircle({
			context: this.context
			, canvasCenter: canvasCenter
			, canvasSize: this.canvasWorldSize
			, center: this.transformToSmallWorld(sunCenter), radius: sunRadius
			, penW: 10 / this.zoom
		});

		this.drawText("It's hot here! Run to earth center", 20, new math.Vector(0, -146410030990));

		if (this.zoom < 1 / (2 << 15)) {

			let zoomScale = Math.pow(1 / (this.zoom * (2 << 16)), 0.6);

			this.drawCross(moonCenter, moonRadius * 10 * zoomScale, 2 / this.zoom);
			this.drawCross(earthCenter, earthRadius * 5 * zoomScale, 2 / this.zoom);
			this.drawCross(sunCenter, sunRadius * 0.5 * zoomScale, 2 / this.zoom);
		}

		//Detect gravity
		let center = this.canvasWorldCenter;
		let margin = 10e3;
		if (!this.gravityDetected && this.zoomIndex >= -60 && center.x < margin && center.x > -1 * margin && center.y > -1 * physx.earth.radius_m - margin && center.y < -1 * physx.earth.radius_m + margin) {
			this.gravityDetected = true;
			setTimeout(
				() => {
					this.gravityActivated = true;
					this.draw();
				}
				, 5000
			);
		}

		if (this.gravityActivated) {
			window.requestAnimationFrame(this.animate.bind(this));
		}
	}

	timeStart_ms = undefined;
	animate(time_ms) {
		if (this.timeStart_ms == undefined) {
			this.timeStart_ms = time_ms;
		}
		this.time_s = (time_ms - this.timeStart_ms) / 1000.0;
		this.draw();
	}
}