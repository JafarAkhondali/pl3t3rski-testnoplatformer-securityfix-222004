import { Node, Transform } from '../engine/core.js';
import { vec3 } from '../../../lib/gl-matrix-module.js';

export class Island {

    constructor(node, frequency, amplitude, island_number) {
        this.node = node;

        this.amplitude = amplitude; // Adjust the amplitude of the floating motion
        this.frequency = frequency; // Adjust the frequency of the floating motion
        
        this.timeOffset = Math.random() * 500; // Randomize the starting time for variety
        this.transform = this.node.getComponentOfType(Transform);
        
        this.initialY = this.transform.translation[1];
        
        this.isLunaOn = false;
        this.falling = false;

        this.velocity = [0, 0, 0];

        this.island_number = island_number;
    }

    update(time, dt) {
        
        if (!this.falling){
            // Use a sine function to create a floating motion

            let elevator = Math.sin(this.frequency * (time + this.timeOffset))
            elevator = (1 + elevator) / 2 ;
            const yOffset = this.amplitude * elevator + this.initialY;

            // Set the translation of the island based on the floating motion
            this.transform.translation = [this.transform.translation[0], yOffset, this.transform.translation[2]];
        }

        else {

            let dt_acceleration = [0, 0, 0];
            vec3.scale(dt_acceleration, [0, -100, 0], dt);
            vec3.add(this.velocity, this.velocity, dt_acceleration);

            let translation = this.transform.translation;

            let dt_velocity = [0, 0, 0];
            vec3.scale(dt_velocity, this.velocity, dt);
            vec3.add(this.transform.translation, translation, dt_velocity);
        }
    }

    destroy() {
        this.node.parent.removeChild(this.node);
        console.log("Island destroyed");
    }
}
