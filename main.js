import {
    Camera,
    Material,
    Mesh,
    Model,
    Node,
    Primitive,
    Sampler,
    Texture,
    Transform,
    Vertex,
} from './common/engine/core.js';

import { ImageLoader } from './common/engine/loaders/ImageLoader.js';
import { OBJLoader } from './common/engine/loaders/OBJLoader.js';
import { JSONLoader } from './common/engine/loaders/JSONLoader.js';

import { ResizeSystem } from './common/engine/systems/ResizeSystem.js';
import { UpdateSystem } from './common/engine/systems/UpdateSystem.js';

import { Renderer } from './common/engine/renderers/Renderer.js';

import { Luna } from './common/game/Luna.js';
import { Island } from './common/game/Island.js';
import { LunaController } from './common/game/LunaController.js';
import { Physics } from './common/game/Physics.js';
import { ScenePhysics } from './common/game/ScenePhysics.js';
import { quat } from './lib/gl-matrix-module.js';
import { Bird } from './common/game/Bird.js';
import { JetpackGenerator } from './common/game/JetpackGenerator.js';

import {
    calculateAxisAlignedBoundingBox,
    mergeAxisAlignedBoundingBoxes,
} from './common/engine/core/MeshUtils.js';

import { vec3 } from './lib/gl-matrix-module.js';
import { SkyBox } from './common/game/SkyBox.js';
import { Meteor } from './common/game/Meteor.js';
import { IslandGenerator } from './common/game/IslandGenerator.js';
import { MeteorGenerator } from './common/game/MeteorGenerator.js';
import { RotateAnimator } from './common/engine/animators/RotateAnimator.js';


const canvas = document.querySelector('canvas');
const renderer = new Renderer(canvas);
await renderer.initialize();



let phong_fragment_pipeline = await renderer.getPipeline([['position', 'texcoords', 'normal'], ['float32x3', 'float32x2', 'float32x3']], 'phong_shader.wgsl');
let phong_vertex_pipeline = await renderer.getPipeline([['position', 'texcoords', 'normal'], ['float32x3', 'float32x2', 'float32x3']], 'phong_vertex_shader.wgsl');

let GUI_pipeline = await renderer.getPipeline([['position2f', 'texcoords', 'color'], ['float32x2', 'float32x2', 'float32x3']], 'GUIshader.wgsl');


let red_light  = [vec3.fromValues(1., 0., 0.), vec3.fromValues(0., 1., 0.2), vec3.fromValues(0.0, 0.0, 0.0)];
//let blue_light = [vec3.fromValues(0., 0., 1.), vec3.fromValues(10., 2., 0.), vec3.fromValues(0.02, 0.02, 0.02)];
let sun_light  = [vec3.fromValues(0.5, 0.5, 0.5), vec3.fromValues(-1., -1., -1.), vec3.fromValues(0.0, 0.0, 0.0)];
renderer.lights = [red_light, /*blue_light,*/ sun_light];


const loader_OBJ = new OBJLoader();
const loader_JSON = new JSONLoader();


function restartGame() {
    document.getElementById('gameOverScreen').style.display = 'none';

    const luna = player.getComponentOfType(Luna);
    luna.initialize(); // Reset Luna

    const islandGen = islandGenerator.getComponentOfType(IslandGenerator);
    if (islandGen) {
        islandGen.begin_generation(); // Reset the island generator
    }

}

document.getElementById('restartButton').addEventListener('click', restartGame);




// Luna mesh and textures
const luna_mesh = await loader_OBJ.loadMesh('./common/models/luna/BV2.obj');


let luna_material = new Material();
luna_material.baseTexture = new Texture({
    image: await new ImageLoader().load('./common/models/luna/goz.png'),
    sampler: new Sampler(),
});
luna_material.diffuse = 1.;
luna_material.specular = 1.;
luna_material.shininess = 50.;


// Flag mesh and textures
const flagMesh = await loader_OBJ.loadMesh('./common/models/flag/Flag.obj');
let flagMaterial = await createColorMaterial([255, 0, 0, 255]); // Red color, RGBA

// Create and add the flag model to the scene
let flag = createAndAddModel(
    [0, .75, 0], // Adjust the position of the flag in your scene

    [.2, .2, .2], // Adjust the scale of the flag as needed
    [new Primitive({ mesh: flagMesh, material: flagMaterial })],
    false, // isStatic - set to true if the flag doesn't move
    false  // isDynamic - set to true if the flag will be moving or animated
);
flag.name = "Flag";


// Island mesh and textures
const island_mesh = await loader_OBJ.loadMesh('./common/models/island/island.obj');

let island_material1 = new Material();
island_material1.baseTexture = new Texture({
    image: await new ImageLoader().load('./common/models/island/island.png'),
    sampler: new Sampler({addressModeU: 'repeat', addressModeV: 'repeat'}),
});
island_material1.diffuse = 1.;
island_material1.specular = 0.0000001;
island_material1.shininess = 0.000001;

let island_material2 = new Material();
island_material2.baseTexture = new Texture({
    image: await new ImageLoader().load('./common/images/grass.png'),
    sampler: new Sampler({addressModeU: 'repeat', addressModeV: 'repeat'}),
});
island_material2.diffuse = 1.;
island_material2.specular = 0.0000001;
island_material2.shininess = 0.000001;

// Rook mesh and textures


async function createColorMaterial(color){
    let material = new Material();
    material.baseTexture = new Texture({
        image: await createImageBitmap(new ImageData(new Uint8ClampedArray(color), 1, 1)),
        sampler: new Sampler(),
    });
    material.diffuse = 1.;
    material.specular = 1.;
    material.shininess = 50.;

    
    return material;
}

let white_material = await createColorMaterial([255, 255, 255, 255]);
let c0 = await createColorMaterial([255, 0, 0, 255]);
let c1 = await createColorMaterial([128, 128, 0, 255]);
let c2 = await createColorMaterial([0, 255, 0, 255]);
let c3 = await createColorMaterial([0, 128, 128, 255]);
let c4 = await createColorMaterial([0, 0, 256, 255]);


let birdMaterial = new Material(); 
birdMaterial.baseTexture = new Texture({
    image: await new ImageLoader().load('./common/models/bird/bird.png'),
    sampler: new Sampler(),
});
// MODELS

let camera = new Node();
camera.addComponent(new Camera());
camera.addComponent(new Transform({translation: [0, 10., 0]}))

let player = createAndAddModel([0, 10, -10], [.1, .1, .1], [new Primitive({ mesh: luna_mesh, material: luna_material })], false, true);
let islandGenerator = new Node();

player.addComponent(new Physics(player));
player.addComponent(new Luna(player));
player.addComponent(new LunaController(player, camera, islandGenerator, canvas, {firstPerson: false}));
player.aabb = {
    min: [-0.8, -24, -0.8],
    max: [0.8, 12, 0.8],
};

let jetpack_mesh = await loader_OBJ.loadMesh('./common/models/jetpack/model.obj');
let jetpackGenerator = new Node();
jetpackGenerator.addComponent(new JetpackGenerator(jetpackGenerator, player, [jetpack_mesh], [c0, c1]));

islandGenerator.addComponent(new IslandGenerator(islandGenerator, player, jetpackGenerator, [island_mesh], [island_material1, island_material2, c0, c1, c2, c3, c4]));










let skyBoxMesh = await loader_OBJ.loadMesh('./common/models/cube/cube.obj');


let materialSkyBox = new Material();

let skyboxImages = await Promise.all([
    './common/models/skybox/front.png',
    './common/models/skybox/back.png',
    './common/models/skybox/top.png',
    './common/models/skybox/bottom.png',
    './common/models/skybox/left.png',
    './common/models/skybox/right.png',
].map(url => new ImageLoader().load(url)));


skyboxImages = await new ImageLoader().load('./common/models/skybox/front.png');

materialSkyBox.baseTexture = new Texture({
    image: skyboxImages,
    sampler: new Sampler({addressModeU: 'repeat', addressModeV: 'repeat'}),
});


let skyBox = createAndAddModel([0, -10, 0], [200, 200, 200], [new Primitive({ mesh: skyBoxMesh, material: materialSkyBox })], false, false);
skyBox.addComponent(new SkyBox(skyBox, camera));

let meteorMesh = await loader_OBJ.loadMesh('./common/models/meteor/meteor.obj');

let meteorGenerator = new Node();
meteorGenerator.addComponent(new MeteorGenerator(meteorGenerator, player, islandGenerator, [new Primitive({ mesh: meteorMesh, material: white_material })]));

let birdMesh = await loader_OBJ.loadMesh('./common/models/bird/bird.obj');
let bird = createAndAddModel([0, 20, -20], [0.1, 0.1, 0.1], [new Primitive({ mesh: birdMesh, material: birdMaterial })], true, false);

bird.addComponent(new Physics(bird));
bird.addComponent(new Bird(bird, player));
bird.aabb = {
    min: [-0.5, -0.5, -0.5],
    max: [0.5, 0.5, 0.5],
};

let gui_element_mesh = new Mesh({
    vertices: [
        new Vertex({position2f: [0, 0], texcoords: [0, 0], color: [1, 1, 1, 1]}),
        new Vertex({position2f: [0, 1], texcoords: [0, 1], color: [1, 1, 1, 1]}),
        new Vertex({position2f: [1, 1], texcoords: [1, 1], color: [1, 1, 1, 1]}),
        new Vertex({position2f: [1, 0], texcoords: [1, 0], color: [1, 1, 1, 1]}),
    ],
    indices: [0, 1, 2, 0, 3, 2]
});

let jetpack_gauge = createAndAddModel([0, 0, 0], [1, 1, 1], [new Primitive({ mesh: gui_element_mesh, material: white_material })], false, false);

















let scene = new Node();
scene.addComponent(new ScenePhysics(scene));

scene.addChild(camera);
scene.addChild(player);
scene.addChild(skyBox);
scene.addChild(islandGenerator);
scene.addChild(meteorGenerator);
scene.addChild(bird);
scene.addChild(jetpackGenerator);
//scene.addChild(jetpack_gauge);
islandGenerator.children[0].addChild(flag);

console.log("Scene children:", scene.children); // This will show all children of the scene

function update(t, dt) {
    scene.traverse(node => {
        for (const component of node.components) {
            component.update?.(t, dt);
        }
    });

    checkGameOver();
}

function createAndAddModel(translation, scale, primitives, isStatic, isDynamic) {
    const node = new Node();
    node.addComponent(new Transform({ translation, scale }));
    node.addComponent(new Model({ primitives }));
    node.isStatic = isStatic;
    node.isDynamic = isDynamic;
    return node;
}


function render() {
    renderer.render_begin();

    renderer.setupPipeline(phong_vertex_pipeline);
    renderer.render_setup(camera);
    renderer.render(player);
    renderer.render(islandGenerator);
    renderer.render(bird);
    renderer.render(meteorGenerator);
    renderer.render(jetpackGenerator);


    renderer.setupPipeline(phong_fragment_pipeline);
    renderer.render_setup(camera);
    renderer.render(skyBox);

    //renderer.render(flag);

    //renderer.setupPipeline(GUI_pipeline);
    //renderer.render_setup();
    //renderer.render(jetpack_gauge);

    renderer.render_end();
}

function resize({ displaySize: { width, height }}) {
    camera.getComponentOfType(Camera).aspect = width / height;
}


function checkGameOver() {
    const luna = player.getComponentOfType(Luna);
    if (luna.fallen) {
        document.getElementById('gameOverScreen').style.display = 'block';
        
        // Get the current score
        const currentScore = islandGenerator.getComponentOfType(IslandGenerator).getBestIsland();

        // Update highscore if necessary
        const highScore = Math.max(currentScore, getHighScore());
        setHighScore(highScore);

        // Display score and highscore
        document.getElementById('finalScore').textContent = 'Score: ' + currentScore;
        document.getElementById('highScore').textContent = 'Highscore: ' + highScore;
    }
}

function getHighScore() {
    return parseInt(localStorage.getItem('highScore') || '0', 10);
}

function setHighScore(score) {
    localStorage.setItem('highScore', score.toString());
}



new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();
