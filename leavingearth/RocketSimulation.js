Stage = class {
	constructor({ priority, emptyMass_kg, grossMass_kg, duration_s, thrust_kN }) {
		this.priority = priority;
		this.emptyMass_kg = emptyMass_kg;
		this.grossMass_kg = grossMass_kg;
		this.flow_kgps = grossMass_kg / duration_s;
		this.thrust_kN = thrust_kN;
	}
}

RocketSimulation = class extends physx.Simulation {
	thrust_N = 0;
	#dragCoeff = 0.75;
	#sectionArea_m2 = 40;
	lastAcceleration = 0;
	#lastMass = 0;
	#lastZ = 0;
	#lastV;
	planet;
	stages;
	#currentStage = 0;

	constructor({ planet }) {
		super({ simulateCallback: undefined });

		this.simulateCallback = this.simulateRocket;

		this.planet = planet;
		this.thrust = thrust;
		this.reset({ initialSpeed_ms: 0, initialAltitude_m: 0, initialMass_kg: 100e3, stageDescription: "" });
	}

	simulateRocket(dt_s) {
		this.forces = this.forceIntegration(dt_s);
		task.assertNAN(this.forces.gravity.z);

		this.lastAcceleration = this.rocket.acceleration;

		this.rocket.update(dt_s);
		task.assertNAN(this.rocket.position.z);

		this.computeCollision();
	}

	initLastParameters() {
		this.#lastMass = this.rocket.mass;
		this.#lastZ = this.rocket.position.z;
		this.#lastV = this.rocket.velocity;
	}

	reset({ initialSpeed_ms, initialAltitude_m, initialMass_kg, stageDescription }) {
		this.rocket = new physx.Object(
			{
				position: new math.Vector(0, 0, initialAltitude_m)
				, velocity: new math.Vector(0, 0, initialSpeed_ms)
				, maxSpeed: undefined
				, acceleration: new math.Vector(0, 0, 0)
				, mass: initialMass_kg
			}
		);

		this.stages = [];
		this.#currentStage = 0;

		if (stageDescription.length > 0) {
			let stagesStr = stageDescription.split('|');
			stagesStr.forEach(s => {
				let stageStr = s.split(',');
				if (stageStr.length == 5) {
					this.stages.push(
						new Stage({
							priority: parseFloat(stageStr[0])
							, emptyMass_kg: parseFloat(stageStr[1] * 1e3)
							, grossMass_kg: parseFloat(stageStr[2] * 1e3)
							, duration_s: parseFloat(stageStr[3])
							, thrust_kN: parseFloat(stageStr[4])
						})
					);
				}
				else {
					alert("invalid stage description " + stageStr);
				}
			});
		}

		this.initLastParameters();
	}

	thrustIntegration(dt_s) {
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

		return { mass_kg: removedMass_kg, thrust_kN: thrust_kN };
	}

	//Force integration using mid value for parameters
	forceIntegration(dt_s) {
		let midMass = (this.#lastMass + this.rocket.mass) / 2.0;
		let midZ = (this.#lastZ + this.rocket.position.z) / 2.0;
		let midV = this.#lastV.add(this.rocket.velocity).mul(0.5);

		this.initLastParameters();

		let force = new math.Vector(0, 0, 0);

		//Thrust
		let thrust = new math.Vector(0, 0, 0);

		//Stages thrust computation
		if (this.stages.length > 0) {
			let { mass_kg, thrust_kN } = this.thrustIntegration(dt_s);
			this.rocket.mass -= mass_kg;
			this.thrust_N = thrust_kN * 1e3;
		}

		if (this.thrust_N > 0) {
			thrust = new math.Vector(0, 0, this.thrust_N);
		}

		force = force.add(thrust);

		//Gravity
		let g = physx.gravity({
			m0: midMass
			, m1: this.planet.mass_kg
			, p0: new math.Vector(0, 0, this.planet.radius_m + midZ)
			, p1: new math.Vector(0, 0, 0)
		})

		force = force.add(g);

		//Atmospheric drag
		let drag = this.rocket.velocity.null();

		if (this.dragCoeff > 0 && this.sectionArea_m2 > 0) {
			let atmosphericDensity_kgpm3 = this.planet.atmosphericDensityFunc_m_kgpm3(midZ);
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
		if (this.rocket.position.z < 0) {
			this.rocket.position.z = 0;
			this.rocket.velocity = this.rocket.velocity.null();
		}
	}
}