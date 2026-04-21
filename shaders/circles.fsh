precision highp float;
varying vec2 v_distFromCenter;
//uniform float u_CircleRadius;
void main() {
    float red = abs(v_distFromCenter.x * 100.01);
    float green = abs(v_distFromCenter.y * 100.01);
    float dist = length(v_distFromCenter);
    if(dist > 5.0) { // hack, in fragment shader the radius should not be scaled
        discard; // discard pixels outside the radius
    }
    vec4 color = vec4(1, 0, 0, 1);
    gl_FragColor = color;
    //gl_FragColor = vec4(red, green, 0, 1);
    //gl_FragColor = vec4(0,1,0,1);  // green
}
