/*
 * Turtle graphic library. Originally by this author:
 * https://github.com/bjpop/js-turtle
 * I modified to make it an object rather than use global variables.
 * This allows for multiple turtles on the same canvas.
 */

function Turtle(iCanvas, tCanvas) {
    // get a handle for the canvases in the document
    var imageCanvas = iCanvas;
    var imageContext = imageCanvas.getContext('2d');

    imageContext.textAlign = "center";
    imageContext.textBaseline = "middle";

    var turtle = undefined;
    var turtleCanvas = tCanvas;
    var turtleContext = turtleCanvas.getContext('2d');

    // the turtle takes precedence when compositing
    turtleContext.globalCompositeOperation = 'destination-over';

    // private methods here

    // initialize the state of the turtle
    function initialize() {
	turtle = {
	    pos: {
		x: 0,
		y: 0
	    },
	    angle: 0,
	    penDown: true,
	    width: 1,
	    visible: true,
	    redraw: true, // does this belong here?
	    wrap: true,
	    color: {r: 0, g: 0, b: 0, a: 1},
	};
	imageContext.lineWidth = turtle.width;
	imageContext.strokeStyle = "black";
	imageContext.globalAlpha = 1;
    }

    // draw the turtle and the current image if redraw is true
    // for complicated drawings it is much faster to turn redraw off
    function drawIf(instance) {
	if (turtle.redraw)
	    instance.draw();
    }

    // use canvas centered coordinates facing upwards
    function centerCoords(context) {
	var width = context.canvas.width;
	var height = context.canvas.height;
	context.translate(width/2, height/2);
	context.transform(1, 0, 0, -1, 0, 0);
    }

    function clearContext(context) {
	context.save();
	context.setTransform(1,0,0,1,0,0);
	context.clearRect(0,0,context.canvas.width,context.canvas.height);
	context.restore();
    }

    // public methods here.

    // clear the display, don't move the turtle
    this.clear = function() {
	clearContext(imageContext);
	drawIf(this);
    }

    // convert degrees to radians
    this.degToRad = function(deg) {
	return deg / 180 * Math.PI;
    }

    // convert radians to degrees
    this.radToDeg = function(deg) {
	return deg * 180 / Math.PI;
    }

    // draw the turtle and the current image
    this.draw = function() {
	clearContext(turtleContext);
	if (turtle.visible) {
	    var x = turtle.pos.x;
	    var y = turtle.pos.y;
	    var w = 10;
	    var h = 15;
	    turtleContext.save();
	    // use canvas centered coordinates facing upwards
	    centerCoords(turtleContext);
	    // move the origin to the turtle center
	    turtleContext.translate(x, y);
	    // rotate about the center of the turtle
	    turtleContext.rotate(-turtle.angle);
	    // move the turtle back to its position
	    turtleContext.translate(-x, -y);
	    // draw the turtle icon
	    turtleContext.beginPath();
	    turtleContext.moveTo(x - w/2, y);
	    turtleContext.lineTo(x + w/2, y);
	    turtleContext.lineTo(x, y + h);
	    turtleContext.closePath();
	    turtleContext.fillStyle = "green";
	    turtleContext.fill();
	    turtleContext.restore();
	}
	turtleContext.drawImage(imageCanvas,
		0, 0, imageCanvas.width, imageCanvas.height,
		0, 0, turtleContext.canvas.width, turtleContext.canvas.height);
    }

    // reset the whole system, clear the display and move turtle back to
    // origin, facing the Y axis.
    this.reset = function() {
	initialize();
	this.clear();
	this.draw();
    }

    // Trace the forward motion of the turtle, allowing for possible
    // wrap-around at the boundaries of the canvas.
    this.forward = function(distance) {
	imageContext.save();
	centerCoords(imageContext);
	imageContext.beginPath();
	// get the boundaries of the canvas
	var maxX = imageContext.canvas.width / 2;
	var minX = -imageContext.canvas.width / 2;
	var maxY = imageContext.canvas.height / 2;
	var minY = -imageContext.canvas.height / 2;
	var x = turtle.pos.x;
	var y = turtle.pos.y;
	// trace out the forward steps
	while (distance > 0) {
	    // move the to current location of the turtle
	    imageContext.moveTo(x, y);
	    // calculate the new location of the turtle after doing the forward movement
	    var cosAngle = Math.cos(turtle.angle);
	    var sinAngle = Math.sin(turtle.angle)
		var newX = x + sinAngle  * distance;
	    var newY = y + cosAngle * distance;
	    // wrap on the X boundary
	    function xWrap(cutBound, otherBound) {
		var distanceToEdge = Math.abs((cutBound - x) / sinAngle);
		var edgeY = cosAngle * distanceToEdge + y;
		imageContext.lineTo(cutBound, edgeY);
		distance -= distanceToEdge;
		x = otherBound;
		y = edgeY;
	    }

	    // wrap on the Y boundary
	    function yWrap(cutBound, otherBound) {
		var distanceToEdge = Math.abs((cutBound - y) / cosAngle);
		var edgeX = sinAngle * distanceToEdge + x;
		imageContext.lineTo(edgeX, cutBound);
		distance -= distanceToEdge;
		x = edgeX;
		y = otherBound;
	    }

	    // don't wrap the turtle on any boundary
	    function noWrap()
	    {
		imageContext.lineTo(newX, newY);
		turtle.pos.x = newX;
		turtle.pos.y = newY;
		distance = 0;
	    }

	    // if wrap is on, trace a part segment of the path and wrap on boundary if necessary
	    if (turtle.wrap) {
		if (newX > maxX)
		    xWrap(maxX, minX);
		else if (newX < minX)
		    xWrap(minX, maxX);
		else if (newY > maxY)
		    yWrap(maxY, minY);
		else if (newY < minY)
		    yWrap(minY, maxY);
		else
		    noWrap();
	    }
	    // wrap is not on.
	    else {
		noWrap();
	    }
	}
	// only draw if the pen is currently down.
	if (turtle.penDown)
	    imageContext.stroke();
	imageContext.restore();
	drawIf(this);
    }

    // turn edge wrapping on/off
    this.wrap = function(bool) { turtle.wrap = bool; }

    // show/hide the turtle
    this.hideTurtle = function()
    {
	turtle.visible = false;
	drawIf(this);
    }

    // show/hide the turtle
    this.showTurtle = function() {
	turtle.visible = true;
	drawIf(this);
    }

    // turn on/off redrawing
    this.redrawOnMove = function(bool) {
	turtle.redraw = bool;
    }

    // lift up the pen (don't draw)
    this.penup = function() { turtle.penDown = false; }

    // put the pen down (do draw)
    this.pendown = function() { turtle.penDown = true; }

    // turn right by an angle in degrees
    this.right = function (angle) {
	turtle.angle += this.degToRad(angle);
	drawIf(this);
    }

    // turn left by an angle in degrees
    this.left = function(angle) {
	turtle.angle -= this.degToRad(angle);
	drawIf(this);
    }

    // move the turtle to a particular coordinate (don't draw on the way there)
    this.goto = function(x,y) {
	turtle.pos.x = x;
	turtle.pos.y = y;
	drawIf(this);
    }

    // set the angle of the turtle in degrees
    this.angle = function(angle) {
	turtle.angle = this.degToRad(angle);
    }

    // set the width of the line
    this.width = function width(w) {
	turtle.width = w;
	imageContext.lineWidth = w;
    }

    // write some text at the turtle position.
    // ideally we'd like this to rotate the text based on
    // the turtle orientation, but this will require some clever
    // canvas transformations which aren't implemented yet.
    this.write = function(msg) {
	imageContext.save();
	centerCoords(imageContext);
	imageContext.translate(turtle.pos.x, turtle.pos.y);
	imageContext.transform(1, 0, 0, -1, 0, 0);
	imageContext.translate(-turtle.pos.x, -turtle.pos.y);
	imageContext.fillText(msg, turtle.pos.x, turtle.pos.y);
	imageContext.restore();
	drawIf(this);
    }

    // draws a circle centered at x, y of the desired radius.
    this.circle = function(x, y, radius) {
	// save critical turtle state.
	var savedRedraw = turtle.redraw;
	var savedAngle = turtle.angle;
	this.redrawOnMove(false);
	this.angle(0);
	var step = radius / 56.794;
	this.goto(x - radius, y);
	this.repeat(360, function(turtle) {
		turtle.forward(step);
		turtle.right(1);
	    }, this);

	// restore turtle state.
	turtle.angle = savedAngle;
	turtle.redraw = savedRedraw;
	this.draw();
    }

    // set the color of the line using RGB values in the range 0 - 255.
    this.color = function(r,g,b,a) {
	imageContext.strokeStyle = "rgba(" + r + "," + g + "," + b + "," + a + ")";
	turtle.color.r = r;
	turtle.color.g = g;
	turtle.color.b = b;
	turtle.color.a = a;
    }

    // Generate a random integer between low and hi
    this.random = function(low, hi) {
	return Math.floor(Math.random() * (hi - low + 1) + low);
    }

    // draws a rectangle centered at x, y of w wide, an h high.
    // the rectangle is oriented using the current turtle heading.
    this.rectangle = function(x, y, w, h) {
	this.goto(x, y);
	this.penup()
	this.forward(w/2);
	this.left(90);
	this.pendown();
	this.forward(h/2);
	this.left(90);
	this.forward(w);
	this.left(90);
	this.forward(h);
	this.left(90);
	this.forward(w);
	this.left(90);
	this.forward(h/2);
	this.right(90);
    }

    this.repeat = function(n, action, arg) {
	for (var count = 1; count <= n; count++)
	    action(arg);
    }

    this.animate = function(f, ms, arg) {
	return setInterval(f, ms, arg);
    }

    this.setFont = function(font) {
	imageContext.font = font;
    }

    this.reset();
}
