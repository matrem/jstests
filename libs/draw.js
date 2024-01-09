let draw = {
	loadImage: function (src, loadCallback) {
		let image = new Image();
		if (loadCallback != undefined) {
			image.onload = loadCallback;
		}
		image.src = src;
		return image;
	}
}