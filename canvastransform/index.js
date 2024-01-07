Application = class {
	constructor() {
		const toolModes = {
			Pan: "pan",
			Zoom: "zoom",
			Info: "info"
		}

		let draw = new Drawing("draw");
		let layoutElement = document.getElementById("layout");

		let toolBar = new ToolBar({
			toolModes: Object.values(toolModes), defaultToolMode: toolModes.Pan
			, buttonMappings: [
				{
					buttonId: "fullscreen"
					, callback: () => {
						toolBar.updateFullScreenImg(
							interaction.toggleFullScreen(layoutElement)
						);
					}
				}
				, { buttonId: "reset", callback: () => draw.resetView() }
			]
			, fullscreenButtonId: "fullscreen"
		});

		draw.canvas.addEventListener("wheel", event => {
			draw.zoomView(
				interaction.getPointerPos(event)
				, Math.sign(-1 * event.deltaY) * 10
			);
		});

		new interaction.PrimaryDragInteraction({
			element: draw.canvas, mouseButton: 0
			, dragStartCallback: (current) => {
				switch (toolBar.toolMode) {
					case toolModes.Info:
						draw.plotPosition(current);
						break;
				}
			}
			, dragCallback: (start, current, dp) => {
				switch (toolBar.toolMode) {
					case toolModes.Pan:
						draw.panView(dp);
						break;
					case toolModes.Zoom:
						draw.zoomView(start, -1 * dp.y);
						break;
					case toolModes.Info:
						draw.plotPosition(current);
						break;
				}
			}
		});
	}
}

new Application();