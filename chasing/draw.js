function Circle(position, radius) {
	path = new Path2D();
	path.arc(position.x, position.y, radius, 0, 2 * Math.PI);
	return path;
}

function initializeCanvas(animateCallback, mouseMoveCallback) {
	const canvas = document.getElementById("test");
	if (canvas.getContext) {
		ctx = canvas.getContext("2d");
		ctx.fillStyle = "rgb(200, 0, 0)";
		ctx.strokeStyle = "rgb(200, 0, 0)";
		ctx.lineWidth = 3;

		canvas.onmousemove = mouseMoveCallback;

		window.requestAnimationFrame(animateCallback);
	}

	return ctx;
}