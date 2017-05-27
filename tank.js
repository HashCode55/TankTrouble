// Define the tank class! 
var Tank = function (strx, stry, angle) {
	this.x = strx;
	this.y = stry;
	this.angle = angle;
	this.getX = function () {
		return this.x;
	};

	this.getY = function () {
		return this.y;
	};

	this.getAngle = function() {
		return this.angle;
	};

	this.setX = function (newX) {
		this.x = newX;
	};

	this.setY = function (newY) {
		this.y = newY;
	};	

	this.setAngle = function(newAngle) {
		this.angle = newAngle;
	}
};

exports.Tank = Tank;