import { Matrix3D } from './math.js';

function makeVertexShader(gl) {
    // Extract the content of the script element
    const shaderSource = `
        attribute vec2 a_position;
        attribute vec2 a_center; 

        // Canvas to clip space transform
        uniform mat3 u_CanvasToClip;
        uniform mat3 u_WorldToCanvas;

        varying vec2 v_distFromCenter;

        void main() {
            vec2 pix_pos = vec4(u_WorldToCanvas * vec3(a_position, 1.0), 1.0).xy;
            vec2 center = vec4(u_WorldToCanvas * vec3(a_center, 1.0), 1.0).xy;

            v_distFromCenter = (pix_pos - center).xy;

            // to clip space
            pix_pos = vec4(u_CanvasToClip * vec3(pix_pos, 1.0), 1.0).xy;
            gl_Position = vec4(pix_pos, 0.0, 1.0);
        }`

    // Create a shader object
    const shader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);

    // Check if the shader compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Error compiling the shader: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function makeFragmentShader(gl) {
    // Extract the content of the script element
        const shaderSource = `
        precision highp float;
        varying vec2 v_distFromCenter;
        void main() {
            float red = abs(v_distFromCenter.x * 100.01);
            float green = abs(v_distFromCenter.y * 100.01);
            float dist = length(v_distFromCenter);
            if(dist > 5.0) {
                discard; // discard pixels outside the radius
            }
            vec4 color = vec4(1, 0, 0, 1);
            gl_FragColor = color;
            //gl_FragColor = vec4(red, green, 0, 1);
            //gl_FragColor = vec4(0,1,0,1);  // green
        }`


    // Create a shader object
    const shader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);

    // Check if the shader compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Error compiling the shader: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}


class Polygon {
    // for now - just list of verts so we can test the shader
    // list of verts
    // color
    constructor() {
        this.verts = [];
        this.buffer = null;
    }

    addPoint(x, y) {
        this.verts.push({x:x, y:y});
    }

    prepareBuffer(gl) {
        if(this.buffer == null) {
            this.buffer = gl.createBuffer();
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        const vertArray = [];
        //const span = 0.05;
        const span = 20;
        for (const vert of this.verts) {

            vertArray.push(vert.x - span / 2, vert.y - span / 2);
            // also push center, so 4 floats per vert
            vertArray.push(vert.x, vert.y); // center
            vertArray.push(vert.x + span / 2, vert.y - span / 2);
            vertArray.push(vert.x, vert.y); // center
            vertArray.push(vert.x + span / 2, vert.y + span / 2);
            vertArray.push(vert.x, vert.y); // center

            vertArray.push(vert.x - span / 2, vert.y - span / 2);
            vertArray.push(vert.x, vert.y); // center
            vertArray.push(vert.x + span / 2, vert.y + span / 2);
            vertArray.push(vert.x, vert.y); // center
            vertArray.push(vert.x - span / 2, vert.y + span / 2);
            vertArray.push(vert.x, vert.y); // center
            
        }
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertArray), gl.STATIC_DRAW);

        this.elemCount = this.verts.length * 6; // 6 verts per quad
    }

    prepareProgram(gl) {
        // setup a GLSL program
        var vertexShader = makeVertexShader(gl);
        var fragmentShader = makeFragmentShader(gl);
        //var program = createProgram(gl, [vertexShader, fragmentShader]);
        var program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program);
            throw new Error(`Could not compile WebGL program. \n\n${info}`);
        }
        gl.useProgram(program);

        // look up where the vertex data needs to go.
        var positionLocation = gl.getAttribLocation(program, "a_position");
        var centerLocation = gl.getAttribLocation(program, "a_center");
        var worldToCanvasLocation = gl.getUniformLocation(program, "u_WorldToCanvas");
        var canvasToClipLocation = gl.getUniformLocation(program, "u_CanvasToClip");


        this.programParams = {
            positionLocation: positionLocation,
            centerLocation: centerLocation,
            worldToCanvasLocation: worldToCanvasLocation,
            canvasToClipLocation: canvasToClipLocation,
            program: program
        }
    }

    draw(gl, transform) {
        // draw
        gl.enableVertexAttribArray(this.programParams.positionLocation);
        gl.vertexAttribPointer(this.programParams.positionLocation, 2, gl.FLOAT, false, 4*4, 0);

        // setup center location
        gl.enableVertexAttribArray(this.programParams.centerLocation);
        gl.vertexAttribPointer(this.programParams.centerLocation, 2, gl.FLOAT, false, 4*4, 2*4);

        // Scale down to clip space (-1 to 1 range)
        // just scale is needed to convert here
        const scale = Matrix3D.scale(1/640*2, 1/480*2);
        const canvasToClip = scale.toWebGLUniform();
        gl.uniformMatrix3fv(this.programParams.canvasToClipLocation, false, canvasToClip);

        const worldToCanvas = transform.toWebGLUniform();
        gl.uniformMatrix3fv(this.programParams.worldToCanvasLocation, false, worldToCanvas);


        // draw
        gl.drawArrays(gl.TRIANGLES, 0, this.elemCount);
    }
}

export class Scene {
    constructor(canvas) {
        this.canvas = canvas;
        
        // Initialize the GL context 
        let gl = canvas.getContext("webgl");

        // Only continue if WebGL is available and working
        if (gl === null) {
            alert(
                "Unable to initialize WebGL. Your browser or machine may not support it.",
            );
            return;
        }

        // Set clear color to black, fully opaque
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        // Clear the color buffer with specified clear color
        gl.clear(gl.COLOR_BUFFER_BIT);

        this.gl = gl;
        this.poly = new Polygon();

        this.scale = 1;
        this.position = {x: 0, y: 0}; // world position of the center of the canvas

        // Ok, draw some stuff
        //let poly = new Polygon();
        this.poly.addPoint(-100, -100);
        this.poly.addPoint(100, -100);
        this.poly.addPoint(0, 100);
        this.poly.addPoint(100, 100);

        this.poly.prepareProgram(gl);
        this.poly.prepareBuffer(gl);
        this.render();
        
        let isDragging = false;
        let moved = false;
        let lastMousePos = {x: 0, y: 0};

        canvas.addEventListener('click', (e) => {
            if (moved) {
                return; // ignore click events during dragging
            }
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            console.log(`Clicked at: ${x}, ${y}`);

            const worldPos = this.canvasToWorldCoords(x, y);

            console.log(`World at: ${worldPos.x}, ${worldPos.y}`);

            this.poly.addPoint(worldPos.x, worldPos.y);
            this.poly.prepareBuffer(gl);
            this.render();
        });

        canvas.addEventListener('wheel', (e) => {
            console.log('scroll');
            const ratio = 1.1;
            if(e.deltaY < 0) {
                this.scale *= ratio;
            } else {
                this.scale /= ratio;
            }
            this.render();
        });

        // Handle mouse drag for panning

        canvas.addEventListener('mousedown', (e) => {
            moved = false;
            isDragging = true;
            lastMousePos = {x: e.clientX, y: e.clientY};
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (isDragging) {
                moved = true;
                const dx = e.clientX - lastMousePos.x;
                const dy = e.clientY - lastMousePos.y;
                // Update the worldToCanvas transform based on dx, dy
                // For simplicity, we can just adjust the translation components of the transform
                // In a full implementation, you'd want to maintain a proper transform matrix
                // Here we just log the drag for demonstration
                //console.log(`Dragging: ${dx}, ${dy}`);
                this.position.x += dx;
                this.position.y -= dy;
                console.log(`Position: ${this.position.x}, ${this.position.y}`);
                this.render();
                lastMousePos = {x: e.clientX, y: e.clientY};
            }
        });
        canvas.addEventListener('mouseup', (e) => {
            isDragging = false;
        });

    }

    // Transform from canvas pixel coordinates to world coordinates
    canvasToWorldCoords(x, y) {
        const yw = -y + this.canvas.height / 2;
        const xw = x - this.canvas.width / 2;

        return {x: xw, y: yw};
    }

    update() {
        
    }

    render() {
        // Set clear color to black, fully opaque
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        // Clear the color buffer with specified clear color
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // Prepare transform matrix
        let transform = Matrix3D.scale(this.scale, this.scale);
        transform = Matrix3D.translate(this.position.x, this.position.y).multiply(transform);
        this.poly.draw(this.gl, transform);
    }


}