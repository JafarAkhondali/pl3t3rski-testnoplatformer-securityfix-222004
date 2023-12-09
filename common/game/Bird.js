import { Transform } from '../engine/core.js';
import { quat } from '../../lib/gl-matrix-module.js';

export class Bird {

    constructor(node, player){
        this.node = node;
        this.speed = 1;
        this.acceleration = [0, -100, 0];
        this.rotationSpeed = 1.0;
        this.circleRadius = 5.0;
        this.timePassed = 0;
        this.heightChangeInterval = 10.0;
        this.player = player;
        this.xOffset = 0;
    }

    update(time, dt){
        const transform = this.node.getComponentOfType(Transform);
        this.currentHeight = this.player.getComponentOfType(Transform).translation[1] + 10;

        // Parameters for the sinusoidal motion
        const amplitude = 30;
        const frequency = 0.5;

        // Update the bird's position with a sinusoidal pattern
        const offsetX = amplitude * Math.sin(frequency * time);
        const offsetY = this.currentHeight + amplitude * Math.cos(frequency * time);
        const offsetZ = -amplitude * Math.sin(frequency * time);
        transform.translation = [offsetX, offsetY, offsetZ];

        // Calculate rotation based on the movement direction
        const rotationAngle = Math.atan2(offsetX, offsetZ);

        // Apply smooth rotation
        const targetRotation = quat.fromEuler(quat.create(), 0, -rotationAngle * (180 / Math.PI), 0);
        quat.slerp(transform.rotation, transform.rotation, targetRotation, this.rotationSpeed * dt);

        // Change the bird's height every specified interval
        this.timePassed += dt;
        if (this.timePassed >= this.heightChangeInterval) {
            this.currentHeight = this.currentHeight + this.circleRadius;
            this.timePassed = 0;
        }
    }
}