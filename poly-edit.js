//import Konva from 'konva';

// first we need to create a stage
/*
var stage = new Konva.Stage({
  container: 'container', // id of container <div>
  width: 500,
  height: 500,
  draggable: true
});

// then create layer
var layer = new Konva.Layer();

// create our shape
var circle = new Konva.Circle({
  x: stage.width() / 2,
  y: stage.height() / 2,
  radius: 70,
  fill: 'red',
  stroke: 'black',
  strokeWidth: 4,
});

// add the shape to the layer
layer.add(circle);

// add the layer to the stage
stage.add(layer);
*/
// so this works as draggable
const width = window.innerWidth;
const height = window.innerHeight;

const stage = new Konva.Stage({
  container: 'container',
  width: width,
  height: height,
  draggable: true
});

const layer = new Konva.Layer();
stage.add(layer);

const circle2 = new Konva.Circle({
  x: stage.width() / 2,
  y: stage.height() / 2,
  radius: 40,
  fill: 'green',
});

//layer.add(circle2);

const circle = new Konva.Circle({
  x: stage.width() / 2,
  y: stage.height() / 2,
  radius: 50,
  fill: 'green',
});
layer.add(circle);

const scaleBy = 1.05;
stage.on('wheel', (e) => {
  // stop default scrolling
  e.evt.preventDefault();

  const oldScale = stage.scaleX();
  const pointer = stage.getPointerPosition();

  const mousePointTo = {
    x: (pointer.x - stage.x()) / oldScale,
    y: (pointer.y - stage.y()) / oldScale,
  };

  // how to scale? Zoom in? Or zoom out?
  let direction = e.evt.deltaY > 0 ? 1 : -1;

  // when we zoom on trackpad, e.evt.ctrlKey is true
  // in that case lets revert direction
  if (e.evt.ctrlKey) {
    direction = -direction;
  }

  const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

  stage.scale({ x: newScale, y: newScale });

  const newPos = {
    x: pointer.x - mousePointTo.x * newScale,
    y: pointer.y - mousePointTo.y * newScale,
  };
  stage.position(newPos);
});

function makeGridLines(topLeft, bottomRight, spacingX, spacingY)
{
	var xArr = [];
	var yArr = [];
	
	// Adjust grid to be centered in 
	
	const gxStart = Math.floor(topLeft.x/spacingX);
	const gxStop = Math.floor(bottomRight.x/spacingX);
	for(var i = gxStart; i< gxStop; i++)
	{
		if(i != 0)
			xArr.push(i*spacingX+(stage.width()/2)%spacingX);
	}
		
	
	const gyStart = Math.floor(topLeft.y/spacingY);
	const gyStop = Math.floor(bottomRight.y/spacingY); 
	for(var i = gyStart; i< gyStop; i++)
	{
		if(i != 0)
			yArr.push(i*spacingY+(stage.height()/2)%spacingY);
	}
		
	
	return {x:xArr, y:yArr};
}
const gridLayer = new Konva.Layer();
stage.add(gridLayer);
	
stage.on('dragend', (e) => {
	const scale = stage.scale();
	const topLeft = {
		x: -e.currentTarget.position().x/scale.x,
		y: -e.currentTarget.position().y/scale.y};
	const bottomRight = {
		x: topLeft.x+stage.width()/scale.x, 
		y: topLeft.y+stage.height()/scale.y};
	// Viewport coords in canvas
	console.log(topLeft)
	console.log(bottomRight)
	
	// Update grid, , for now always show layer at some position
	
	const spacing = 50;
	
	const gridLines = makeGridLines(topLeft, bottomRight, spacing, spacing);
	console.log(gridLines.x)
	console.log(gridLines.y)
	
	gridLayer.destroyChildren();
	
	for (const x of gridLines.x) {  
		for (const y of gridLines.y) {
			let color = 'red';
			//if(x == 0 || y == 0)
			//{
			//	color = 'blue';
			//}
			const dot = new Konva.Circle({
				x: x,
				y: y,
				radius: 5,
				fill: color,
			});
			gridLayer.add(dot);
		}
	}
	
	
	
	

 //this sucks, we are actually more interested in te viewport coords
	// Place at first grid node?
	// Transform to world coords
	/*
	const wx = topLeft.x - stage.width() / 2;
	const wy = topLeft.y + stage.height() / 2;
	console.log("wx " + wx + " wy "+wy)
	//adjust to grid space
	
	const px = Math.floor(wx/spacing) +1;
	const py = Math.floor(wy/spacing) +1;
	console.log("gx " + px + " gy "+py)
	
	// adjust to world space
	
	console.log("px " + px*spacing + " py "+py*spacing)
	
	const wx2 = px*spacing + stage.width() / 2
	const wy2 = py*spacing - stage.height() / 2
	console.log("wx2 " + wx2 + " wy2 "+wy2)
	
	const newPos = {
		x: wx2,
		y: wy2
	};
	circle2.position(newPos);
	*/
	
	
	
});