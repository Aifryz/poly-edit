

class GridLayer {
    display() {

    }
}

class PolyLayer {
    display() {

    }
}

class Scene {

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
        const span = 0.05;
        for (const vert of this.verts) {
            vertArray.push(vert.x, vert.y);
            vertArray.push(vert.x+span, vert.y);
            vertArray.push(vert.x+span, vert.y+span);

            vertArray.push(vert.x, vert.y);
            vertArray.push(vert.x+span, vert.y+span);
            vertArray.push(vert.x, vert.y+span);
            
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

        this.programParams = {
            positionLocation: positionLocation,
            program: program
        }
    }

    draw(gl) {
        // draw
        gl.enableVertexAttribArray(this.programParams.positionLocation);
        gl.vertexAttribPointer(this.programParams.positionLocation, 2, gl.FLOAT, false, 0, 0);

        // draw
        gl.drawArrays(gl.TRIANGLES, 0, this.elemCount);
    }
}

function createShaderFromScriptElement(gl, scriptId, type) {
        // Get the script element by its ID
        const shaderScript = document.getElementById(scriptId);
        if (!shaderScript) {
            console.error('Error: Shader script element not found.');
            return null;
        }

        
    }

function makeVertexShader(gl) {
    // Extract the content of the script element
    const shaderSource = `
        attribute vec2 a_position;

        void main() {
            gl_Position = vec4(a_position, 0, 1);
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
        void main() {
            gl_FragColor = vec4(0,1,0,1);  // green
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

//
// start here
//
main();

function main() {
  const canvas = document.querySelector("#gl-canvas");
  // Initialize the GL context 
  const gl = canvas.getContext("webgl");

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

  // Ok, draw some stuff

  let poly = new Polygon();
  poly.addPoint(-0.5, -0.5);
  poly.addPoint(0.5, -0.5);
  poly.addPoint(0.0, 0.5);

  poly.prepareProgram(gl);
  poly.prepareBuffer(gl);
  poly.draw(gl);



}