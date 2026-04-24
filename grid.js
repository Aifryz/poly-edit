import { makeVertexShader, makeFragmentShader } from './gl-utils.js';
import { Matrix3D } from './math.js';

export class Grid {
    constructor() {
        // Set default bounds to some 1000x1000 area to avoid problems with initialization order
        this.bounds = {xmin: -500, xmax: 500, ymin: -500, ymax: 500};
    }
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
        var worldToCanvasLocation = gl.getUniformLocation(program, "u_WorldToCanvas");
        var canvasToClipLocation = gl.getUniformLocation(program, "u_CanvasToClip");

        this.programParams = {
            positionLocation: positionLocation,
            worldToCanvasLocation: worldToCanvasLocation,
            canvasToClipLocation: canvasToClipLocation,
            program: program
        }
    }

    setBounds(xmin, xmax, ymin, ymax) {
        this.bounds = {xmin, xmax, ymin, ymax};
    }

    prepareBuffer(gl) {
        if(this.buffer == null) {
            this.buffer = gl.createBuffer();
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        const vertArray = [];
        
        vertArray.push(this.bounds.xmin, this.bounds.ymin);
        vertArray.push(this.bounds.xmax, this.bounds.ymin);
        vertArray.push(this.bounds.xmax, this.bounds.ymax);

        vertArray.push(this.bounds.xmin, this.bounds.ymin);
        vertArray.push(this.bounds.xmax, this.bounds.ymax);
        vertArray.push(this.bounds.xmin, this.bounds.ymax);

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertArray), gl.STATIC_DRAW);

        this.elemCount = 2*3; // Just 2 triangles
    }

    draw(gl, transform) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.useProgram(this.programParams.program);

        gl.enableVertexAttribArray(this.programParams.positionLocation);
        gl.vertexAttribPointer(this.programParams.positionLocation, 2, gl.FLOAT, false, 0, 0);

        // Scale down to clip space (-1 to 1 range)
        // just scale is needed to convert here
        const scale = Matrix3D.scale(1/gl.canvas.clientWidth*2, 1/gl.canvas.clientHeight*2);
        const canvasToClip = scale.toWebGLUniform();
        gl.uniformMatrix3fv(this.programParams.canvasToClipLocation, false, canvasToClip);

        const worldToCanvas = transform.toWebGLUniform();
        gl.uniformMatrix3fv(this.programParams.worldToCanvasLocation, false, worldToCanvas);

        gl.drawArrays(gl.TRIANGLES, 0, this.elemCount);
    }
}