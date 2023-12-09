export class Vertex {

    constructor({
        position = [0, 0, 0],
        position2f = [0, 0],
        texcoords = [0, 0],
        normal = [0, 0, 0],
        tangent = [0, 0, 0],
        color = [0, 0, 0, 0],
    } = {}) {
        this.position = position;
        this.position2f = position2f;
        this.texcoords = texcoords;
        this.normal = normal;
        this.tangent = tangent;
        this.color = color;
    }

}
