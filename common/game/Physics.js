import {Node, Transform} from '../engine/core.js';
import { quat, vec3, mat4 } from '../../../lib/gl-matrix-module.js';



export class Physics {

    constructor(node){
        this.node = node;
        this.velocity = [0, 0, 0];
        this.acceleration = [0, -100, 0];
        this.collided = [];
        this.grounded = false;
    }

    update(time, dt){

        const transform = this.node.getComponentOfType(Transform);

        // Collision
        this.grounded = false;
        if (this.collided.length != 0){
            for (let i = 0; i < this.collided.length; i++){

                let collided_transform = this.collided[i].getComponentOfType(Transform)

                // Collision bellow
                if (collided_transform.translation[1] < transform.translation[1]){

                    if (this.velocity[1] < 0){
                        this.velocity[1] = 0;
                    }

                    this.grounded = true;
                }

                // Collision above
                if (collided_transform.translation[1] > transform.translation[1]){

                    if (this.velocity[1] > 0){
                        this.velocity[1] = 0;
                    }
                }

            }
        }

        // Applying velocity
        
        //if (Math.abs(this.velocity[0]) < 10){this.velocity[0] = 0;}
        //this.acceleration[0] = -this.velocity[0]*1.5;
        //
        //if (Math.abs(this.velocity[2]) < 10){this.velocity[2] = 0;}
        //this.acceleration[2] = -this.velocity[2]*1.5;

        if (vec3.distance(Math.abs(this.velocity[0]), 0,  Math.abs(this.velocity[2])) < 10){this.velocity[0] = 0; this.velocity[2] = 0;}
        this.acceleration[0] = -this.velocity[0]*10.5;
        this.acceleration[2] = -this.velocity[2]*10.5;


        let dt_acceleration = [0, 0, 0];
        vec3.scale(dt_acceleration, this.acceleration, dt);
        vec3.add(this.velocity, this.velocity, dt_acceleration);
        
        let translation = transform.translation;
        



        let dt_velocity = [0, 0, 0];
        vec3.scale(dt_velocity, this.velocity, dt);
        vec3.add(transform.translation, translation, dt_velocity);

        
        //const rotation = quat.create();
        //quat.rotateY(rotation, rotation, time);
        //quat.rotateX(rotation, rotation, time);
        //transform.rotation = rotation;

    }
}