import { makeVertexShader, makeFragmentShader } from './gl-utils.js';
import { Matrix3D } from './math.js';

class PolygonModel {
    constructor() {
        this.verts = [];
        this.circleRadius = 5.0;
        this.color = {r: 1, g: 0, b: 0, a: 1};
        this.lineWidth = 1.0;
    }

    // Add at any index: 0 = front, -1 = back, other index = in between
    addPoint(x, y, index) {
        const point = {x:x, y:y};
        if (index === undefined || index === -1) {
            // Add to back (end) - default behavior
            this.verts.push(point);
        } else if (index === 0) {
            // Add to front (beginning)
            this.verts.unshift(point);
        } else {
            // Add at specific index
            this.verts.splice(index, 0, point);
        }
    }

    removePoint(index) {
        this.verts.splice(index, 1);
    }

    movePoint(index, x, y) {
        if (index >= 0 && index < this.verts.length) {
            this.verts[index] = {x:x, y:y};
        }
    }

    setColor(r, g, b, a) {
        this.color = {r, g, b, a};
    }

    setLineWidth(width) {
        this.lineWidth = width;
    }

    setCircleRadius(radius) {
        this.circleRadius = radius;
    }
}

class BufferAllocator {
    constructor(gl) {
        this.gl = gl;
        this.buffers = []; // list of buffers + their free space tracking
        this.freeList = []; // list of free buffer parts for reuse
        this.blocks = []; // track allocated blocks with buffer, offset, size
        this.bufferSize = 64 * 1024; // Data chunked in 64KiB parts
        // Prepare first bufffer
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.bufferSize, gl.DYNAMIC_DRAW);
        this.buffers.push({buffer: buffer, free: this.bufferSize});
        
    }

    allocateBufferPart(attrSize, vertCount) {

        // Check if there's a free part that can fit the requested size
        for (let i = 0; i < this.freeList.length; i++) {
            const freePart = this.freeList[i];
            if (freePart.size >= attrSize * vertCount * 4) {
                // Found a suitable free part
                this.freeList.splice(i, 1);
                this.blocks.push({buffer: freePart.buffer, offset: freePart.offset, size: attrSize * vertCount * 4});
                return {buffer: freePart.buffer, offset: freePart.offset};
            }
        }
        // If not: check if there's space at end of the last buffer, if not create a new buffer
        const lastBuffer = this.buffers[this.buffers.length - 1];
        if (lastBuffer.free < attrSize * vertCount * 4) {
            // Not enough space, create a new buffer
            const buffer = this.gl.createBuffer();
            this.buffers.push({buffer: buffer, free: this.bufferSize});
        }
        // Allocate from the last buffer
        const bufferInfo = this.buffers[this.buffers.length - 1];
        const offset = this.bufferSize - bufferInfo.free;
        bufferInfo.free -= attrSize * vertCount * 4;
        this.blocks.push({buffer: bufferInfo.buffer, offset: offset, size: attrSize * vertCount * 4});
        return {buffer: bufferInfo.buffer, offset: offset};
    }

    freeBufferPart(buffer, offset) {
        // Add the part to the free list for reuse
        const blockIndex = this.blocks.findIndex(block => block.buffer === buffer && block.offset === offset);
        if (blockIndex !== -1) {
            const block = this.blocks[blockIndex];
            this.freeList.push({buffer: block.buffer, offset: block.offset, size: block.size});
            this.blocks.splice(blockIndex, 1);
            return;
        }
        console.warn('Attempted to free a buffer part that was not allocated');
    }
}

function mergeFloat32Arrays(arrays) {
    let totalLength = 0;
    for (const arr of arrays) {
        totalLength += arr.length;
    }
    const result = new Float32Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}

class PointBufferBuilder {
    // Prepare vertex buffer data for single point
    static buildPointBufferData(x,y) {
        const halfSize = 1.0; // size of the point quad in normalized units, will be scaled in shader
        // ok, now i get it, in general vert offsets may be e.g. just 16 or 32 bit ints
        // but the cost of duplication for each tri especially for large attr counts is bad
        // but let's ignore it and just duplicate verts for now
        return new Float32Array([
            x - halfSize, y - halfSize, // botttom-left
            x, y, // center

            x + halfSize, y - halfSize, // bottom-right
            x, y, // center

            x + halfSize, y + halfSize, // top-right
            x, y, // center

            x - halfSize, y - halfSize, // botttom-left
            x, y, // center

            x - halfSize, y + halfSize, // top-left
            x, y, // center

            x + halfSize, y + halfSize, // top-right
            x, y, // center
        ]);
        
    }
}


class PolygonRenderer {
    constructor(gl) {
        this.gl = gl;
        self.bufferAllocator = new BufferAllocator(gl);
        self.pointParts = []; // track point objects with their buffer info for updates
    }

    syncModel(model) {
        // Convert full model data to GPU buffers, etc.
        // TODO
    }

    // For optimization, we don't sync the whole model, but handle the update separately
    addPoint(x, y, index) {
        // Add point to GPU buffer at correct position
        // alloc
        // bind buffer
        // upload sub data
    }

    removePoint(index) {
        // Remove point from GPU buffer
    }

    movePoint(index, x, y) {
        // Update point position in GPU buffer
    }

    setColor(r, g, b, a) {
        // Update color uniform in shader
    }

    setLineWidth(width) {
        // Update line width uniform in shader
    }

    setCircleRadius(radius) {
        // Update circle radius uniform in shader
    }
}


export class Polygon {
    constructor() {
        this.verts = [];
        this.buffer = null;
        this.circleRadius = 5.0;
    }

    addPoint(x, y, index) {
        const point = {x:x, y:y};
        if (index === undefined || index === -1) {
            // Add to back (end) - default behavior
            this.verts.push(point);
        } else if (index === 0) {
            // Add to front (beginning)
            this.verts.unshift(point);
        } else {
            // Add at specific index
            this.verts.splice(index, 0, point);
        }
    }

    removeLastPoint() {
        this.verts.pop();
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