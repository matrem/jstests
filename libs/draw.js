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
			ctx.strokeStyle = this.color;
			ctx.stroke(this.path);
		}
	}

	, Drawing: class {
		constructor({ id, initializeCallback, animateCallback, mouseMoveCallback, autoClear = true }) {
			this.canvas = document.getElementById(id);
			this.animateCallback = animateCallback;
			this.autoClear = autoClear;

			if (this.canvas.getContext) {
				this.context = this.canvas.getContext("2d");

				initializeCallback(this.context);

				this.canvas.onmousemove = mouseMoveCallback;

				window.requestAnimationFrame(this.animate.bind(this));
			}
			else {
				alert("Can't get " + id + "canvas 2d context");
			}
		}

		clear() {
			this.context.clearRect(
				0, 0, this.context.canvas.width, this.context.canvas.height
			);
		}

		animate() {
			if (this.autoClear) this.clear();
			this.animateCallback();
			window.requestAnimationFrame(this.animate.bind(this));
		}

		get width() { return this.context.canvas.width }
		get height() { return this.context.canvas.height }
	}

	, randomColor() {
		return "rgb("
			+ Math.random() * 255
			+ ", " + Math.random() * 255
			+ ", " + Math.random() * 255
			+ ")";
	}
}

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