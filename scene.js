import { Matrix3D } from './math.js';

async function loadShaderSource(path) {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Failed to load shader: ${path}`);
    }
    return await response.text();
}

async function makeVertexShader(gl, path) {
    const shaderSource = await loadShaderSource(path);

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

async function makeFragmentShader(gl, path) {
    const shaderSource = await loadShaderSource(path);

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
        this.circleRadius = 5;
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
        // Hack, just normalized offsets which will be adjusted in the shader
        const span = 2;
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

    async prepareProgram(gl) {
        // setup a GLSL program
        var vertexShader = await makeVertexShader(gl, './shaders/circles.vsh');
        var fragmentShader = await makeFragmentShader(gl, './shaders/circles.fsh');
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
        var circleRadiusLocation = gl.getUniformLocation(program, "u_CircleRadius");


        this.programParams = {
            positionLocation: positionLocation,
            centerLocation: centerLocation,
            worldToCanvasLocation: worldToCanvasLocation,
            canvasToClipLocation: canvasToClipLocation,
            circleRadiusLocation: circleRadiusLocation,
            program: program
        }
    }

    draw(gl, transform) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.useProgram(this.programParams.program);
        // draw
        gl.enableVertexAttribArray(this.programParams.positionLocation);
        gl.vertexAttribPointer(this.programParams.positionLocation, 2, gl.FLOAT, false, 4*4, 0);

        // setup center location
        gl.enableVertexAttribArray(this.programParams.centerLocation);
        gl.vertexAttribPointer(this.programParams.centerLocation, 2, gl.FLOAT, false, 4*4, 2*4);

        // Scale down to clip space (-1 to 1 range)
        // just scale is needed to convert here
        
        const scale = Matrix3D.scale(1/gl.canvas.clientWidth*2, 1/gl.canvas.clientHeight*2);
        const canvasToClip = scale.toWebGLUniform();
        gl.uniformMatrix3fv(this.programParams.canvasToClipLocation, false, canvasToClip);

        const worldToCanvas = transform.toWebGLUniform();
        gl.uniformMatrix3fv(this.programParams.worldToCanvasLocation, false, worldToCanvas);

        const transformScale = Math.sqrt(transform.data[0] * transform.data[0] + transform.data[1] * transform.data[1]);
        gl.uniform1f(this.programParams.circleRadiusLocation, this.circleRadius/transformScale);


        // draw
        gl.drawArrays(gl.TRIANGLES, 0, this.elemCount);
    }
}

class Grid {
    async prepareProgram(gl) {
        // setup a GLSL program
        var vertexShader = await makeVertexShader(gl, './shaders/grid.vsh');
        var fragmentShader = await makeFragmentShader(gl, './shaders/grid.fsh');
        
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
        //var centerLocation = gl.getAttribLocation(program, "a_center");
        var worldToCanvasLocation = gl.getUniformLocation(program, "u_WorldToCanvas");
        var canvasToClipLocation = gl.getUniformLocation(program, "u_CanvasToClip");
        //var circleRadiusLocation = gl.getUniformLocation(program, "u_CircleRadius");


        this.programParams = {
            positionLocation: positionLocation,
          //  centerLocation: centerLocation,
            worldToCanvasLocation: worldToCanvasLocation,
            canvasToClipLocation: canvasToClipLocation,
           // circleRadiusLocation: circleRadiusLocation,
            program: program
        }
    }

    prepareBuffer(gl) {
        if(this.buffer == null) {
            this.buffer = gl.createBuffer();
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        const vertArray = [];
        // hack for now, just do 1000x1000 square
        vertArray.push(-500, -500);
        vertArray.push(500, -500);
        vertArray.push(500, 500);

        vertArray.push(-500, -500);
        vertArray.push(500, 500);
        vertArray.push(-500, 500);

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertArray), gl.STATIC_DRAW);

        this.elemCount = 2*3; // Just 2 triangles
    }

    draw(gl, transform) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.useProgram(this.programParams.program);
        // draw
        gl.enableVertexAttribArray(this.programParams.positionLocation);
        gl.vertexAttribPointer(this.programParams.positionLocation, 2, gl.FLOAT, false, 0, 0);

        // setup center location
        //gl.enableVertexAttribArray(this.programParams.centerLocation);
        //gl.vertexAttribPointer(this.programParams.centerLocation, 2, gl.FLOAT, false, 4*4, 2*4);

        // Scale down to clip space (-1 to 1 range)
        // just scale is needed to convert here
        const scale = Matrix3D.scale(1/gl.canvas.clientWidth*2, 1/gl.canvas.clientHeight*2);
        const canvasToClip = scale.toWebGLUniform();
        gl.uniformMatrix3fv(this.programParams.canvasToClipLocation, false, canvasToClip);

        const worldToCanvas = transform.toWebGLUniform();
        gl.uniformMatrix3fv(this.programParams.worldToCanvasLocation, false, worldToCanvas);

        //const transformScale = Math.sqrt(transform.data[0] * transform.data[0] + transform.data[1] * transform.data[1]);
        //gl.uniform1f(this.programParams.circleRadiusLocation, this.circleRadius/transformScale);


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

        // Initialize shaders asynchronously

        this.grid = new Grid();

        Promise.all([
            this.poly.prepareProgram(gl),
            this.grid.prepareProgram(gl)
        ]).then(() => {
            this.poly.prepareBuffer(gl);
            this.grid.prepareBuffer(gl);
            this.render();
        }).catch(err => {
            console.error('Failed to initialize shaders:', err);
        });

        /*
        this.grid.prepareProgram(gl).then(() => {
            this.grid.prepareBuffer(gl);
            // just re/render scene i guess?
            this.render();
        }).catch(err => {
            console.error('Failed to initialize grid shaders:', err);
        });
        */

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
                //console.log(`Position: ${this.position.x}, ${this.position.y}`);
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
        const yw = -y + this.canvas.clientHeight / 2;
        const xw = x - this.canvas.clientWidth / 2;

        //console.log(this.canvas.clientWidth, this.canvas.clientHeight);

        // yw, xw are now in corrected canvas coords with origin at center and y flipped
        // now apply inverse of worldToCanvas transform to get world coords
        const invScale = 1 / this.scale;
        //const wx = xw * invScale - this.position.x;
        //const wy = yw * invScale - this.position.y;
        const wx = xw * invScale - this.position.x * invScale;
        const wy = yw * invScale - this.position.y * invScale;

        return {x: wx, y: wy};
    }

    update() {
        
    }

    resizeCanvasToDisplaySize(canvas) {
        // Lookup the size the browser is displaying the canvas in CSS pixels.
        const displayWidth  = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
 
        // Check if the canvas is not the same size.
        const needResize = canvas.width  !== displayWidth ||
                     canvas.height !== displayHeight;
 
        if (needResize) {
            // Make the canvas the same size
            canvas.width  = displayWidth;
            canvas.height = displayHeight;
        }
 
        return needResize;
    }

    render() {
        this.resizeCanvasToDisplaySize(this.canvas);
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        // Set clear color to black, fully opaque
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        // Clear the color buffer with specified clear color
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // Prepare transform matrix
        let transform = Matrix3D.scale(this.scale, this.scale);
        transform = Matrix3D.translate(this.position.x, this.position.y).multiply(transform);
        //this.poly.draw(this.gl, transform);

        this.grid.draw(this.gl, transform);
        this.poly.draw(this.gl, transform);
    }


}