export async function loadShaderSource(path) {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Failed to load shader: ${path}`);
    }
    return await response.text();
}

export async function makeVertexShader(gl, path) {
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

export async function makeFragmentShader(gl, path) {
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