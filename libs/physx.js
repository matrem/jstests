let physx = {
	// Physics object simulation
	// store and update position/velocity/maxVelocity/acceleration
	Object: class {
		constructor({ position, velocity, maxSpeed, acceleration, mass = 1 }) {
			this.position = position;
			this.velocity = velocity;
			this.maxSpeed = maxSpeed;
			this.acceleration = acceleration;
			this.mass = mass;
		}

		// update velocity and position from acceleration and dt
		update(dt) {
			this.velocity = this.velocity.add(this.acceleration.mul(dt));
			let l = this.velocity.length();
			if (l > this.maxSpeed) {
				this.velocity = this.velocity.normalize().mul(this.maxSpeed);
			}
			this.position = this.position.add(this.velocity.mul(dt));
			this.acceleration = this.acceleration.null();
		}

		// compute a new acceleration to follow a position/velocity
		// using deltaP/deltaV transformers and scales
		follow({ position, velocity, dPositionFunc, dSpeedFunc }) {
			let dp = position.sub(this.position);
			let dv = velocity.sub(this.velocity);

			let dpl = dp.length();

			let pAccel = dp.null();

			if (dpl > 0) {
				pAccel = dp.normalize().mul(dPositionFunc(dpl));
			}

			let dSpeed = dv.length();
			let vAccel = dv.null();

			if (dSpeed > 0) {
				vAccel = dv.normalize().mul(dSpeedFunc(dSpeed));
			}

			this.acceleration = pAccel.add(vAccel);
		}

		applyForce(force) {
			this.acceleration = force.mul(1.0 / this.mass);
		}
	},

	Simulation: class {
		constructor({ initCallback, simulateCallback }) {
			this.simulateCallback = simulateCallback;
			if (initCallback != undefined) initCallback();
		}

		// compute dt in seconds and call the given simulation callback
		update() {
			const now = window.performance.now();

			if (this.previousNow != undefined) {
				const dt_s = now - this.previousNow;
				this.simulateCallback(dt_s / 1000.0);
			}

			this.previousNow = now;
		}
	}

	, Planet: class {
		constructor({ mass_kg, radius_m, atmosphericDensityFunc_m_kgpm3 }) {
			this.mass_kg = mass_kg;
			this.radius_m = radius_m;
			this.atmosphericDensityFunc_m_kgpm3 = atmosphericDensityFunc_m_kgpm3;
		}
	}

	, G: 6.67430e-11

	//from p0 to p1
	, gravity: function ({ m0, m1, p0, p1 }) {
		direction = p1.sub(p0);
		const d2 = direction.length2();
		direction = direction.normalize();
		return direction.mul(this.G * m0 * m1 / d2);
	}

	, drag: function ({ fluidDendity_kgpm3, velocity_mps, dragCoeff, area_m2 }) {
		direction = velocity_mps.mul(-1.0);
		const s2 = direction.length2();
		if (s2 > 0) {
			direction = direction.normalize();
			return direction.mul(0.5 * fluidDendity_kgpm3 * s2 * dragCoeff * area_m2);
		}
		return direction.null();
	}

	, earthAtmosphericDensity_log10by10km: [
		0.083
		, -0.38
		, -1.03
		, -1.75
		, -2.97
		, -3.49
		, -4.05
		, -4.72
		, -5.47
		, -6.28
		, -7.02
		, -7.61
		, -8.07
		, -8.41
		, -8.68
		, -8.91
		, -9.09
		, -9.26
	]
}

physx.earth = new physx.Planet(
	{
		mass_kg: 5.972e24
		, radius_m: 6371e3
		, atmosphericDensityFunc_m_kgpm3: altitude_m => {
			// https://www.spaceacademy.net.au/watch/debris/atmosmod.htm
			let aCell = altitude_m / 10e3;
			if (aCell <= physx.earthAtmosphericDensity_log10by10km.length) {
				let bottomCell = Math.floor(aCell);
				let upCell = bottomCell + 1;
				let cursor = (aCell - bottomCell);

				let bottomValue = physx.earthAtmosphericDensity_log10by10km[bottomCell];
				let upValue = physx.earthAtmosphericDensity_log10by10km[upCell];
				let valueDelta = upValue - bottomValue;

				return Math.pow(10, bottomValue + cursor * valueDelta);
			}
			else {
				let Ap = 0;
				let F10 = (70 + 300) / 2.0;
				let T = 900 + 2.5 * (F10 - 70) + 1.5 * Ap;
				let h = (altitude_m / 1e3);
				let u = 27 - 0.012 * (h - 200);
				let H = T / u;
				return 6e-10 * Math.exp(-1 * (h - 175) / H);
			}
		}
	})