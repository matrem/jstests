class Object {
	constructor(position, velocity, maxVelocity, acceleration) {
		this.position = position;
		this.velocity = velocity;
		this.maxVelocity = maxVelocity;
		this.acceleration = acceleration;
	}

	update(dt) {
		this.velocity = this.velocity.add(this.acceleration.mul(dt));
		let l = this.velocity.length();
		if (l > this.maxVelocity) {
			this.velocity = this.velocity.normalize().mul(this.maxVelocity);
		}
		this.position = this.position.add(this.velocity.mul(dt));
	}

	follow(position, velocity, dpFunc, dvFunc, dPScale, dVScale) {
		let dp = position.sub(this.position);
		let dv = velocity.sub(this.velocity);

		let dpl = dp.length();
		let pAccel = dp.normalize().mul(dpFunc(dpl) * dPScale);

		let dvl = dv.length();
		let vAccel = dv.normalize().mul(dvFunc(dvl) * dVScale);

		this.acceleration = pAccel.add(vAccel);
	}
}

let previousNow;

function updatePhysx(simulateCallback) {
	const now = window.performance.now();

	if (previousNow != undefined) {
		dt_s = now - previousNow;
		simulateCallback(dt_s / 1000.0);
	}

	previousNow = now;
}