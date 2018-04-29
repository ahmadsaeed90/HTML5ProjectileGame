$(document).ready(function() {
	var canvas = $("#gameCanvas");
	var ctx = canvas.get(0).getContext("2d");
	var canvasWidth = canvas.width();
	var canvasHeight = canvas.height();
	
	//variables 
	var intervalId;
	var playerSelected = false;
	var ballOriginalX;
	var ballOriginalY;
	var playerMaxAbsVelocity = 50;
	var playerVelocityDampener = 0.3;
	var powerX = -1;
	var powerY = -1;
	var score = 0;
	var frameCount = 0;
	var g = 2.8;
	var inMotion = false;
	
	//UI references
	var scoreUI = $("#score");
	var gameIntroUI = $("#gameIntro");
	var statsUI = $("#stats");
	var gameCompleteUI = $("#gameComplete");
	var gameResultScoreUI = $("#resultScore");
	
	
	var missedHits = 0;
	var isGameOver = false;
	
	//moving box
	var rectangle = {
		width:60,
		height:60,
		direction:1,			//going right
		speed:10,
		upperLeftX:0,
		upperLeftY:0
	};
	
	//projectile
	var ball = {
		x:30, //start pos x
		y:380, //start pos y
		radius:15, //radius
		vX:0, //init velocity
		vY:0
	};
	
	function init(){
		gameCompleteUI.hide();
		statsUI.hide();
	}
	
	$("#gamePlay").click(function(e) {
		e.preventDefault();
		gameIntroUI.hide();
		statsUI.show();
		startGame();
	});
	
	//start new game
	function startGame(){
		
		intervalId = setInterval(tick, 50);
		rectangle.upperLeftX =  (canvasWidth / 2 ) - (rectangle.width / 2);
		rectangle.upperLeftY = (canvasHeight - rectangle.height);
		
		ballOriginalX = 30;
		ballOriginalY = 380;
	
		printScores();
	}

	//Game clock. All canvas drawings are done in this clock tick.
	function tick(){
			
		if(isGameOver){
			clearCanvas();
			//clearInterval(intervalId);
			return;
		}

		moveRectangle();
		drawBall();
		
		if(playerSelected)
		{
			drawPowerLine();
		}		
		
		if(inMotion){
			
			if(ball.y < canvasHeight - ball.radius && ball.x < canvasWidth - ball.radius){
				ball.y = ballOriginalY - ( ball.vY * frameCount - (1/2 * g * Math.pow(frameCount,2)) );
				ball.x = ballOriginalX + ball.vX * frameCount;
				checkStrike();
			}
			else{
				missedHits++;
				
				if(missedHits == 3)
					gameOver();
				else
					nextShot();
			}
			frameCount++;
		}	
	}
	
	function checkStrike(){
		
		if(ballHits()){
			score += 10;
			printScores();
			nextShot();
		}
	}
	
	function nextShot(){
		
		ball.x = 30;
		ball.y = 380;
		ball.vX = 0;
		ball.vY = 0;
		
		inMotion = false;
		playerSelected = false;
		frameCount = 0;
		powerX = -1;
		powerY = -1;
	}
	
	//move rectangle to next possible position
	function moveRectangle(){
		
		if( rectangle.upperLeftX + rectangle.width +  rectangle.speed > canvasWidth){
			rectangle.direction = -1;
		}
		else if(rectangle.upperLeftX - rectangle.speed <=  (canvasWidth / 2)){
			rectangle.direction = 1;
		}
		
		rectangle.upperLeftX += rectangle.speed * rectangle.direction;
		
		clearCanvas();
		
		ctx.save();
		ctx.fillStyle="#FF0000";
		ctx.fillRect(rectangle.upperLeftX,rectangle.upperLeftY,rectangle.width,rectangle.height);
		ctx.restore();
	}
	
	//make canvas black
	function clearCanvas(){
		ctx.save();
		ctx.fillStyle = "rgba(0, 0, 0, .3)";
		ctx.fillRect(0, 0, canvasWidth, canvasHeight);
		ctx.restore();
	}
	
	//print ball at its current position
	function drawBall(){
		
		ctx.fillStyle = "rgba(0, 200, 0, 0.6)";
		ctx.beginPath();
		ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2, true);
		ctx.closePath();
		ctx.fill();
	}
	
		
		//called when mouse is pressed on screen
		$(window).mousedown(function(e) {
		
			if (!playerSelected && ball.x == ballOriginalX && ball.y == ballOriginalY) {
				var canvasOffset = canvas.offset();
				var canvasX = Math.floor(e.pageX-canvasOffset.left);
				var canvasY = Math.floor(e.pageY-canvasOffset.top);
				
				var dX = ball.x-canvasX;
				var dY = ball.y-canvasY;
				var distance = Math.sqrt((dX*dX)+(dY*dY));
				var padding = 5;
				
				if (distance < ball.radius+padding) {
					powerX = ball.x;
					powerY = ball.y;
					playerSelected = true;
				};
			};
		});
	
		//called when cursor is dragged
		$(window).mousemove(function(e) {
			if (playerSelected) {
				var canvasOffset = canvas.offset();
				var canvasX = Math.floor(e.pageX-canvasOffset.left);
				var canvasY = Math.floor(e.pageY-canvasOffset.top);
			
				var dX = canvasX-ball.x;
				var dY = canvasY-ball.y;
				var distance = Math.sqrt((dX*dX)+(dY*dY));
				
				if (distance*playerVelocityDampener < playerMaxAbsVelocity) {
					powerX = canvasX;
					powerY = canvasY;
				} else {
					var ratio = playerMaxAbsVelocity/(distance*playerVelocityDampener);
					powerX = ball.x+(dX*ratio);
					powerY = ball.y+(dY*ratio);
				};
			};	
		});
		
		//called when mouse click is released
		$(window).mouseup(function(e) {
			if (playerSelected) {
				var dX = powerX-ball.x;
				var dY = powerY-ball.y;

				ball.vX = (dX*playerVelocityDampener);
				ball.vY = -(dY*playerVelocityDampener);
				inMotion = true;
			};
			
			playerSelected = false;
			powerX = -1;
			powerY = -1;
		});
		
	
	//print power line near ball
	function drawPowerLine(){
	
		if (playerSelected) {
			ctx.strokeStyle = "rgb(255, 255, 255)";
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.moveTo(ball.x, ball.y);
			ctx.lineTo(powerX, powerY);
			ctx.closePath();
			ctx.stroke();
		};
	}
	
	function ballHits()
	{
		var dX = ball.x - (rectangle.upperLeftX  + rectangle.width/2);
		var dY = ball.y - (rectangle.upperLeftY  + rectangle.height/2);
		var distance = Math.sqrt((dX*dX)+(dY*dY));
		
		if( distance <=  (ball.radius + rectangle.height/2 )){
			return true;
		}	
		return false;
	}
	
	function printScores(){
		scoreUI.html("" + score); 
	}
	
	function gameOver(){
		
		isGameOver = true;
		inMotion = false;
	
		gameCompleteUI.show();
		statsUI.hide();
		gameIntroUI.hide();
		gameResultScoreUI.html("" + score);
		clearCanvas();
	}
	
	init();
});
