import { Node, Transform, Model, Primitive } from '../engine/core.js';
import { quat, vec3 } from '../../../lib/gl-matrix-module.js';
import { Island } from './Island.js';
import { Luna } from './Luna.js';
import { LunaController } from './LunaController.js';
import { JetpackGenerator } from './JetpackGenerator.js';

import {
    calculateAxisAlignedBoundingBox,
    mergeAxisAlignedBoundingBoxes,
} from '../engine/core/MeshUtils.js';


export class IslandGenerator {

    constructor(node, player, jetpackGenerator, meshes, materials) {
        this.node = node;
        this.player = player;
        this.jetpackGenerator = jetpackGenerator;
        this.meshes = meshes;
        this.materials = materials;
        //this.score = 0;
        //this.progressPercentage = 0;
        this.lastIslandReached = 0;
        
        this.begin_generation();




    }

    begin_generation(){

        this.player.getComponentOfType(Luna).initialize();
        this.player.getComponentOfType(LunaController).initialize();

        this.node.children = [];
        this.jetpackGenerator.children = [];

        this.lastIslands = [];
        this.createIsland([0, -20, 0], 20, 0, 0, this.meshes[0], this.materials[1]);

    }

    update(time, dt) {

        const fuelPercentage = (this.fuel / 10) * 100; // Assuming the max fuel is 10
        document.getElementById('jetpackFuelBar').style.width = fuelPercentage + '%';

        this.node.children.forEach((island) => {

            let best_island = this.player.getComponentOfType(Luna).best_island;
            let this_island = island.getComponentOfType(Island).island_number

            let luna_height = this.player.getComponentOfType(Transform).translation[1];
            let island_height = island.getComponentOfType(Transform).translation[1];

            /*
            if (best_island > this.lastIslandReached) {
                this.lastIslandReached = this_island;
                console.log("Last island reached: " + String(this.lastIslandReached));
            }
            */

            if (this_island > best_island && luna_height > island_height){
                this.player.getComponentOfType(Luna).best_island = island.getComponentOfType(Island).island_number;
                console.log("Progress: " + String(this_island) + "/100");
                //document.getElementById('progressCounter').textContent = "Progress: " + String(this_island) + "/100";
                this.player.getComponentOfType(Luna).best_island = island.getComponentOfType(Island).island_number;
                let progressPercentage = (this_island / 100) * 100; 
                document.getElementById('progressBar').style.width = progressPercentage + '%';
            }
        });


        for (let i = this.lastIslands.length; i > -1;  i--){
            if (this.node.children.indexOf(this.lastIslands[i]) < 0){
                this.lastIslands.splice(i, 1);
            }
        }

        let player_position = this.player.getComponentOfType(Transform).translation;
        
        let deletion = [];
        for (let i = 0; i < this.node.children.length; i++){
            let island = this.node.children[i];
            let island_position = island.getComponentOfType(Island).initialY + island.getComponentOfType(Island).amplitude;

            let distance = player_position[1] - island_position;

            if (distance > 50){
                island.getComponentOfType(Island).falling = true;
            }

            if (distance > 200){
                deletion.push(i);
            }
        }

        deletion.reverse().forEach((i) => {
            this.node.children.splice(i, 1);
        });

        while (this.lastIslands.length > 0 && this.node.children.length < 30){
            let created = this.createNextIsland();
            if (!created){
                break;
            }
        }
    }

    createIsland(translation, scale, freqency=0, amplitude=0, mesh=this.meshes[0], material=this.materials[0], branch=-1, island_number=0){

        const island = new Node();

        let rotation = quat.create();
        quat.rotateY(rotation, rotation, Math.random() * 2 * Math.PI);

        island.addComponent(new Transform({ translation: translation, scale: [1.5 * scale, 1.5 * scale, 1.5 * scale], rotation: rotation}));


        let islandPrimitive = [new Primitive({ mesh: mesh, material: material })];

        island.addComponent(new Model({ primitives: islandPrimitive }));
        island.isStatic = true;
        island.isDynamic = false;

        island.addComponent(new Island(island, freqency, amplitude, island_number));
        island.aabb = {
            min: [-2 * scale, -1 * scale, -2 * scale],
            max: [ 2 * scale,  1 * scale,  2 * scale],
        };

        const model = island.getComponentOfType(Model);
        const boxes = model.primitives.map(primitive => calculateAxisAlignedBoundingBox(primitive.mesh));
        island.aabb = mergeAxisAlignedBoundingBoxes(boxes);
        
        this.node.addChild(island);

        if (branch == -1){
            this.lastIslands.push(island);
        }
        else{
            this.lastIslands[branch] = island;
        }
    }

    closestIsland(location, limit_to_plane=false){

        if (limit_to_plane){
            location = [location[0], 0, location[2]];
        }


        let distances = [];

        this.node.children.forEach((island) => {

            let island_pos = island.getComponentOfType(Transform).translation;
            if (limit_to_plane){
                island_pos = [island_pos[0], 0, island_pos[2]];
            }

            distances.push(vec3.distance(location, island_pos));

        });

        let best = Math.min(...distances);

        return best;
    }

    createNextIsland(){

        let selected_branch = -1;
        {
            let best_index = -1;
            let best_distance = -1;

            for (let i = 0; i < this.lastIslands.length; i++){
                let distance = vec3.distance(this.player.getComponentOfType(Transform).translation, this.lastIslands[i].getComponentOfType(Transform).translation);
                if (best_distance == -1 || distance < best_distance){
                    best_index = i;
                    best_distance = distance;
                }
            }

            selected_branch = best_index;
        }


        let chosen_last_island = this.lastIslands[selected_branch];

        let index = chosen_last_island.getComponentOfType(Island).island_number + 1;
        
        if (index > 100){
            return false;
        }        

        let location = chosen_last_island.getComponentOfType(Transform).translation;
        location[1] = chosen_last_island.getComponentOfType(Island).initialY + chosen_last_island.getComponentOfType(Island).amplitude;

        let bounding_distance = 40;

        let best_location = [0, 0, 0]
        let best_distance = -1;

        for (let i = 0; i < 500; i++){

            let x = location[0] + Math.random() * bounding_distance - bounding_distance/2;
            let y = 5 + location[1] + Math.random() * 10;
            let z = location[2] + Math.random() * bounding_distance - bounding_distance/2;
            let current_distance = this.closestIsland([x, y, z], true);

            if (current_distance > best_distance){
                best_distance = current_distance;
                best_location = [x, y, z]
            }

            if (best_distance > 20){
                break;
            }
        }
        let chosen_location = best_location;


        let f = 0;
        let a = 0;

        if (chosen_last_island.getComponentOfType(Island).amplitude == 0 && Math.random() > 0.5){
            f = 100;
            a = 100;
        }

        while (f * a > 100){
            f = 1 + Math.random();
            a = Math.random() * 100;
        }

        let material = this.materials[0];

        let size = 10;

        if (index % 100 == 0){
            size *= 3
            material = this.materials[1];
            f = 0;
            a = 0;

            this.jetpackGenerator.getComponentOfType(JetpackGenerator).createJetpack(chosen_location, 1000, 60, 1);
        }

        else if (index % 20 == 0){
            size *= 2;
            material = this.materials[1];
            f = 0;
            a = 0;

            this.jetpackGenerator.getComponentOfType(JetpackGenerator).createJetpack(chosen_location, 10, 30, 0);
        }

        if (this.lastIslands.length < 2 && Math.random() > 0.8){
                selected_branch = -1;
                //material = this.materials[2];
        }

        //if (index % 2 == 0){material = this.materials[3]; } // for testing purposes

        this.createIsland(chosen_location, size, f, a, this.meshes[0], material, selected_branch, index);

        return true;
    }

    getBestIsland() {
        return this.player.getComponentOfType(Luna).best_island;
    }





}