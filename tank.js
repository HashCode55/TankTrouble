// Define the tank class! 
var Tank = function (strx, stry) {
	this.x = strx;
	this.y = stry;

	this.getX = function () {
		return this.x;
	};

	this.getY = function () {
		return this.y;
	};

	this.setX = function (newX) {
		this.x = newX;
	};

	this.setY = function (newY) {
		this.y = newY;
	};	
};

exports.Tank = Tank;