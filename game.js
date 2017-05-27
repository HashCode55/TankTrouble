// get express for routing 
var express = require('express');
// create an express app 
var app = express();
// create a http server using the express app 
var server = require('http').createServer(app);
// power socket io with the http server 
var io = require('socket.io')(server);

var Tank = require('./tank').Tank;

// tanks global array 
var tanks = [];

// check if someone has connected 
io.on('connection', function(socket){
	console.log('Someone connected to us with socket id '+socket.id);

	// callback when a new tank is connected
	socket.on('newTank', function(data){
		newTank(data, socket);
	});

	socket.on('update location', function(data){
		updateTanks(data, socket);
	});

	socket.on('disconnect', function(data){
		tankDisconnected(socket);
	});

	// this is a test function 
	socket.on('test', function(){
		console.log('Test worked');	
	});	
});

function updateTanks (data, socket) {
	var toUpdate = findTank(socket.id);

	// if not found 
	if (!toUpdate) {
		console.log('Tank not found');
		return;
	}

	// update the location on the server 
	toUpdate.setX(data.x);
	toUpdate.setY(data.y);

	// broadcast the updated location 
	socket.broadcast.emit('update location', {id: toUpdate.id, x: toUpdate.getX(), y: toUpdate.getY()});
	// console.log(toUpdate.x + " " + toUpdate.y);
}

function newTank (data, socket) {
	/*
	Creates a new Tank and adds on the server with its 
	housekeeping variables		 	
	*/
	var tank = new Tank(data.x, data.y); 
	tank.id = socket.id;

	// bradcast the addition of the tank (send data to all except the one with 
	// whom the connection is established)
	socket.broadcast.emit('new tank', {id: tank.id, x: tank.getX(), y: tank.getY()});

	// send details of existing tanks to the connected client only 
	for (var i = 0; i < tanks.length; i++) {
		socket.emit('new tank', {id: tanks[i].id, x: tanks[i].getX(), y: tanks[i].getY()});
	}

	// Add the tank to the globals 
	tanks.push(tank);

	// For debugging 
	// console.log(tank.x + ' New tanks length ' + tanks.length);
}
function tankDisconnected (socket) {
	var toDelete = findTank(socket.id);

	// if not found 
	if (!toDelete) {
		console.log('Tank not found');
		return;
	}	

	// remove from the global array 
	tanks.splice(tanks.indexOf(toDelete), 1);

	// notify all the other tanks that their brother 
	// has died 
	socket.broadcast.emit('tank died', {id: toDelete.id});

	// For debugging
	console.log('Tank Disconnected!');
}

// start the server 
server.listen(3000, function(){
  console.log('listening on localhost:3000  ');
});

////////////////////// 
// HELPER FUNCTIONS //
//////////////////////

function findTank(id) {
	for (var i = 0; i < tanks.length; i++) {
		if (tanks[i].id == id) {
			return tanks[i];
		}	
	}
	return false;
}