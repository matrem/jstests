const target = new physx.Object(
	{
		position: new math.Vector(100, 100)
		, velocity: new math.Vector(0, 0)
		, maxSpeed: 1000
		, acceleration: new math.Vector(0, 0)
	}
);

class Geometry {
	constructor({ radius, color }) {
		this.radius = radius;
		this.color = color;
	}
}

mouse = new math.Vector(250, 250);

chasers = [];
chasersGeometry = [];
chaserCount = 30;

//Simulation

function updateTarget(dt_s) {
	target.follow(
		{
			position: mouse
			, velocity: new math.Vector(0, 0)
			, dPositionFunc: dp => Math.sqrt(dp) * 1000.0
			, dSpeedFunc: ds => ds * 10.0
		}
	);
	target.update(dt_s);
}

function updateChasers(dt_s) {
	chasers.forEach((c, i) => {
		chased = i == 0 ? target : chasers[i - 1];
		c.follow(
			{
				position: chased.position
				, velocity: chased.velocity
				, dPositionFunc: dp => 10 * dp
				, dSpeedFunc: ds => 3 * ds
			}
		);
		c.update(dt_s);
	});
}

simulation = new physx.Simulation({
	simulateCallback: (dt_s) => {
		updateTarget(dt_s);
		updateChasers(dt_s);
	}
})

//Drawing

function drawTargetAndChasers() {
	drawing.draw();

	new draw.Circle({
		color: "rgb(200, 0, 0)"
		, position: target.position
		, radius: 7
	}).stroke(drawing.context);

	chasers.forEach((c, i) => {
		new draw.Circle({
			color: chasersGeometry[i].color
			, position: c.position
			, radius: chasersGeometry[i].radius
		}).stroke(drawing.context);
	});
}

drawing = new draw.Drawing({
	containerId: "canvas"
	, initializeCallback: () => { //Init
		drawing.context.fillStyle = "rgb(200, 0, 0)";
		drawing.context.strokeStyle = "rgb(200, 0, 0)";
		drawing.context.lineWidth = 3;

		drawing.canvas.addEventListener("pointermove", (event) => {
			mouse.x = event.clientX;
			mouse.y = event.clientY;
		});
	}
})

task = new task.Work({
	initializeCallback: () => {
		drawing.draw();

		for (c = 0; c < chaserCount; ++c) {
			x = Math.random() * drawing.width;
			y = Math.random() * drawing.height;

			chasers.push(
				new physx.Object(
					{
						position: new math.Vector(x, y)
						, velocity: new math.Vector(0, 0)
						, maxSpeed: 300
						, acceleration: new math.Vector(0, 0)
					}
				)
			);

			chasersGeometry.push(
				new Geometry(
					{
						radius: 10 - c / (chaserCount - 1) * 9
						, color: "rgb("
							+ Math.random() * 255
							+ ", " + Math.random() * 255
							+ ", " + Math.random() * 255
							+ ")"
					}
				)
			);
		}
	}
	, updateCallback: (dt_s) => {
		simulation.simulate(dt_s);
		drawTargetAndChasers();
	}
});

task.start();