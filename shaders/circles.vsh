attribute vec2 a_position;
attribute vec2 a_center; 

// Canvas to clip space transform
uniform mat3 u_CanvasToClip;
uniform mat3 u_WorldToCanvas;

uniform float u_CircleRadius;

varying vec2 v_distFromCenter;

void main() {
    vec2 offset = a_position - a_center;
    // Scale to circle radius in pixels
    offset = offset * u_CircleRadius;

    vec2 pp_raw = a_center + offset;

    vec2 pix_pos = vec4(u_WorldToCanvas * vec3(pp_raw, 1.0), 1.0).xy;
    vec2 center = vec4(u_WorldToCanvas * vec3(a_center, 1.0), 1.0).xy;

    v_distFromCenter = (pix_pos - center).xy;

    // to clip space
    pix_pos = vec4(u_CanvasToClip * vec3(pix_pos, 1.0), 1.0).xy;
    gl_Position = vec4(pix_pos, 0.0, 1.0);
}
