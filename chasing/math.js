class Vector {
	constructor(...components) {
		this.components = components;
	}
	add({ components }) {
		return new Vector(
			...components.map((component, index) => this.components[index] + component)
		)
	}
	sub({ components }) {
		return new Vector(
			...components.map((component, index) => this.components[index] - component)
		)
	}
	mul(scalar) {
		return new Vector(
			...this.components.map((component, index) => component * scalar)
		)
	}
	length2() {
		let l2 = 1;
		this.components.map((component, index) => l2 = l2 + component * component)
		return l2;
	}
	length() {
		return Math.sqrt(this.length2());
	}
	normalize() {
		let l = this.length();
		return new Vector(
			...this.components.map((component, index) => component / l)
		)
	}
	get x() { return this.components[0] }
	set x(s) { this.components[0] = s; }
	get y() { return this.components[1] }
	set y(s) { this.components[1] = s; }
}