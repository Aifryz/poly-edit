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

stage.container().style.backgroundColor = '#f0f0f0';

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

  const localScale = stage.scale();
  rebuildGrid(newPos, localScale);
});

function makeGridLines(topLeft, bottomRight, spacingX, spacingY)
{
	var xArr = [];
	var yArr = [];

	const xMin = Math.min(topLeft.x, bottomRight.x);
	const xMax = Math.max(topLeft.x, bottomRight.x);
	const yMin = Math.min(topLeft.y, bottomRight.y);
	const yMax = Math.max(topLeft.y, bottomRight.y);
	
	const gxStart = Math.floor(xMin/spacingX);
	const gxStop = Math.floor(xMax/spacingX);
	for(var i = gxStart; i< gxStop; i++)
	{
		if(i != 0)
			xArr.push(i*spacingX);
	}
		
	const gyStart = Math.floor(yMin/spacingY);
	const gyStop = Math.floor(yMax/spacingY); 
	for(var i = gyStart; i< gyStop; i++)
	{
		if(i != 0)
			yArr.push(i*spacingY);
	}
	
	return {x:xArr, y:yArr};
}
const gridLayer = new Konva.Layer();
stage.add(gridLayer);

function writeMessage(message)
{
	  const info = document.getElementById('info');
	  info.innerHTML = message;
}

function canvasToKonvaCoords(pos)
{
	const scale = stage.scale();
	return {
		x: (pos.x - stage.x()) / scale.x,
		y: (pos.y - stage.y()) / scale.y
	};
}

function konvaToWorldCoords(pos)
{
	// Just offset by original size
	return {
		x:   pos.x - stage.width() / 2,
		y:  -pos.y + stage.height() / 2
	};
}

// And reverse
function worldToKonvaCoords(pos)
{
	return {
		x: pos.x + stage.width() / 2,
		y: -pos.y + stage.height() / 2
	};
}	

// handle stage click
stage.on('click', function (e) {
  //if (e.target === stage) {
  	let msg = 'clicked on stage' + e.currentTarget.getPointerPosition().x + ',' + e.currentTarget.getPointerPosition().y;
	msg += ' => ';
	const kpos = canvasToKonvaCoords(e.currentTarget.getPointerPosition());
	msg += 'konva coords ' + kpos.x + ',' + kpos.y;
	const wpos = konvaToWorldCoords(kpos);
	msg += ' => world coords ' + wpos.x + ',' + wpos.y;
	const kpos2 = worldToKonvaCoords(wpos);
	msg += ' => konva coords ' + kpos2.x + ',' + kpos2.y;
    writeMessage(msg);

	const circle = new Konva.Circle({
		x: kpos2.x,
		y: kpos2.y,
		radius: 10,
		fill: 'blue',
		draggable: true,
	});
	layer.add(circle);
	//layer.draw();
    return;
  //}
  //writeMessage('clicked on ' + e.target.name());
});

/// Rebuild grid based on position and scale
/// Position is top-left corner in Konva coords
/// Scale is XY scale
function rebuildGrid(postition, scale)
{
	const topLeft = postition;
	// Move to actual viewport coords 
	const topLeftVP = {
		x: -topLeft.x / scale.x,
		y: -topLeft.y / scale.y
	};

	const width = stage.width();
	const height = stage.height();

	const bottomRightVP = {
		x: (topLeftVP.x + width / scale.x), 
		y: (topLeftVP.y + height / scale.y),
	};

	//console.log("tlv" + JSON.stringify(topLeftVP));

	const topLeftWorld = konvaToWorldCoords(topLeftVP);
	const bottomRightWorld = konvaToWorldCoords(bottomRightVP);

	// Viewport coords in canvas
	console.log("tl" + JSON.stringify(topLeftWorld));
	console.log("br" + JSON.stringify(bottomRightWorld));
	
	// Update grid, , for now always show layer at some position
	const spacing = 50;
	const gridLines = makeGridLines(topLeftWorld, bottomRightWorld, spacing, spacing);
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
			const kPos = worldToKonvaCoords({x:x, y:y});
			const dot = new Konva.Circle({
				x: kPos.x,
				y: kPos.y,
				radius: 5,
				fill: color,
			});
			gridLayer.add(dot);
		}
	}
}
	
stage.on('dragend', (e) => {
	const scale = stage.scale();
	// Top left corner of the "normal" stage
	const pos = e.currentTarget.position();
	rebuildGrid(pos, scale);
});

rebuildGrid({x:0, y:0}, {x:1, y:1});