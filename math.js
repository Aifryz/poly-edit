

// 3D Matrix Operations for WebGL
export class Matrix3D {
    constructor(
        m00 = 1, m01 = 0, m02 = 0,
        m10 = 0, m11 = 1, m12 = 0,
        m20 = 0, m21 = 0, m22 = 1
    ) {
        // Store in row-major format internally
        this.data = [
            m00, m01, m02,
            m10, m11, m12,
            m20, m21, m22
        ];
    }

    // Export as Float32Array in column-major format for WebGL
    toWebGLUniform() {
        // WebGL uses column-major format, so transpose from row-major
        return new Float32Array([
            this.data[0], this.data[3], this.data[6],
            this.data[1], this.data[4], this.data[7],
            this.data[2], this.data[5], this.data[8]
        ]);
    }

    // Identity matrix
    static identity() {
        return new Matrix3D();
    }

    // Rotation around Z axis (2D rotation in 3D space)
    static rotateZ(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Matrix3D(
            cos, -sin, 0,
            sin,  cos, 0,
            0,    0,   1
        );
    }

    // Scale matrix
    static scale(sx, sy, sz = 1) {
        return new Matrix3D(
            sx, 0,  0,
            0,  sy, 0,
            0,  0,  sz
        );
    }

    // Translation matrix
    static translate(tx, ty) {
        return new Matrix3D(
            1, 0, tx,
            0, 1, ty,
            0, 0, 1
        );
    }


    // Multiply two matrices
    multiply(other) {
        const result = new Matrix3D();
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                let sum = 0;
                for (let k = 0; k < 3; k++) {
                    sum += this.data[row * 3 + k] * other.data[k * 3 + col];
                }
                result.data[row * 3 + col] = sum;
            }
        }
        return result;
    }
}

//module.exports = { Matrix3D };