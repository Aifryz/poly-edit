precision highp float;
varying vec2 v_pixPos; // pixel position in world space
//uniform float u_CircleRadius;
uniform mat3 u_WorldToCanvas;
void main() {
    const float grid_size = 80.0;
    vec2 dist_from_grid = mod(v_pixPos, grid_size);
    // this leads to too small pixels, need to correct for scaling
    //todo
    // also grid lines will be thick when zoomed in
    
    float scale = 1.0/sqrt(u_WorldToCanvas[0][0] * u_WorldToCanvas[0][0] + u_WorldToCanvas[1][0] * u_WorldToCanvas[1][0]); // assuming uniform scaling
    //float scale = 1.0;
    if(dist_from_grid.x > scale && dist_from_grid.y > scale) {
        //discard; // discard pixels far from grid lines
        //gl_FragColor = vec4(dist_from_grid.x/grid_size, dist_from_grid.y/grid_size, 0, 1);
        discard;
        }
    else{
        gl_FragColor = vec4(0, 0, 1, 1);
    }

    // each 10 pixels?
    //float dist_from_grid_x = (mod(v_pixPos.x, 100.0)/100.0);
    //float dist_from_grid_y = (mod(v_pixPos.y, 100.0)/100.0);
    // offset by 0.5 to center the grid lines
    //dist_from_grid_x = abs(dist_from_grid_x + 0.5);
    //dist_from_grid_y = abs(dist_from_grid_y + 0.5);

    //float red = abs(dist_from_grid_x);
    //float green = abs(dist_from_grid_y);
    
    
    //gl_FragColor = color;
    //gl_FragColor = vec4(0, 0, 1, 1);
    //gl_FragColor = vec4(0,1,0,1);  // green
}
