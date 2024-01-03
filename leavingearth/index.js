//Inputs
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

//global variables
let scaleX = 1;
let scaleY = 1;

plotRocket = function () {
	return new math.Vector(time_s * scaleX, drawing.height - scaleY * simulation.rocket.position.z);
}

monitorDrawing = new monitor.Drawing({ id: "scp" });

//Drawing
drawing = new draw.Drawing(
	{
		id: "canvas"
		, initializeCallback: (ctx) => {
			ctx.fillStyle = "rgb(200, 0, 0)";
			ctx.lineWidth = 3;
		}
	}
)

let time_s = 0;

simulation = new RocketSimulation();

work = new task.Work({
	initCallback: () => {
		timeInput.value = "";
		timeInput_hr.value = "";
		vsInput.value = "";
		altitudeInput.value = "";
		altitudeInput_km3.value = "";
		gravityAccellInput.value = "";
		gravityAccellInput.value = "";
	}
	, updateStartCallback: () => {
		simulation.timeScale = parseFloat(timeScaleInput.value);
		simulation.integrationStep_s = parseFloat(timeStepInput.value);
		simulation.rocket.mass = parseFloat(rocketMassInput.value)
		simulation.sectionArea_m2 = parseFloat(rocketSectionAreadInput.value)
		simulation.dragCoeff = parseFloat(rocketDragCoeffInput.value)
	}
	, updateCallback: (dt_s) => {
		let p0 = plotRocket();

		dt_s = simulation.simulate(dt_s);
		time_s += dt_s;

		new draw.Line({
			p0: p0
			, p1: plotRocket()
		}).stroke(drawing.context);
	}
	, updateEndCallback: (dt_s, duration_s) => {
		//Update inputs
		timeInput.value = Math.round(time_s);
		timeInput_hr.value = Math.round(time_s / 3600.0 * 1e2) / 1e2;
		vsInput.value = Math.round(simulation.rocket.velocity.z * 1e2) / 1e2;
		altitudeInput.value = Math.round(simulation.rocket.position.z) / 1e3;
		altitudeInput_km3.value = Math.round(simulation.rocket.position.z / 1e3) / 1e3;
		gravityAccellInput.value = Math.round(simulation.forces.gravity.z / simulation.rocket.mass * 1e3) / 1e3;
		dragAccellInput.value = Math.round(simulation.forces.drag.z / simulation.rocket.mass * 1e3) / 1e3;

		//Update monitor
		monitorDrawing.plotRatio(duration_s / dt_s);
	}
})

start = function () {
	drawing.context.strokeStyle = draw.randomColor();

	scaleX = parseFloat(scaleXInput.value);
	scaleY = parseFloat(scaleYInput.value);

	simulation.reset({
		initialSpeed: parseFloat(s0Input.value)
		, initialMass_kg: parseFloat(rocketMassInput.value)
	});

	time_s = 0;
	work.start();
}

stop = function () {
	work.stop();
}

clean = function () {
	drawing.clear();
}