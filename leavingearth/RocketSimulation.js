RocketSimulation = class extends physx.Simulation {
	thrust_N = 0;
	#dragCoeff = 0.75;
	#sectionArea_m2 = 40;
	lastAcceleration = 0;
	#lastMass = 0;
	#lastPosition;
	#lastV;
	planet;
	stages;
	#currentStage = 0;
	#time_s = 0;

	constructor({ planet }) {
		super({ simulateCallback: undefined });

		this.simulateCallback = this.simulateRocket;

		this.planet = planet;
		this.thrust = thrust;
		this.reset({ initialSpeed_ms: 0, initialAltitude_m: 0, initialMass_kg: 100e3 });
	}

	simulateRocket(dt_s) {
		this.time_s += dt_s;

		//Stages thrust computation
		if (this.stages.length > 0) {
			this.stagesComputation(dt_s);
		}

		if (this.pitches.length > 0) {
			this.pitchComputation();
		}

		this.forces = this.forceIntegration(dt_s);
		task.assertNAN(this.forces.gravity.y);

		this.lastAcceleration = this.rocket.acceleration;

		this.rocket.update(dt_s);
		task.assertNAN(this.rocket.position.y);

		this.computeCollision();
	}

	initLastParameters() {
		this.#lastMass = this.rocket.mass;
		this.#lastPosition = this.rocket.position;
		this.#lastV = this.rocket.velocity;
	}

	reset({ initialSpeed_ms, initialAltitude_m, initialMass_kg, stageDescription, pitchDescription }) {
		this.time_s = 0;

		this.rocket = new physx.Object(
			{
				position: new math.Vector(0, this.planet.radius_m + initialAltitude_m)
				, velocity: new math.Vector(0, initialSpeed_ms)
				, maxSpeed: undefined
				, acceleration: new math.Vector(0, 0)
				, mass: initialMass_kg
			}
		);

		this.stages = [];
		this.#currentStage = 0;

		this.pitches = [];

		if (stageDescription != undefined && stageDescription.length > 0) {
			let stagesStr = stageDescription.split('|');
			stagesStr.forEach(s => {
				let stageStr = s.split(',');
				if (stageStr.length == 5) {
					let grossMass_kg = parseFloat(stageStr[2] * 1e3);
					this.stages.push({
						priority: parseFloat(stageStr[0])
						, emptyMass_kg: parseFloat(stageStr[1] * 1e3)
						, grossMass_kg: grossMass_kg
						, flow_kgps: grossMass_kg / parseFloat(stageStr[3])
						, thrust_kN: parseFloat(stageStr[4])
					});
				}
				else {
					alert("invalid stage description " + stageStr);
				}
			});
		}

		if (pitchDescription != undefined && pitchDescription.length > 0) {
			let pitchesStr = pitchDescription.split('|');
			pitchesStr.forEach(p => {
				let pitchStr = p.split(',');
				if (pitchStr.length == 2) {
					this.pitches.push({
						time_s: parseFloat(pitchStr[0])
						, pitch_rad: math.deg2rad(parseFloat(pitchStr[1]))
					});
				}
				else {
					alert("invalid pitch description " + pitchStr);
				}
			});
		}

		this.initLastParameters();
	}

	stagesComputation(dt_s) {
		let removedMass_kg = 0;
		let thrust_kN = 0;

		let stageFound = false;
		let currentEmpty = true;
		this.stages.forEach(s => {
			if (s.priority == this.#currentStage) {
				stageFound = true;
				if (s.grossMass_kg != 0) {
					currentEmpty = false;
					let dM = s.flow_kgps * dt_s;
					if (dM > s.grossMass_kg) {
						dM = s.grossMass_kg
					}
					s.grossMass_kg -= dM;
					removedMass_kg += dM;
					if (s.grossMass_kg == 0) {
						removedMass_kg += s.emptyMass_kg;
					}
					else {
						thrust_kN += s.thrust_kN;
					}
				}
			}
		});

		if (stageFound && currentEmpty) {
			++this.#currentStage;
		}

		this.rocket.mass -= removedMass_kg;
		this.thrust_N = thrust_kN * 1e3;
	}

	pitchComputation() {
		this.pitch_rad = Math.PI / 2.0;

		let secondPitchIndex = this.pitches.findIndex(p => p.time_s > this.time_s);
		if (secondPitchIndex == -1) {
			this.pitch_rad = this.pitches[this.pitches.length - 1].pitch_rad;
		}
		else // interpolation
		{
			let p0 = this.pitches[secondPitchIndex - 1];
			let p1 = this.pitches[secondPitchIndex];

			let cursor_0_1 = (this.time_s - p0.time_s) / (p1.time_s - p0.time_s)
			this.pitch_rad = cursor_0_1 * (p1.pitch_rad - p0.pitch_rad) + p0.pitch_rad;
		}
	}

	//Force integration using mid value for parameters
	forceIntegration(dt_s) {
		let midMass = (this.#lastMass + this.rocket.mass) / 2.0;
		let midPosition = this.#lastPosition.mean(this.rocket.position);
		let midV = this.#lastV.mean(this.rocket.velocity);

		this.initLastParameters();

		let force = new math.Vector(0, 0);

		//Thrust
		let thrust = new math.Vector(0, 0);
		if (this.thrust_N > 0) {

			let vertical = this.rocket.position.normalize();
			let horizontal = new math.Vector(vertical.y, -vertical.x);
			let pitchDirection = vertical.mul(Math.sin(this.pitch_rad)).add(horizontal.mul(Math.cos(this.pitch_rad)));

			thrust = pitchDirection.mul(this.thrust_N);
		}

		force = force.add(thrust);

		//Gravity
		let g = physx.gravity({
			m0: midMass
			, m1: this.planet.mass_kg
			, p0: midPosition
			, p1: new math.Vector(0, 0)
		})

		force = force.add(g);

		//Atmospheric drag
		let drag = this.rocket.velocity.null();

		if (this.dragCoeff > 0 && this.sectionArea_m2 > 0) {
			let atmosphericDensity_kgpm3 = this.planet.atmosphericDensityFunc_m_kgpm3(
				Math.max(midPosition.length() - this.planet.radius_m, 0)
			);
			drag = physx.drag({
				fluidDendity_kgpm3: atmosphericDensity_kgpm3
				, velocity_mps: midV
				, dragCoeff: this.dragCoeff
				, area_m2: this.sectionArea_m2
			});

			force = force.add(drag);
		}

		this.rocket.applyForce(force);

		task.assertNAN(this.rocket.acceleration.z);

		return { thrust: thrust, gravity: g, drag: drag };
	}

	computeCollision() {
		if (this.rocket.position.length() <= this.planet.radius_m) {
			this.rocket.position = this.rocket.position.normalize().mul(this.planet.radius_m);
			this.rocket.velocity = this.rocket.velocity.null();
		}
	}
}