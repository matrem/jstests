
RocketSimulation = class extends physx.Simulation {
	thrust = 0;
	#dragCoeff = 0.75;
	#sectionArea_m2 = 40;

	constructor() {
		super();

		this.simulateCallback = this.simulateRocket;

		this.thrust = thrust;
		this.reset(0, 100e3);
	}

	simulateRocket(dt_s) {
		this.forces = this.forceIntegration();
		task.assertNAN(this.forces.gravity.z);

		this.rocket.update(dt_s);
		task.assertNAN(this.rocket.position.z);

		this.computeCollision();
	}

	reset({ initialSpeed, initialMass_kg }) {
		this.rocket = new physx.Object(
			{
				position: new math.Vector(0, 0, 0)
				, velocity: new math.Vector(0, 0, initialSpeed)
				, maxSpeed: undefined
				, acceleration: new math.Vector(0, 0, 0)
				, mass: initialMass_kg
			}
		);
	}

	forceIntegration() {
		let force = new math.Vector(0, 0, 0);

		//Thrust
		let thrust = new math.Vector(0, 0, 0);

		if (thrust > 0) {
			thrust = new math.Vector(0, 0, thrust);
		}

		force.add(thrust);

		//Gravity
		let g = physx.gravity({
			m0: this.rocket.mass
			, m1: physx.earth.mass_kg
			, p0: new math.Vector(0, 0, physx.earth.radius_m + this.rocket.position.z)
			, p1: new math.Vector(0, 0, 0)
		})

		force = force.add(g);

		//Atmospheric drag
		let drag = this.rocket.velocity.null();

		if (this.dragCoeff > 0 && this.sectionArea_m2 > 0) {
			let atmosphericDensity_kgpm3 = physx.earth.atmosphericDensityFunc_m_kgpm3(this.rocket.position.z);
			drag = physx.drag({
				fluidDendity_kgpm3: atmosphericDensity_kgpm3
				, velocity_mps: this.rocket.velocity
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