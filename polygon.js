import { makeVertexShader, makeFragmentShader } from './gl-utils.js';
import { Matrix3D } from './math.js';

export class Polygon {
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