let earthMass_kg = 5.972e24;
let earthRadius_m = 6371e3;
let time_s = 0;

let s0Input = document.getElementById("s0");
let scaleXInput = document.getElementById("sx");
let scaleYInput = document.getElementById("sy");
let timeScaleInput = document.getElementById("st");

let timeInput = document.getElementById("t");
let dtInput = document.getElementById("dt");
let vsInput = document.getElementById("vs");
let altitudeInput = document.getElementById("z");
let gravityAccellInput = document.getElementById("gz");

let rocketMassInput = document.getElementById("m");
let rocketSectionAreadInput = document.getElementById("sa");
let rocketDragCoeffInput = document.getElementById("dc");

let started = false;
let rocket;

let scaleX = 1;
let scaleY = 1;
let timeScale = 1;

let rocketMass_kg = 100;
let rocketDragCoeff = 0.75;
let rocketSectionArea_m2 = 1;

initRocket = function () {
	rocket = new physx.Object(
		{
			position: new math.Vector(0, 0, 0)
			, velocity: new math.Vector(0, 0, parseFloat(s0Input.value))
			, maxSpeed: undefined
			, acceleration: new math.Vector(0, 0, 0)
			, mass: rocketMass_kg
		}
	);
}

plotRocket = function () {
	return new math.Vector(time_s * scaleX, drawing.height - scaleY * rocket.position.z);
}

//Simulation
simulation = new physx.Simulation(
	{
		initCallback: () => {
			dtInput.value = "";
			timeInput.value = "";
			vsInput.value = "";
			altitudeInput.value = "";
			gravityAccellInput.value = "";
		}
		, simulateCallback: (dt_s) => {
			dt_s *= timeScale;
			let force = new math.Vector(0, 0, 0);

			let g = physx.gravity({
				m0: rocket.mass
				, m1: physx.earth.mass_kg
				, p0: new math.Vector(0, 0, physx.earth.radius_m + rocket.position.z)
				, p1: new math.Vector(0, 0, 0)
			})

			force = force.add(g);

			let atmosphericDensity_kgpm3 = physx.earth.atmosphericDensityFunc_m_kgpm3(rocket.position.z);

			if (rocketDragCoeff > 0) {
				let drag = physx.drag({
					fluidDendity_kgpm3: atmosphericDensity_kgpm3
					, velocity_mps: rocket.velocity
					, dragCoeff: rocketDragCoeff
					, area_m2: rocketSectionArea_m2
				});

				force = force.add(drag);
			}

			rocket.applyForce(force);

			rocket.update(dt_s);
			if (rocket.position.z < 0) {
				rocket.position.z = 0;
				rocket.velocity = rocket.velocity.null();
			}
			time_s += dt_s;

			dtInput.value = Math.round(dt_s * 1e3) / 1e3;
			timeInput.value = Math.round(time_s);
			vsInput.value = Math.round(rocket.velocity.z * 1e2, 2) / 1e2;
			altitudeInput.value = Math.round(rocket.position.z, 3) / 1e3;
			gravityAccellInput.value = Math.round(g.z / rocket.mass * 1e3) / 1e3;
		}
	}
)

//Drawing

drawing = new draw.Drawing(
	{
		id: "canvas"
		, autoClear: false
		, initializeCallback: (ctx) => {
			ctx.fillStyle = "rgb(200, 0, 0)";
			ctx.lineWidth = 3;

			// for ()
			// 	new draw.Line({
			// 		p0: new math.Vector()
			// 		, p1: plotRocket()
			// 	}).stroke(drawing.context);
		}
		, animateCallback: () => {
			if (started) {
				let p0 = plotRocket();

				simulation.update();

				new draw.Line({
					p0: p0
					, p1: plotRocket()
				}).stroke(drawing.context);
			}
		}
	}
)

start = function () {
	drawing.context.strokeStyle = draw.randomColor();
	scaleX = parseFloat(scaleXInput.value);
	scaleY = parseFloat(scaleYInput.value);
	timeScale = parseFloat(timeScaleInput.value);
	rocketMass_kg = parseFloat(rocketMassInput.value);
	rocketSectionArea_m2 = parseFloat(rocketSectionAreadInput.value);
	rocketDragCoeff = parseFloat(rocketDragCoeffInput.value);

	initRocket();

	time_s = 0;
	started = true;
}

clean = function () {
	drawing.clear();
}