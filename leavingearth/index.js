let earthMass_kg = 5.972e24;
let earthRadius_m = 6371e3;
let time_s = 0;

let thrustInput = document.getElementById("thrust");
let s0Input = document.getElementById("s0");
let scaleXInput = document.getElementById("sx");
let scaleYInput = document.getElementById("sy");
let timeScaleInput = document.getElementById("st");
let timeStepInput = document.getElementById("ts");

let timeInput = document.getElementById("t");
let timeInput_hr = document.getElementById("t_hr");
let vsInput = document.getElementById("vs");
let altitudeInput = document.getElementById("z");
let altitudeInput_km3 = document.getElementById("z_km3");
let gravityAccellInput = document.getElementById("gz");
let dragAccellInput = document.getElementById("dz");

let rocketMassInput = document.getElementById("m");
let rocketSectionAreadInput = document.getElementById("sa");
let rocketDragCoeffInput = document.getElementById("dc");

let started = false;
let rocket;

let scaleX = 1;
let scaleY = 1;
let timeScale = 1;
let integrationStep_s = 1e-2;

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

monitorIndex = 0;
plotMonitor = function () {
	let plot = new math.Vector(monitorIndex, monitor.height * (1 - monitorRatio));
	++monitorIndex;
	if (monitorIndex >= monitor.width) {
		monitorIndex = 0;
		monitor.clear();
	}
	return plot;
}

//Simulation
forceIntegration = function () {
	let force = new math.Vector(0, 0, 0);

	//Thrust
	let thrust = parseFloat(thrustInput.value);
	if (thrust > 0) {
		force = force.add(new math.Vector(0, 0, thrust));
	}

	//Gravity
	let g = physx.gravity({
		m0: rocket.mass
		, m1: physx.earth.mass_kg
		, p0: new math.Vector(0, 0, physx.earth.radius_m + rocket.position.z)
		, p1: new math.Vector(0, 0, 0)
	})

	force = force.add(g);

	//Atmospheric drag
	let drag = rocket.velocity.null();

	if (rocketDragCoeff > 0 && rocketSectionArea_m2 > 0) {
		let atmosphericDensity_kgpm3 = physx.earth.atmosphericDensityFunc_m_kgpm3(rocket.position.z);
		drag = physx.drag({
			fluidDendity_kgpm3: atmosphericDensity_kgpm3
			, velocity_mps: rocket.velocity
			, dragCoeff: rocketDragCoeff
			, area_m2: rocketSectionArea_m2
		});

		force = force.add(drag);
	}

	rocket.applyForce(force);

	if (rocket.acceleration.z != rocket.acceleration.z) {
		alert("nan");
	}

	return { g: g, drag: drag };
}

computeCollision = function () {
	if (rocket.position.z < 0) {
		rocket.position.z = 0;
		rocket.velocity = rocket.velocity.null();
	}
}

let monitorRatio = 0;

simulation = new physx.Simulation(
	{
		initCallback: () => {
			timeInput.value = "";
			timeInput_hr.value = "";
			vsInput.value = "";
			altitudeInput.value = "";
			altitudeInput_km3.value = "";
			gravityAccellInput.value = "";
			gravityAccellInput.value = "";
		}
		, simulateCallback: (dt_s) => {
			timeScale = parseFloat(timeScaleInput.value);
			if (timeScale > 0) {
				dt_s *= timeScale;
			}

			let integrationCount = Math.max(Math.round(dt_s / integrationStep_s), 1);
			dt_s = dt_s / integrationCount;

			let forces;

			for (s = 0; s < integrationCount; ++s) {
				forces = forceIntegration();
				if (forces.g.z != forces.g.z) {
					alert("nan");
				}
				rocket.update(dt_s);
				if (rocket.position.z != rocket.position.z) {
					alert("nan");
				}
				computeCollision();
			}

			time_s += dt_s * integrationCount;

			timeInput.value = Math.round(time_s);
			timeInput_hr.value = Math.round(time_s / 3600.0 * 1e2) / 1e2;
			vsInput.value = Math.round(rocket.velocity.z * 1e2) / 1e2;
			altitudeInput.value = Math.round(rocket.position.z) / 1e3;
			altitudeInput_km3.value = Math.round(rocket.position.z / 1e3) / 1e3;
			gravityAccellInput.value = Math.round(forces.g.z / rocket.mass * 1e3) / 1e3;
			dragAccellInput.value = Math.round(forces.drag.z / rocket.mass * 1e3) / 1e3;
		}

		, simulationStepEndCallback: (dt_s, duration_s) => {
			monitorRatio = duration_s / dt_s;
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
		, updateCallback: () => {
			if (started) {
				let p0 = plotRocket();
				let m0 = plotMonitor();

				simulation.update();

				new draw.Line({
					p0: p0
					, p1: plotRocket()
				}).stroke(drawing.context);

				new draw.Line({
					p0: m0
					, p1: plotMonitor()
				}).stroke(monitor.context);
			}
		}
	}
)

monitor = new draw.Drawing({
	id: "scp"
	, autoClear: false
	, initializeCallback: (ctx) => {
		ctx.strokeStyle = "rgb(200, 0, 0)";
		ctx.lineWidth = 3;
	}
})

start = function () {
	drawing.context.strokeStyle = draw.randomColor();

	scaleX = parseFloat(scaleXInput.value);
	scaleY = parseFloat(scaleYInput.value);
	integrationStep_s = parseFloat(timeStepInput.value);
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