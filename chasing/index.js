const target = new Object(new Vector(100, 100), new Vector(0, 0), 1000, new Vector(0, 0));
class Geometry {
	constructor(radius, color) {
		this.radius = radius;
		this.color = color;
	}
}
chasers = [];
chasersGeometry = [];
chaserCount = 30;
let ctx;
margin = 250;
mouse = new Vector(250, 250);

function simulate(dt_s) {
	updateTarget(dt_s);
	updateChasers(dt_s);
}

function updateChasers(dt_s) {
	chasers.forEach((c, i) => {
		chased = i == 0 ? target : chasers[i - 1];
		c.follow(chased.position, chased.velocity, dp => dp, dv => dv, 10, 3);
		c.update(dt_s);
	});
}

function updateTarget(dt_s) {
	target.follow(mouse, new Vector(0, 0), dp => Math.sqrt(dp), dv => dv, 1000, 10);
	target.update(dt_s);
}

function draw() {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // clear canvas

	const target2D = Circle(target.position, 7);
	ctx.stroke(target2D);

	chasers.forEach((c, i) => {
		const chaser2D = Circle(c.position, chasersGeometry[i].radius);
		ctx.stroke(chaser2D);
	});
}

function animate() {
	updatePhysx(simulate);
	draw();
	window.requestAnimationFrame(animate);
}

function mouseMove(event) {
	mouse.x = event.clientX;
	mouse.y = event.clientY;
}

ctx = initializeCanvas(animate, mouseMove);

for (c = 0; c < chaserCount; ++c) {
	x = Math.random() * ctx.canvas.width;
	y = Math.random() * ctx.canvas.height;
	chasers.push(new Object(new Vector(x, y), new Vector(0, 0), 300, new Vector(0, 0)));
	chasersGeometry.push(new Geometry(10 - c / (chaserCount - 1) * 9, "rgb(200, 0, 0)"));
}