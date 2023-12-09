struct VertexInput {
    @location(0) position : vec3f,
    @location(1) texcoords : vec2f,
    @location(2) normal : vec3f,
}

struct VertexOutput {
    @builtin(position) clipPosition : vec4f,
    @location(0) position : vec3f,
    @location(1) texcoords : vec2f,
    @location(2) normal : vec3f,
}

struct FragmentInput {
    @location(0) position : vec3f,
    @location(1) texcoords : vec2f,
    @location(2) normal : vec3f,
}

struct FragmentOutput {
    @location(0) color : vec4f,
}

struct CameraUniforms {
    viewMatrix : mat4x4f,
    projectionMatrix : mat4x4f,
    position : vec3f,
    //time : f32,
}

struct LightUniforms {
    color : vec3f,
    direction : vec3f,
    attenuation : vec3f,
}

struct SceneLights {
    light_count : i32,
    lights : array<LightUniforms, 2>,
}


struct ModelUniforms {
    modelMatrix : mat4x4f,
    normalMatrix : mat3x3f,
}

struct MaterialUniforms {
    baseFactor : vec4f,
    diffuse : f32,
    specular : f32,
    shininess : f32,
}

@group(0) @binding(0) var<uniform> camera : CameraUniforms;
@group(1) @binding(0) var<uniform> model : ModelUniforms;
@group(2) @binding(0) var<uniform> material : MaterialUniforms;
@group(2) @binding(1) var uTexture : texture_2d<f32>;
@group(2) @binding(2) var uSampler : sampler;
@group(3) @binding(0) var<uniform> lights : SceneLights;

@vertex
fn vertex(input : VertexInput) -> VertexOutput {
    var output : VertexOutput;
    output.clipPosition = camera.projectionMatrix * camera.viewMatrix * model.modelMatrix * vec4(input.position, 1);
    output.position = (model.modelMatrix * vec4(input.position, 1)).xyz;
    output.texcoords = input.texcoords;
    output.normal = model.normalMatrix * input.normal;
    return output;
}

@fragment
fn fragment(input : FragmentInput) -> FragmentOutput {
    var output : FragmentOutput;

    var finalColor : vec3f = vec3f(0);

        // LIGHTS
    for (var i: i32 = 0; i < 3; i++){

        let light = lights.lights[i];

        let surfacePosition = input.position;

        var attenuation = 0.;
        var L : vec3f = vec3f(0);

        if (light.attenuation.x == 0 && light.attenuation.y == 0 && light.attenuation.z == 0){
            L = normalize(-light.direction);
            attenuation = 1;
        }
        else{
            L = normalize(light.direction - surfacePosition);
            let d = distance(surfacePosition, light.direction);
            attenuation = 1 / dot(light.attenuation, vec3(1, d, d * d));
        }

        let N = normalize(input.normal);
        let V = normalize(camera.position - surfacePosition);
        let R = normalize(reflect(-L, N));

        let lambert = max(dot(N, L), 0) * material.diffuse;
        let phong = pow(max(dot(V, R), 0), material.shininess) * material.specular;

        let diffuseLight = lambert * attenuation * light.color;
        let specularLight = phong * attenuation * light.color;

        finalColor += diffuseLight + specularLight;
    }

    finalColor += vec3f(0.02, 0.02, 0.02);

    const gamma = 2.2;
    let albedo = pow(textureSample(uTexture, uSampler, input.texcoords).rgb, vec3(gamma));

    finalColor *= albedo;

    output.color = pow(vec4(finalColor, 1), vec4(1 / gamma));

    return output;
}
