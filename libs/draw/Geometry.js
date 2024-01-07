draw.Geometry = class {
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

draw.randomColor = function ({
	r = { min: 0, max: 255 }
	, g = { min: 0, max: 255 }
	, b = { min: 0, max: 255 }
}) {
	return "rgb("
		+ (Math.random() * (r.max - r.min) + r.min)
		+ ", " + (Math.random() * (g.max - g.min) + g.min)
		+ ", " + (Math.random() * (b.max - b.min) + b.min)
		+ ")";
};

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

draw.bigCircle = function ({ context, canvasCenter, canvasSize, center, radius, penW }) {
	let centerToCanvas = canvasCenter.sub(center).normalize();
	let xAxis = centerToCanvas.XAxis();
	let YAxis = centerToCanvas.YAxis();
	let dotX = centerToCanvas.dot(xAxis);
	let dotY = centerToCanvas.dot(YAxis);

	let start = Math.acos(dotX) * Math.sign(Math.asin(dotY));

	let zoom = (2.0 * radius) / canvasSize.x;
	let portion = Math.max(zoom, 1);

	let localOffset = centerToCanvas.mul(-1 * radius);
	let localCenter = center.sub(localOffset);

	penW = Math.min(penW, radius / 2.0);
	context.lineWidth = penW;

	//transform to get arc around 0
	let transform = context.getTransform();
	context.transform(1, 0, 0, 1, localCenter.x, localCenter.y);

	if (portion < 1000) {
		let angle = Math.PI / portion;

		context.beginPath();
		context.arc(localOffset.x, localOffset.y, radius - penW / 2, start - angle, start + angle);
		context.stroke();
	}
	else { //simplify with a line
		let len = canvasSize.length();
		let direction = centerToCanvas.ortho2da();
		let demiSize = direction.mul(len / 2.0);
		let center = centerToCanvas.mul(-penW / 2);
		let start = center.add(demiSize.mul(-1));
		let end = center.add(demiSize);
		context.beginPath();
		context.moveTo(start.x, start.y);
		context.lineTo(end.x, end.y);
		context.stroke();
	}

	context.setTransform(transform);
}