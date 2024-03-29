main = new class {
	//Simulation
	time_s = 0;

	simulation = new RocketSimulation({
		planet: physx.earth
	});

	//Drawing
	monitorDrawing = new monitor.Drawing({ containerId: "scp" });

	drawing = draw.Drawing.build({
		containerId: "draw"
		, autoClear: false
		, autoResize: false
		, initializeContextCallback: context => {
			context.fillStyle = "rgb(200, 0, 0)";
			context.lineWidth = 1;
		}
	});

	plotRocket() {
		return new math.Vector(
			this.time_s * this.scaleX
			, this.drawing.height - this.scaleY * (this.simulation.rocket.position.length() - this.simulation.planet.radius_m)
		);
	}

	//UI
	scaleX = 1
	scaleY = 1

	ui = new ui.UI();

	parseInputs() {
		this.simulation.timeScale = parseFloat(this.ui.inputs.timeScale.value);
		this.simulation.integrationStep_s = parseFloat(this.ui.inputs.timeStep.value);

		this.simulation.sectionArea_m2 = parseFloat(this.ui.inputs.rocketSectionArea.value);
		this.simulation.dragCoeff = parseFloat(this.ui.inputs.rocketDragCoeff.value);

		if (this.ui.inputs.stages.length == 0) {
			let newMass = parseFloat(this.ui.inputs.rocketMass.value);
			if (newMass > 0) this.simulation.rocket.mass = newMass;
			this.simulation.thrust = parseFloat(this.ui.inputs.thrust.value) * 1e3;
		}
	}

	updateOutputs() {
		this.ui.outputs.time_s.value = Math.round(this.time_s);
		this.ui.outputs.time_hr.value = Math.round(this.time_s / 3600.0 * 1e2) / 1e2;

		let zDirection = this.simulation.rocket.position.normalize();
		let vs = this.simulation.rocket.velocity.dot(zDirection);

		this.ui.outputs.vs.value = Math.round(vs * 1e2) / 1e2;

		let altitude = this.simulation.rocket.position.length() - this.simulation.planet.radius_m;

		this.ui.outputs.altitude_km.value = Math.round(altitude) / 1e3;
		this.ui.outputs.altitude_km3.value = Math.round(altitude / 1e3) / 1e3;
		this.ui.outputs.thrustAccell.value = Math.round(this.simulation.forces.thrust.length() / this.simulation.rocket.mass * 1e3) / 1e3;
		this.ui.outputs.gravityAccell.value = Math.round(this.simulation.forces.gravity.length() / this.simulation.rocket.mass * 1e3) / 1e3;
		this.ui.outputs.dragAccell.value = Math.round(this.simulation.forces.drag.length() / this.simulation.rocket.mass * 1e3) / 1e3;
		this.ui.outputs.accell.value = Math.round(this.simulation.lastAcceleration.length() * 1e3) / 1e3;
		this.ui.outputs.mass.value = Math.round(this.simulation.rocket.mass * 1e3) / 1e3;
	}

	drawGrid() {
		this.drawing.draw();

		this.drawing.context.strokeStyle = "rgb(255,255, 255)";

		let subdvision = 10;
		for (let s = 1; s < subdvision; ++s) {
			this.drawing.context.lineWidth = (s % 2) == 0 ? 1 : 0.5;
			new draw.Line({
				p0: new math.Vector(0, this.drawing.height * s / subdvision)
				, p1: new math.Vector(this.drawing.width, this.drawing.height * s / subdvision)
			}).stroke(this.drawing.context);
		}
		for (let s = 0; s < subdvision; ++s) {
			this.drawing.context.lineWidth = (s % 2) == 0 ? 1 : 0.5;
			new draw.Line({
				p0: new math.Vector(this.drawing.width * s / subdvision, 0)
				, p1: new math.Vector(this.drawing.width * s / subdvision, this.drawing.height)
			}).stroke(this.drawing.context);
		}
	}

	// Main work
	work = new task.Work({
		initializeCallback: () => {
			this.ui.resetInputs();
			this.drawGrid();
		}
		, startCallback: () => {
			this.drawing.context.strokeStyle = draw.randomColor({ r: { min: 100, max: 255 }, g: { min: 50, max: 255 }, b: { min: 50, max: 255 } });
			this.drawing.context.lineWidth = 3;

			this.scaleX = this.drawing.width / parseFloat(this.ui.inputs.scaleX.value);
			this.scaleY = this.drawing.height / (parseFloat(this.ui.inputs.scaleY.value) * 1e3);

			this.simulation.reset({
				initialSpeed_ms: parseFloat(this.ui.inputs.s0.value)
				, initialAltitude_m: parseFloat(this.ui.inputs.z0.value) * 1e3
				, initialMass_kg: parseFloat(this.ui.inputs.rocketMass.value)
				, stageDescription: this.ui.inputs.stages.value
				, pitchDescription: this.ui.inputs.pitch.value
			});
			this.time_s = 0;
		}
		, updateBeginCallback: () => this.parseInputs()
		, updateCallback: (dt_s) => {
			let p0 = this.plotRocket();

			dt_s = this.simulation.simulate(dt_s);
			this.time_s += dt_s;

			new draw.Line({
				p0: p0
				, p1: this.plotRocket()
			}).stroke(this.drawing.context);
		}
		, updateEndCallback: (dt_s, duration_s) => {
			this.updateOutputs();
			this.monitorDrawing.plotRatio(duration_s / dt_s);
		}
	})
};

start = function () {
	main.work.start();
};

stop = function () {
	main.work.stop();
}

clean = function () {
	main.drawing.clear();
	main.drawGrid();
}

templatechange = function () {
	main.ui.inputs.scaleX.value = 1;
	main.ui.inputs.scaleY.value = 1;
	main.ui.inputs.timeScale.value = 1;
	main.ui.inputs.timeStep.value = 1e-3;
	main.ui.inputs.rocketMass.value = 1;
	main.ui.inputs.rocketSectionArea.value = 1;
	main.ui.inputs.rocketDragCoeff.value = 1;
	main.ui.inputs.s0.value = 0;
	main.ui.inputs.z0.value = 0;
	main.ui.inputs.thrust.value = 0;
	main.ui.inputs.stages.value = "";
	main.ui.inputs.pitch.value = "";

	switch (main.ui.inputs.templates.value) {
		case "escape":
			main.ui.inputs.scaleX.value = 25e4;
			main.ui.inputs.scaleY.value = 50e4;
			main.ui.inputs.timeScale.value = 10e3;
			main.ui.inputs.timeStep.value = 1e-1;
			main.ui.inputs.rocketMass.value = 1000e3;
			main.ui.inputs.rocketSectionArea.value = 40;
			main.ui.inputs.rocketDragCoeff.value = 0.75;
			main.ui.inputs.s0.value = 13.5e3;
			break;
		case "catapult":
			main.ui.inputs.scaleX.value = 20;
			main.ui.inputs.scaleY.value = 250e-3;
			main.ui.inputs.rocketMass.value = 100;
			main.ui.inputs.rocketSectionArea.value = 1;
			main.ui.inputs.rocketDragCoeff.value = 0.5;
			main.ui.inputs.s0.value = 100;
			break;
		case "human":
			main.ui.inputs.scaleY.value = 0.5e-3;
			main.ui.inputs.rocketMass.value = 100;
			main.ui.inputs.rocketSectionArea.value = 0.3;
			main.ui.inputs.rocketDragCoeff.value = 1.5;
			main.ui.inputs.s0.value = 2.5;
			break;
		case "freefall":
			main.ui.inputs.scaleX.value = 25;
			main.ui.inputs.rocketMass.value = 100;
			main.ui.inputs.rocketSectionArea.value = 0.3;
			main.ui.inputs.rocketDragCoeff.value = 1.5;
			main.ui.inputs.z0.value = 1;
			break;
		case "ariane5a":
			main.ui.inputs.scaleX.value = 1e3;
			main.ui.inputs.scaleY.value = 500;
			main.ui.inputs.timeScale.value = 100;
			main.ui.inputs.timeStep.value = 1e-2;
			main.ui.inputs.rocketMass.value = 780e3;
			main.ui.inputs.rocketSectionArea.value = 100;
			main.ui.inputs.rocketDragCoeff.value = 0.75;
			main.ui.inputs.stages.value = "0,74,480,130,14000|0,12.5,174,540,1400|1,4,19,945,67";
			main.ui.inputs.pitch.value = "0,90|20,90|30,30"
			break;
		case "ariane5b":
			main.ui.inputs.scaleX.value = 20e3;
			main.ui.inputs.scaleY.value = 10e3;
			main.ui.inputs.timeScale.value = 1000;
			main.ui.inputs.timeStep.value = 1e-2;
			main.ui.inputs.rocketMass.value = 780e3;
			main.ui.inputs.rocketSectionArea.value = 100;
			main.ui.inputs.rocketDragCoeff.value = 0.75;
			main.ui.inputs.stages.value = "0,74,480,130,14000|0,12.5,174,540,1400|1,4,19,945,67";
			main.ui.inputs.pitch.value = "0,90|20,90|30,30"
			break;
	}
}

planetChange = function () {
	switch (main.ui.inputs.planets.value) {
		case "earth":
			main.simulation.planet = physx.earth;
			break;
		case "moon":
			main.simulation.planet = physx.moon;
			break;
	}
}