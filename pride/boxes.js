(function(){

let bg = parseInt(window.getComputedStyle(document.body).getPropertyValue("--bg").substring(1), 16);
let fg = parseInt(window.getComputedStyle(document.body).getPropertyValue("--fg").substring(1), 16);

const scene = new THREE.Scene();
scene.background = new THREE.Color(bg);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
	canvas: document.querySelector("#boxes-canvas"),
	antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const world = new CANNON.World();
world.gravity.set(0, -9.81, 0);

const groundBody = new CANNON.Body({
	mass: 0,
	shape: new CANNON.Plane(),
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

const groundGeometry = new THREE.PlaneGeometry(10, 10);
const groundMaterial = new THREE.MeshBasicMaterial({ color: bg });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const cubes = [];

function createCube(colors) {
	const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
	const materials = [
		new THREE.MeshBasicMaterial({ color: colors[0] }),
		new THREE.MeshBasicMaterial({ color: colors[0] }),
		new THREE.MeshBasicMaterial({ color: colors[1] }),
		new THREE.MeshBasicMaterial({ color: colors[1] }),
		new THREE.MeshBasicMaterial({ color: colors[2] }),
		new THREE.MeshBasicMaterial({ color: colors[2] })
	];
	const cube = new THREE.Mesh(geometry, materials);
	scene.add(cube);

	const shape = new CANNON.Box(new CANNON.Vec3(0.25, 0.25, 0.25));
	const body = new CANNON.Body({
		mass: 1,
		shape: shape,
		position: new CANNON.Vec3((Math.random() - 0.5) * 1, 10, (Math.random() - 0.5) * 1),
	});

	body.quaternion.setFromEuler(
		Math.random() * Math.PI * 2, 
		Math.random() * Math.PI * 2, 
		Math.random() * Math.PI * 2
	);

	world.addBody(body);

	cubes.push({ mesh: cube, body: body, spawnedAt: Date.now() });
}

let angle = 0;
const radius = 5;

function animate() {
	requestAnimationFrame(animate);

	world.step(1 / 60);

	const currentTime = Date.now();

	cubes.forEach(cubeObj => {
		cubeObj.mesh.position.copy(cubeObj.body.position);
		cubeObj.mesh.quaternion.copy(cubeObj.body.quaternion);
	});

	for (let i = cubes.length - 1; i >= 0; i--) {
		if (currentTime - cubes[i].spawnedAt > 60000) {
			scene.remove(cubes[i].mesh);
			world.removeBody(cubes[i].body);
			cubes.splice(i, 1);
		}
	}

	angle += 0.001;
	camera.position.x = Math.cos(angle) * 5;
	camera.position.z = Math.sin(angle) * 5;
	camera.lookAt(new THREE.Vector3(0, 1, 0));

	renderer.render(scene, camera);
}

camera.position.set(0, 2, 5);
animate();

window.addEventListener('resize', () => {
	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
});

let counter = 0;
for (let i = 0; i < 5; i++) setTimeout(function() {createCube(options[(counter++)%options.length].colors);}, 100*i);
setInterval(function() {createCube(options[(counter++)%options.length].colors);}, 500);

})();