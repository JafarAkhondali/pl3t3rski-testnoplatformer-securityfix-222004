import {Node, Transform} from '../engine/core.js';
import { quat, vec3, mat4 } from '../../../lib/gl-matrix-module.js';
import { LunaController } from './LunaController.js';



export class Luna {

    constructor(node){
        this.node = node;
        this.initialize();
    }

    initialize(){
        this.node.getComponentOfType(Transform).translation = [0, 0, 0];
        
        this.best_height = 0;
        this.best_island = 0;
        this.fallen = false;
        this.fallen_location = [0, 0, 0];

        this.takeoff = 0;
        this.winning = false;
    }

    update(time, dt){
    
        const transform = this.node.getComponentOfType(Transform);

        if (this.winning) {
            document.getElementById('endScreen').style.display = 'block';
        }

        
        if (!this.fallen && this.best_height - transform.translation[1] > 100){
            this.fallen = true;
        }

        if (transform.translation[1] > this.best_height){
            this.best_height = transform.translation[1];
        }

        if (!this.fallen && !this.winning){
            vec3.add(this.fallen_location, [0, 0, 0], transform.translation);

        }


        if (this.takeoff == 0 && this.best_island >= 100){
            this.takeoff = transform.translation[1];
        }

        if (this.takeoff != 0 && transform.translation[1] - this.takeoff > 100){
            this.winning = true;
        }

    }
}