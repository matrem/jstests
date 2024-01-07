let interaction = {
	toggleFullScreen: function (element) {
		if (!document.fullscreenElement) {
			element.requestFullscreen();
			return true;
		}
		else {
			document.exitFullscreen();
			return false;
		}
	}

	, getPointerPos(event) {
		return new math.Vector(event.offsetX, event.offsetY);
	}

	, PrimaryDragInteraction: class {
		#pointerDown = false;
		#startPosition
		#pointerPosition

		constructor({
			element, mouseButton
			, dragStartCallback, dragCallback
		}) {
			element.addEventListener("pointerdown", (event) => {
				element.setPointerCapture(event.pointerId);

				if (event.isPrimary && (event.pointerType == "touch" || event.button == mouseButton)) {
					this.#pointerDown = true;
					this.#startPosition = interaction.getPointerPos(event);
					this.#pointerPosition = this.#startPosition;

					if (dragStartCallback != undefined) dragStartCallback(this.#startPosition)
				}
			});
			element.addEventListener("pointerup", (event) => {
				element.releasePointerCapture(event.pointerId);

				if (event.isPrimary) {
					this.#pointerDown = false;
				}
			});
			element.addEventListener("pointermove", (event) => {
				if (event.isPrimary && this.#pointerDown) {
					let pos = interaction.getPointerPos(event);
					let dp = pos.sub(this.#pointerPosition);
					this.#pointerPosition = pos;
					if (dragCallback != undefined) dragCallback(this.#startPosition, this.#pointerPosition, dp);
				}
			});
		}
	}
}