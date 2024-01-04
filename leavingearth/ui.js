let ui = {
	UI: class {
		inputs = {
			thrust: document.getElementById("thrust")
			, s0: document.getElementById("s0")
			, scaleX: document.getElementById("sx")
			, scaleY: document.getElementById("sy")
			, timeScale: document.getElementById("st")
			, timeStep: document.getElementById("ts")
			, rocketMass: document.getElementById("m")
			, rocketSectionAread: document.getElementById("sa")
			, rocketDragCoeff: document.getElementById("dc")
		}

		outputs = {
			time_s: document.getElementById("t")
			, time_hr: document.getElementById("t_hr")
			, vs: document.getElementById("vs")
			, altitude_km: document.getElementById("z")
			, altitude_km3: document.getElementById("z_km3")
			, gravityAccell: document.getElementById("gz")
			, dragAccell: document.getElementById("dz")
		}

		resetInputs() {
			this.outputs.time_s.value = "";
			this.outputs.time_hr.value = "";
			this.outputs.vs.value = "";
			this.outputs.altitude_km.value = "";
			this.outputs.altitude_km3.value = "";
			this.outputs.gravityAccell.value = "";
			this.outputs.dragAccell.value = "";
		}
	}
}