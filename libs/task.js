let task = {

	Work: class {
		#started = false;

		constructor({ initCallback, updateCallback, updateStartCallback, updateEndCallback }) {
			this.updateCallback = updateCallback;
			this.updateStartCallback = updateStartCallback;
			this.updateEndCallback = updateEndCallback;
			if (initCallback != undefined) initCallback();
		}

		start() {
			this.started = true;
			window.requestAnimationFrame(this.#update.bind(this));
		}

		stop() {
			this.started = false;
		}

		#update() {
			const now_ms = window.performance.now();

			if (this.started) {
				if (this.previousNow_ms != undefined) {
					if (this.updateStartCallback != undefined) this.updateStartCallback();

					let dt_ms = now_ms - this.previousNow_ms;

					this.updateCallback(dt_ms / 1e3);

					let duration_ms = window.performance.now() - now_ms;
					if (this.updateEndCallback != undefined) this.updateEndCallback(dt_ms / 1e3, duration_ms / 1e3);
				}
				window.requestAnimationFrame(this.#update.bind(this));
			}

			this.previousNow_ms = now_ms;
		}
	}

	, assertNAN(value) {
		if (value != value) {
			alert("nan");
		}
	}

}