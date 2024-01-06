let math = {
	// Vector with any number of components
	Vector: class {
		constructor(...components) {
			this.components = components;
		}

		get x() { return this.components[0] }
		set x(s) { this.components[0] = s; }
		get y() { return this.components[1] }
		set y(s) { this.components[1] = s; }
		get z() { return this.components[2] }
		set z(s) { this.components[2] = s; }

		null() {
			return new math.Vector(
				...this.components.map((component, index) => 0)
			)
		}

		XAxis() {
			return new math.Vector(
				...this.components.map((component, index) => index == 0 ? 1 : 0)
			)
		}

		YAxis() {
			return new math.Vector(
				...this.components.map((component, index) => index == 1 ? 1 : 0)
			)
		}

		ZAxis() {
			return new math.Vector(
				...this.components.map((component, index) => index == 2 ? 1 : 0)
			)
		}

		add({ components }) {
			return new math.Vector(
				...components.map((component, index) => this.components[index] + component)
			)
		}
		sub({ components }) {
			return new math.Vector(
				...components.map((component, index) => this.components[index] - component)
			)
		}
		mul(scalar) {
			return new math.Vector(
				...this.components.map((component, index) => component * scalar)
			)
		}
		div(scalar) {
			return new math.Vector(
				...this.components.map((component, index) => component / scalar)
			)
		}
		mean({ components }) {
			return new math.Vector(
				...components.map((component, index) => (this.components[index] + component) / 2.0)
			)
		}
		ceil() {
			return new math.Vector(
				...this.components.map((component, index) => Math.ceil(component))
			)
		}
		floor() {
			return new math.Vector(
				...this.components.map((component, index) => Math.floor(component))
			)
		}
		round() {
			return new math.Vector(
				...this.components.map((component, index) => Math.round(component))
			)
		}
		modulo(scalar) {
			return new math.Vector(
				...this.components.map((component, index) => component % scalar)
			)
		}
		length2() {
			let l2 = 0;
			this.components.map((component, index) => l2 = l2 + component * component)
			return l2;
		}
		length() {
			return Math.sqrt(this.length2());
		}
		distance(v) {
			return this.sub(v).length();
		}
		normalize() {
			let l = this.length();
			return new math.Vector(
				...this.components.map((component, index) => component / l)
			)
		}
		dot({ components }) {
			let dot = 0;
			this.components.map((component, index) => dot = dot + component * components[index]);
			return dot;
		}
		ortho2da() {
			return new math.Vector(this.y, -this.x);
		}
		ortho2db() {
			return new math.Vector(-this.y, this.x);
		}
	}
}