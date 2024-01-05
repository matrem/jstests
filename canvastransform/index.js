let main = {
	MainDraw: class extends draw.TransformedDrawing {
		constructor() {
			super({ id: "canvas", unit: "m" });
			this.draw();
		}

		transformedDraw() {
			this.context.lineWidth = 3.0;

			this.context.beginPath();
			this.context.arc(100, 50, 50, 0, 2 * Math.PI);
			this.context.stroke();

			this.context.beginPath();
			this.context.arc(0, 0, 5, 0, 2 * Math.PI);
			this.context.stroke();
		}
	}
}

new main.MainDraw();