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
		length2() {
			let l2 = 0;
			this.components.map((component, index) => l2 = l2 + component * component)
			return l2;
		}
		length() {
			return Math.sqrt(this.length2());
		}
		normalize() {
			let l = this.length();
			return new math.Vector(
				...this.components.map((component, index) => component / l)
			)
		}
	}
}