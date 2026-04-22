attribute vec2 a_position;

// Canvas to clip space transform
uniform mat3 u_CanvasToClip;
uniform mat3 u_WorldToCanvas;

varying vec2 v_pixPos;

void main() {
    vec2 pp_raw = a_position;
    vec2 pix_pos = vec4(u_WorldToCanvas * vec3(pp_raw, 1.0), 1.0).xy;
    
    // to clip space
    pix_pos = vec4(u_CanvasToClip * vec3(pix_pos, 1.0), 1.0).xy;
    v_pixPos = pp_raw;

    // adjust scaling
    vec2 pos_in_canvas = vec4(u_CanvasToClip * vec3(pp_raw, 1.0), 1.0).xy;
    //v_pixPos = pos_in_canvas/10.0;
    
    gl_Position = vec4(pix_pos, 0.0, 1.0);
}
