import { Matrix3D } from './math.js';
import {Polygon} from './polygon.js';
import {Grid} from './grid.js';

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

        this.updatePointsTable();
        
        this.grid = new Grid();

        // Initialize shaders asynchronously
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
            this.updatePointsTable();
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

    updatePointsTable() {
        const tbody = document.getElementById('points-tbody');
        tbody.innerHTML = '';
        this.poly.verts.forEach((point, index) => {
            const row = document.createElement('tr');
            const indexCell = document.createElement('td');
            indexCell.textContent = index;
            const xCell = document.createElement('td');
            xCell.textContent = point.x.toFixed(2);
            const yCell = document.createElement('td');
            yCell.textContent = point.y.toFixed(2);
            row.appendChild(indexCell);
            row.appendChild(xCell);
            row.appendChild(yCell);
            tbody.appendChild(row);
        });
        // Auto-scroll to the last item
        const container = document.getElementById('points-table-container');
        container.scrollTop = container.scrollHeight;
    }

    // Transform from canvas pixel coordinates to world coordinates
    canvasToWorldCoords(x, y) {
        const yw = -y + this.canvas.clientHeight / 2;
        const xw = x - this.canvas.clientWidth / 2;

        //console.log(this.canvas.clientWidth, this.canvas.clientHeight);

        // yw, xw are now in corrected canvas coords with origin at center and y flipped
        // now apply inverse of worldToCanvas transform to get world coords
        const invScale = 1 / this.scale;
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

    resizeGrid() {
        const tl = this.canvasToWorldCoords(0, 0);
        const br = this.canvasToWorldCoords(this.canvas.clientWidth, this.canvas.clientHeight);

        const xmin = Math.min(tl.x, br.x);
        const xmax = Math.max(tl.x, br.x);
        const ymin = Math.min(tl.y, br.y);
        const ymax = Math.max(tl.y, br.y);

        this.grid.setBounds(xmin, xmax, ymin, ymax);
        this.grid.prepareBuffer(this.gl);
    }


    render() {
        this.resizeCanvasToDisplaySize(this.canvas);
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        // Set clear color to black, fully opaque
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        // Clear the color buffer with specified clear color
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.resizeGrid();

        // Prepare transform matrix
        let transform = Matrix3D.scale(this.scale, this.scale);
        transform = Matrix3D.translate(this.position.x, this.position.y).multiply(transform);
        //this.poly.draw(this.gl, transform);

        this.grid.draw(this.gl, transform);
        this.poly.draw(this.gl, transform);
    }


}