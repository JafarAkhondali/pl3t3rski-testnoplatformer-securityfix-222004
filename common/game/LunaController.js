import { quat, vec3, vec4, mat4 } from '../../lib/gl-matrix-module.js';

import { Transform } from '../engine/core/Transform.js';

import { Physics } from './Physics.js';
import { Luna } from './Luna.js';
import { IslandGenerator } from './IslandGenerator.js';

export class LunaController {

    constructor(player, camera, islandGenerator, domElement, {
        pitch = 0,
        yaw = 0,

        pointerSensitivity = 0.002,
        firstPerson = false,

        camera_distance = 40,
    } = {}) {
        this.camera = camera;
        this.player = player;
        this.islandGenerator = islandGenerator;
        this.domElement = domElement;

        this.keys = {};

        this.pitch = pitch;
        this.yaw = yaw;
        this.pointerSensitivity = pointerSensitivity;
        this.firstPerson = firstPerson;

        this.camera_distance = camera_distance;

        this.initHandlers();

        this.prevspace = false;

        this.initialize();
    }

    initialize(){
        this.doublejump = false;
        this.dash = false;

        this.luna_rotation = [0, 0, 1];
        this.fuel = 10;
    }

    initHandlers() {
        this.pointermoveHandler = this.pointermoveHandler.bind(this);
        this.keydownHandler = this.keydownHandler.bind(this);
        this.keyupHandler = this.keyupHandler.bind(this);

        this.mouseWheelHandler = this.mouseWheelHandler.bind(this);

        const element = this.domElement;
        const doc = element.ownerDocument;

        doc.addEventListener('keydown', this.keydownHandler);
        doc.addEventListener('keyup', this.keyupHandler);

        doc.addEventListener('mousewheel', this.mouseWheelHandler);

        element.addEventListener('click', e => element.requestPointerLock());
        doc.addEventListener('pointerlockchange', e => {
            if (doc.pointerLockElement === element) {
                doc.addEventListener('pointermove', this.pointermoveHandler);
            } else {
                doc.removeEventListener('pointermove', this.pointermoveHandler);
            }
        });
    }

    update(t, dt) {

        const luna = this.player.getComponentOfType(Luna);


        if (this.keys['KeyN']){
            this.islandGenerator.getComponentOfType(IslandGenerator).begin_generation();
        }

        const fuelPercentage = (this.fuel / 100) * 100; // Max fuel is 100
        document.getElementById('jetpackFuelBar').style.width = fuelPercentage + '%';

        // Calculate forward and right vectors.

        let Fx = -Math.sin(this.yaw) * Math.cos(this.pitch)
        let Fy = Math.sin(this.pitch)
        let Fz = -Math.cos(this.yaw) * Math.cos(this.pitch)

        let forward = [Fx, Fy, Fz];
        forward = vec3.normalize(forward, forward);

        if (!this.firstPerson){
            forward = [-forward[0], -forward[1], -forward[2]]; 
        }

        let right = vec3.cross([0, 0, 0], forward, [0, 1, 0]);
        right = vec3.normalize(right, right);

        // Map user input to the acceleration vector.


        const player_transform = this.player.getComponentOfType(Transform);
        const camera_transform = this.camera.getComponentOfType(Transform);

        
        if (luna.winning || this.keys['ShiftLeft'] && this.fuel > 0){
            
            this.fuel -= 2 * dt;

            //console.log(this.fuel);

            let rotation = this.player.getComponentOfType(Transform).rotation;

            let up = [0, 1, 0];
            vec3.transformQuat(up, up, rotation);

            if (this.keys['KeyW']){
                quat.rotateX(rotation, rotation, .01);
                player_transform.rotation = rotation;
            }

            if (this.keys['KeyS']){
                quat.rotateX(rotation, rotation, -.01);
                player_transform.rotation = rotation;
            }

            if (this.keys['KeyA']){
                quat.rotateY(rotation, rotation, .01);
                player_transform.rotation = rotation;
            }

            if (this.keys['KeyD']){
                quat.rotateY(rotation, rotation, -.01);
                player_transform.rotation = rotation;
            }

            if (this.keys['KeyQ']){
                quat.rotateZ(rotation, rotation, -.01);
                player_transform.rotation = rotation;
            }

            if (this.keys['KeyE']){
                quat.rotateZ(rotation, rotation, .01);
                player_transform.rotation = rotation;
            }


            let luna_velocity = this.player.getComponentOfType(Physics).velocity;
            vec3.add(luna_velocity, [0, 0, 0], vec3.scale(up, up, 40));

        }
        else{
            
            const acc = vec3.create();
            if (this.keys['KeyW']) {
                vec3.add(acc, acc, forward);
            }
            if (this.keys['KeyS']) {
                vec3.sub(acc, acc, forward);
            }
            if (this.keys['KeyD']) {
                vec3.add(acc, acc, right);
            }
            if (this.keys['KeyA']) {
                vec3.sub(acc, acc, right);
            }

            let physics = this.player.getComponentOfType(Physics);

            if (physics.grounded){
                this.doublejump = false;
                this.dash = false;
            }

            if (this.keys['Space']) {

                if(physics.grounded){
                    physics.grounded = false;
                    physics.velocity[1] = 50;

                    this.doublejump = true;
                    this.dash = true;
                }
                else if(this.doublejump && !this.prevspace){
                    physics.velocity[1] = 50;
                    this.doublejump = false;
                }
                this.prevspace = true;
            }
            else{
                this.prevspace = false;
            }

            if (this.keys['KeyF']){
                
                if(!physics.grounded && this.dash){
                    physics.velocity[0] = this.luna_rotation[0] * 100;
                    physics.velocity[2] = this.luna_rotation[2] * 100;
                    this.dash = false;
                }
            }

            if (vec3.length(acc) > 0.1){
                let limited_velocity = [acc[0], 0, acc[2]];
                vec3.normalize(limited_velocity, limited_velocity);
                vec3.scale(limited_velocity, limited_velocity, -20);
                let luna_velocity = this.player.getComponentOfType(Physics).velocity;
                if (Math.abs(luna_velocity[0]) < Math.abs(limited_velocity[0])){luna_velocity[0] = limited_velocity[0];}
                if (Math.abs(luna_velocity[2]) < Math.abs(limited_velocity[2])){luna_velocity[2] = limited_velocity[2];}
                let rotation = quat.create();
                quat.rotateY(rotation, rotation, this.yaw + Math.PI);
                player_transform.rotation = rotation;
                vec3.normalize(this.luna_rotation, [Math.sin(this.yaw + Math.PI), 0, Math.cos(this.yaw + Math.PI)])
            }
        }
        
        forward = vec3.scale(forward, forward, this.camera_distance)
        
        if (luna.fallen || luna.winning){
            vec3.add(camera_transform.translation, luna.fallen_location, forward);
        }
        else{
            vec3.add(camera_transform.translation, player_transform.translation, forward);
        }

        let rotation = quat.create();
        quat.rotateY(rotation, rotation, this.yaw);
        quat.rotateX(rotation, rotation, this.pitch);
        camera_transform.rotation = rotation;
    
    }

    pointermoveHandler(e) {
        let dx = e.movementX;
        let dy = e.movementY;
        if (!this.firstPerson){
            //dx = -dx;
            dy = -dy;
        }

        this.pitch -= dy * this.pointerSensitivity;
        this.yaw   -= dx * this.pointerSensitivity;

        const twopi = Math.PI * 2;
        const halfpi = Math.PI / 2;

        this.pitch = Math.min(Math.max(this.pitch, -halfpi), halfpi);
        this.yaw = ((this.yaw % twopi) + twopi) % twopi;
    }

    keydownHandler(e) {
        this.keys[e.code] = true;
    }

    keyupHandler(e) {
        this.keys[e.code] = false;
    }

    mouseWheelHandler(e){
        let a = e.deltaY;
        a = a / Math.abs(a);

        this.camera_distance += a*10;
        if (this.camera_distance < 10){
            this.camera_distance = 10;
        }
        if (this.camera_distance > 100){
            this.camera_distance = 100;
        }


    }
}
