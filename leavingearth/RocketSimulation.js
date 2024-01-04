
RocketSimulation = class extends physx.Simulation {
	thrust = 0;
	#dragCoeff = 0.75;
	#sectionArea_m2 = 40;
	lastAcceleration = 0;
	#lastMass = 0;
	#lastZ = 0;
	#lastV;

	constructor() {
		super({ simulateCallback: undefined });

		this.simulateCallback = this.simulateRocket;

		this.thrust = thrust;
		this.reset(0, 100e3);
	}

	simulateRocket(dt_s) {
		this.forces = this.forceIntegration();
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

	reset({ initialSpeed, initialAltitude_m, initialMass_kg }) {
		this.rocket = new physx.Object(
			{
				position: new math.Vector(0, 0, initialAltitude_m)
				, velocity: new math.Vector(0, 0, initialSpeed)
				, maxSpeed: undefined
				, acceleration: new math.Vector(0, 0, 0)
				, mass: initialMass_kg
			}
		);

		this.initLastParameters();
	}

	//Force integration using mid value for parameters
	forceIntegration() {
		let midMass = (this.#lastMass + this.rocket.mass) / 2.0;
		let midZ = (this.#lastZ + this.rocket.position.z) / 2.0;
		let midV = this.#lastV.add(this.rocket.velocity).mul(0.5);

		this.initLastParameters();

		let force = new math.Vector(0, 0, 0);

		//Thrust
		let thrust = new math.Vector(0, 0, 0);

		if (this.thrust > 0) {
			thrust = new math.Vector(0, 0, this.thrust);
		}

		force = force.add(thrust);

		//Gravity
		let g = physx.gravity({
			m0: midMass
			, m1: physx.earth.mass_kg
			, p0: new math.Vector(0, 0, physx.earth.radius_m + midZ)
			, p1: new math.Vector(0, 0, 0)
		})

		force = force.add(g);

		//Atmospheric drag
		let drag = this.rocket.velocity.null();

		if (this.dragCoeff > 0 && this.sectionArea_m2 > 0) {
			let atmosphericDensity_kgpm3 = physx.earth.atmosphericDensityFunc_m_kgpm3(midZ);
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