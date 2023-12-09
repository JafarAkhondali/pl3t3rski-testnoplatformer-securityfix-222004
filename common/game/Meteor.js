import {Transform} from '../engine/core.js';
import { Physics } from './Physics.js';
export class Meteor {

    constructor(node, targetIsland){
        this.node = node;
        this.speed = 0.1;
        this.acceleration = [-1, -10, -1];
        this.transform = this.node.getComponentOfType(Transform);
        this.node.aabb = {
            min: [-0.5, -0.5, -0.5],
            max: [0.5, 0.5, 0.5],
        };
        this.targetIslandPosition = targetIsland
        this.time = 0;
    }
    update(time, dt) {
        const fallingDuration = 10; // Increase the falling duration for a slower fall
        const meteorTranslation = this.node.getComponentOfType(Transform).translation;
    
        const interpolationSpeed = 0.1; // Change this value to adjust the speed of interpolation
        const interpolatedX = this.lerp(meteorTranslation[0], this.targetIslandPosition[0], interpolationSpeed * this.speed);
        const interpolatedY = this.lerp(meteorTranslation[1], this.targetIslandPosition[1], interpolationSpeed * this.speed);
        const interpolatedZ = this.lerp(meteorTranslation[2], this.targetIslandPosition[2], interpolationSpeed * this.speed);
     
        // Update the meteor's position
        meteorTranslation[0] = interpolatedX;
        meteorTranslation[1] = interpolatedY;
        meteorTranslation[2] = interpolatedZ;
        this.time += dt;
        // if(this.time > fallingDuration) {
        //     this.destroy();
        // }
    }
    
    lerp(start, end, t) {
        return start * (1 - t) + end * t;
    }
    
    destroy() {
        // TODO: play a collision sound
        this.node.parent.removeChild(this.node);
        console.log("meteor destroyed");
    }
}