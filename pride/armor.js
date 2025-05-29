let swapTexture;

(function(){

const scalingFactor = 5;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1, 1, 1000);
const upscaleCanvas = document.createElement("canvas");
upscaleCanvas.style.display = "none";
const renderer = new THREE.WebGLRenderer({
	canvas: upscaleCanvas,
	alpha: true
});

const downscaleCanvas = document.querySelector("#downscale-canvas");
const ctx = downscaleCanvas.getContext("2d");
downscaleCanvas.width = 256;
downscaleCanvas.height = 256;

renderer.setSize(256*2, 256*2);
document.body.appendChild(renderer.domElement);

const textureLoader = new THREE.TextureLoader();
const textures = {};
const textureSizes = {
	"stone": {
		width: 12,
		height: 12
	},
	"wood": {
		width: 16,
		height: 16
	},
	"elytra": {
		width: 64,
		height: 32
	},
};
textures["stone"] = textureLoader.load("stoneplate.png", (tex) => {
	tex.magFilter = THREE.NearestFilter;
	tex.minFilter = THREE.NearestFilter;
	tex.wrapS = THREE.ClampToEdgeWrapping;
	tex.wrapT = THREE.ClampToEdgeWrapping;
});
textures["wood"] = textureLoader.load("wood.png", (tex) => {
	tex.magFilter = THREE.NearestFilter;
	tex.minFilter = THREE.NearestFilter;
	tex.wrapS = THREE.ClampToEdgeWrapping;
	tex.wrapT = THREE.ClampToEdgeWrapping;
});

swapTexture = str => {
	if (str === "") {
		// Create a fully transparent texture (1x1 pixel transparent image)
		const transparentTexture = new THREE.Texture(new Image());

		// Assign the transparent texture
		textures["elytra"] = transparentTexture;
		clearScene();
		return;
	}
	const newPath = `assets/${str}/elytra.png`;
	textureLoader.load(newPath, (tex) => {
		tex.magFilter = THREE.NearestFilter;
		tex.minFilter = THREE.NearestFilter;
		tex.wrapS = THREE.ClampToEdgeWrapping;
		tex.wrapT = THREE.ClampToEdgeWrapping;
		textures["elytra"] = tex;
		clearScene();
	});
}
let elytraUVMaps = [{}, {
	front: {
		u1: 0,
		v1: 0,
		u2: 1,
		v2: 1
	},
	back: {
		u1: 35,
		v1: 10,
		u2: 46,
		v2: 30
	},
	right: {
		u1: 0,
		v1: 0,
		u2: 1,
		v2: 1
	},
	left: {
		"u1": "23",
		"v1": "10",
		"u2": "21",
		"v2": "30"
	},
	top: {
		"u1": "22",
		"v1": "30",
		"u2": "34",
		"v2": "32"
	},
	bottom: {
		u1: 0,
		v1: 0,
		u2: 1,
		v2: 1
	},
}, {
	front: {
		u1: 0,
		v1: 0,
		u2: 1,
		v2: 1
	},
	back: {
		u1: 46,
		v1: 10,
		u2: 35,
		v2: 30
	},
	left: {
		u1: 0,
		v1: 0,
		u2: 1,
		v2: 1
	},
	right: {
		"u1": "21",
		"v1": "10",
		"u2": "23",
		"v2": "30"
	},
	top: {
		"u1": "34",
		"v1": "30",
		"u2": "22",
		"v2": "32"
	},
	bottom: {
		u1: 0,
		v1: 0,
		u2: 1,
		v2: 1
	},
}];

function getFaceType(normal) {
	const worldX = new THREE.Vector3(1, 0, 0);
	const worldY = new THREE.Vector3(0, 1, 0);
	const worldZ = new THREE.Vector3(0, 0, 1);

	const dotX = normal.dot(worldX);
	const dotY = normal.dot(worldY);
	const dotZ = normal.dot(worldZ);

	let faceType;

	if (dotX > 0.9) faceType = "right";
	else if (dotX < -0.9) faceType = "left";
	else if (dotY > 0.9) faceType = "top";
	else if (dotY < -0.9) faceType = "bottom";
	else if (dotZ > 0.9) faceType = "front";
	else if (dotZ < -0.9) faceType = "back";
	else faceType = "unknown";

	return faceType;
}

function clearScene() {
	for (let i = scene.children.length - 1; i >= 0; i--) {
		const obj = scene.children[i];
		if (obj.isMesh) {
			scene.remove(obj);
		}
	}
	boxes.forEach(createBox);
}

function createBox(box) {
	let scale = box.scale;
	let origin = box.origin;
	let rotation = box.rotation ? box.rotation : [0, 0, 0];
	const geometry = new THREE.BoxGeometry(scale[0] * scalingFactor, scale[1] * scalingFactor, scale[2] * scalingFactor);
	const material = new THREE.MeshBasicMaterial({
		map: box.elytra ? textures["elytra"] : textures[box.material],
		transparent: true,
		opacity: 1,
		alphaTest: 0.5,
		side: THREE.DoubleSide
	});

	const uvAttribute = geometry.attributes.uv;
	const normalAttribute = geometry.attributes.normal; // Get face normal directions

	for (let i = 0; i < uvAttribute.count; i++) {
		const normal = new THREE.Vector3(
			normalAttribute.getX(i),
			normalAttribute.getY(i),
			normalAttribute.getZ(i)
		);

		let u, v;
		if (box.elytra) {
			let {
				u1,
				v1,
				u2,
				v2
			} = elytraUVMaps[box.elytra][getFaceType(normal)];

			u1 /= textureSizes["elytra"].width;
			v1 /= textureSizes["elytra"].height;
			u2 /= textureSizes["elytra"].width;
			v2 /= textureSizes["elytra"].height;
			uvAttribute.setXY(i, u1 + (uvAttribute.getX(i) * (u2 - u1)), v1 + (uvAttribute.getY(i) * (v2 - v1)));

		} else {
			// **Default Texture Mapping (Stone)**
			if (Math.abs(normal.x) > 0) {
				u = (uvAttribute.getX(i) * scale[2]) / textureSizes[box.material].width;
				v = (uvAttribute.getY(i) * scale[1]) / textureSizes[box.material].height;
			} else if (Math.abs(normal.y) > 0) {
				u = (uvAttribute.getX(i) * scale[0]) / textureSizes[box.material].width;
				v = (uvAttribute.getY(i) * scale[2]) / textureSizes[box.material].height;
			} else {
				u = (uvAttribute.getX(i) * scale[0]) / textureSizes[box.material].width;
				v = (uvAttribute.getY(i) * scale[1]) / textureSizes[box.material].height;
			}

			uvAttribute.setXY(i, u, v);
		}
	}

	const cube = new THREE.Mesh(geometry, material);
	cube.position.set(origin[0] * scalingFactor, origin[1] * scalingFactor, origin[2] * scalingFactor);

	cube.rotation.set(rotation[0], rotation[1], rotation[2]);

	scene.add(cube);
}

const boxes = [{
	scale: [12, 1, 12],
	origin: [0, 0, 0],
	material: "stone"
}, {
	scale: [2, 11, 2],
	origin: [-2, 6, 0],
	material: "wood"
}, {
	scale: [2, 11, 2],
	origin: [2, 6, 0],
	material: "wood"
}, {
	scale: [8, 2, 2],
	origin: [0, 12.5, 0],
	material: "wood"
}, {
	scale: [2, 7, 2],
	origin: [-2, 17, 0],
	material: "wood"
}, {
	scale: [2, 7, 2],
	origin: [2, 17, 0],
	material: "wood"
}, {
	scale: [12, 3, 3],
	origin: [0, 20, 0],
	material: "wood"
}, {
	scale: [2, 6, 2],
	origin: [0, 24.5, 0],
	material: "wood"
}, {
	scale: [12, 20, 2],
	origin: [3, 11.5, -3],
	rotation: [0.15, 0.1, 0.25],
	elytra: 1
}, ];

boxes.push({
	scale: boxes[boxes.length - 1].scale,
	origin: boxes[boxes.length - 1].origin.map((v, i, a) => i == 0 ? -v : v),
	rotation: boxes[boxes.length - 1].rotation.map((v, i, a) => i != 0 ? -v : v),
	elytra: 2
});

camera.position.set(0, 100, 200);

ctx.imageSmoothingEnabled = true;
function animate() {
	requestAnimationFrame(animate);
	
	let angle = Date.now() * 0.0007;
	
	camera.position.x = Math.sin(angle) * 200;
	camera.position.z = Math.cos(angle) * 200;
	camera.lookAt(new THREE.Vector3(0, 12 * scalingFactor, 0)); // Focus on the central box
	renderer.render(scene, camera);
	
	ctx.clearRect(0, 0, downscaleCanvas.width, downscaleCanvas.height);
	ctx.drawImage(renderer.domElement, 0, 0, downscaleCanvas.width, downscaleCanvas.height);
}

clearScene();

animate();

})();