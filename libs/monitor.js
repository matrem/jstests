let monitor = {
	Drawing: class {
		#monitorX = 0;
		#monitorRatio = 0;
		step = 0.1;

		constructor({ containerId, step = 0.1 }) {
			this.monitor = new draw.Drawing({
				containerId: containerId
				, autoClear: false
				, initializeCallback: (ctx) => {
					this.monitor.context.strokeStyle = "rgb(200, 0, 0)";
					this.monitor.context.lineWidth = 1;
				}
			});
			this.step = step;
		}

		#plotMonitor() {
			let plot = new math.Vector(this.#monitorX, this.monitor.height * (1 - this.#monitorRatio));
			this.#monitorX += this.step;
			if (this.#monitorX >= this.monitor.width) {
				this.#monitorX = 0;
				this.monitor.clear();
			}
			return plot;
		}

		plotRatio(ratio) {
			this.monitor.draw();
			let m0 = this.#plotMonitor();
			this.#monitorRatio = ratio;
			new draw.Line({
				p0: m0
				, p1: this.#plotMonitor()
			}).stroke(this.monitor.context);
		}
	}
}