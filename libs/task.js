let task = {

	Work: class {
		#started = false;

		constructor({
			initializeCallback
			, startCallback
			, updateCallback
			, updateBeginCallback
			, updateEndCallback
		}) {
			this.startCallback = startCallback;
			this.updateCallback = updateCallback;
			this.updateBeginCallback = updateBeginCallback;
			this.updateEndCallback = updateEndCallback;
			if (initializeCallback != undefined) initializeCallback();
		}

		start() {
			this.started = true;
			this.previousNow_ms = undefined;
			if (this.startCallback != undefined) this.startCallback();
			window.requestAnimationFrame(this.#update.bind(this));
		}

		stop() {
			this.started = false;
			this.previousNow_ms = undefined;
		}

		#update() {
			const now_ms = window.performance.now();

			if (this.started) {
				if (this.previousNow_ms != undefined) {
					if (this.updateBeginCallback != undefined) this.updateBeginCallback();

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
			console.error("nan");
		}
	}

}