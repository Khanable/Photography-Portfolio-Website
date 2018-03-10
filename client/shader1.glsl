//https://thebookofshaders.com/11/
float random(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453123);
}
// 2D Noise based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Smooth Interpolation

    // Cubic Hermine Curve.  Same as SmoothStep()
    vec2 u = f*f*(3.0-2.0*f);
    // u = smoothstep(0.,1.,f);

    // Mix 4 coorners porcentages
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

void main() {
	vec2 st = texCoord.xy*aspect;
	vec2 pos = vec2(st*10.0);
	float n = noise(pos);

	float centreDistance = distance(vec2(0.5, 0.5), texCoord);
	float invertedDistance = pow(1.0-centreDistance, fallOffFactor);
//-n/100.0
	//Inverse Square law
	float intensity = strength / 4.0*3.14159265359*pow(invertedDistance, 2.0);
	vec3 resultantColor = lightColor*intensity;
	//gl_FragColor = vec4(resultantColor, 1);
	gl_FragColor = vec4(vec3(n), 1);
}
