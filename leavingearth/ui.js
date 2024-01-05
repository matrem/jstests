let ui = {
	UI: class {
		inputs = {
			templates: document.getElementById("templates")
			, planets: document.getElementById("planets")
			, thrust: document.getElementById("thrust")
			, stages: document.getElementById("stages")
			, s0: document.getElementById("s0")
			, z0: document.getElementById("z0")
			, scaleX: document.getElementById("sx")
			, scaleY: document.getElementById("sy")
			, timeScale: document.getElementById("st")
			, timeStep: document.getElementById("ts")
			, rocketMass: document.getElementById("m0")
			, rocketSectionArea: document.getElementById("sa")
			, rocketDragCoeff: document.getElementById("dc")
		}

		outputs = {
			time_s: document.getElementById("t")
			, time_hr: document.getElementById("t_hr")
			, vs: document.getElementById("vs")
			, altitude_km: document.getElementById("z")
			, altitude_km3: document.getElementById("z_km3")
			, thrustAccell: document.getElementById("tz")
			, gravityAccell: document.getElementById("gz")
			, dragAccell: document.getElementById("dz")
			, accell: document.getElementById("accell")
			, mass: document.getElementById("mass")
		}

		resetInputs() {
			this.outputs.time_s.value = "";
			this.outputs.time_hr.value = "";
			this.outputs.vs.value = "";
			this.outputs.altitude_km.value = "";
			this.outputs.altitude_km3.value = "";
			this.outputs.thrustAccell.value = "";
			this.outputs.gravityAccell.value = "";
			this.outputs.dragAccell.value = "";
			this.outputs.accell.value = "";
			this.outputs.mass.value = "";
		}
	}
}