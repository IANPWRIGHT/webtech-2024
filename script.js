;(function(){
    
    // Declare the game variable
    var game;
    
    // Function to start the game
    function start(){
        // Create a new instance of the Game class and assign it to the game variable
        game=new Game('c');
        window.game=game;
        
        // Bind the press and unPress game.keys object to the appropriate event listeners
        game.keys.press.bind(game.keys);
        window.addEventListener('keydown', game.keys.press.bind(game.keys));
        window.addEventListener('keyup', game.keys.unPress.bind(game.keys));
        
        // Starts game loop
        game.tick();
        
        // Assign the start function to the window object so it can be accessed globally
        window.start=start;
    }
    
    window.addEventListener('load', start); // Starts the game when the window loads
    
    

    // Game creats gmae class
    function Game(canvasId){
        // sets the canvas hight and width to the windows hight and width
        this.ww=window.innerWidth;
        this.hh=window.innerHeight;
        this.running=true;
        
        this.keys=new Keys();
        
       // creates an instance for drawer and player and assignes them a variable 
        this.drawer=new Drawer(canvasId, this);
        this.player=new Player(this);
        
        // creates an empty array for invaders, bullets and upgrades
        this.invaders=[];
        this.bullets=[];
        this.upgrades=[];
        
        
        this.updateMs=8;
        this.lastTick=Date.now();
        
        // creates an array of waves
        this.waves=[
            {
                // sets the width, height and padding (space bettwen the invaders) of the waveS
                width:8,
                height:3,
                padding:20
            },{
                width:10,
                height:4,
                padding:30
            },{
                width:20,
                height:5,
                padding:20
            }
        ];
        this.inWave=false; 
        this.currWave=0;
    }

    
    Game.prototype={
        tick:function(){
            // if the game is runnuing animate the next frame
            if(this.running) window.requestAnimationFrame(this.tick.bind(this));
            
            //updates the game and tracks the time between ticks
            var currTick=Date.now();
            var elapsedTime=currTick-this.lastTick;

            // if the time between ticks is greater than the updateMs*100 then pause the game to prevent instabilitys and attemt to allow the sight to catch up
            if(elapsedTime>this.updateMs*100) return this.pause();
            
            // while the time between ticks is greater than the updateMs update the game
            while(elapsedTime-this.updateMs>0){
                elapsedTime-=this.updateMs;
                this.update();
            }
            this.render();
            
            // sets the last tick to the current tick minus the elapsed time
            this.lastTick=currTick-elapsedTime;
        },

        // updates the game
        update:function(){
            this.player.update();
            
            // if the player is in a wave and there are no invaders left then generate the next wave in the array
            if(this.invaders.length<1){
                this.genWave(this.currWave);
            }
            
            // updates the invaders and checks if they should shoot
            for(var i=0; i<this.invaders.length; ++i){
                this.invaders[i].update();
                
                // if the random number is less than 0.005 then the invader should shoot
                if(Math.random()<0.005) this.invaders[i].shoot();
            }
            
            // updates the bullets
            for(var i=0; i<this.bullets.length; ++i){
                this.bullets[i].update();
            }
            
            // checks if any bullets have collided a invader or the player
            for(var i=0; i<this.bullets.length; ++i){
                for(var j=0; j<this.invaders.length; ++j){
                    
                    // if the bullet wasnt fired by invader and the bullet has collided with an invader then decrease the bullets pierce and the invaders health
                    if(!this.bullets[i].isInvader&&checkCollision(this.invaders[j], this.bullets[i])){
                        
                        --this.bullets[i].pierce;
                        this.invaders[j].health-=this.bullets[i].power;
                        
                        // if the random number is less than 0.05 then add a new upgrade to the upgrades array
                        if(Math.random()<0.05) this.upgrades.push(new Upgrade(this.invaders[j]))
                    }   
                }

                // if the bullet was fired by an invader and the bullet has collided with the player then decrease the players health and the bullets pierceing
                if(this.bullets[i].isInvader&&checkCollision(this.player, this.bullets[i])){
                    this.player.health-=this.bullets[i].power;
                    --this.bullets[i].pierce;
                }
            }
            
            // updates the upgrades and checks if the player has collided with upgrades 
            for(var i=0; i<this.upgrades.length; ++i){
                this.upgrades[i].update();
                if(checkCollision(this.upgrades[i], this.player)){
                    this.player[this.upgrades[i].type]+=1;
                    this.upgrades[i].use();
                }
            }
        },

        
        render:function(){
            this.drawer.draw();
        },
        // generates a wave of invaders
        genWave:function(ind){
            // if the wave is greater than the length of the waves array then return
            var wave=this.waves[ind];
            
            //starts the wave at the top of the screen and sets the total width hight and padding from the array
            var waveStart=wave.padding*wave.height,
                totWidth=wave.width*wave.padding;
            
            
            // Loop through the width and height of the wave to create invaders
            for(var i=0; i<wave.width; ++i){
                for(var j=0; j<wave.height; ++j){
                    //creates a new invader and adds it to the wave
                    var invader=new Invader(this, 10+i*wave.padding, j*wave.padding - waveStart, this.ww-totWidth-20, 20, wave.height-j, 1, 1, 1);
                    this.invaders.push(invader);
                    // Adjust the invader's position and patrolX based on invertX
                    invader.pos.x+=invader.invertX-1; 
                    invader.patrolX=invader.invertX-1;
                }
            }
            
            //
            this.inWave=true;
            if(this.currWave<this.waves.length) this.currWave=ind+1;  // If the current wave is less than the length of the waves array then set the current wave to the next wave (this makes the last wave play on repeat)
        },
        pause:function(){    //pauses the game
            this.running=false; 
            this.drawer.pause();
            return false;
        },
        resume:function(){ //resumes the game
            this.running=true;
            this.lastTick=Date.now(); 
            this.drawer.resume();
            this.tick();
        },
        gameOver:function(){ //ends the game
            this.currWave=0; // resets wave counter to 0
            this.pause(); // pauses the game
            this.player=new Player(this); // creates a new player
            this.invaders=[]; // clears the invaders array
            this.bullets=[]; // clears the bullets array
            this.upgrades=[]; // clears the upgrades array
        }
    }
    
    function Keys(){ //creates a keys object for controlling the game
        this.left=false;
        this.up=false;
        this.right=false;
        this.down=false;
        this.space=false;
        this.pause=false;
    }
    Keys.prototype={ //uses a parse function to parse the key code to a string
        parse:function(code){
            switch(code){
                case 37:return 'left';
                case 38:return 'up';
                case 39:return 'right';
                case 40:return 'down';
                case 32:return 'space';
                case 80:return 'pause';
            }
        },
        unPress:function(key){  //function to reset key once it is unpressed
            var value=this.parse(key.keyCode); //parses the key code
            this[value]=false;  //sets the value to false
        },
        press:function(key){  //function to set key to true once it is pressed
            var value=this.parse(key.keyCode); //parses the key code
            this[value]=true; //sets the value to true
            
            if(value==='pause'){ //if the value is pause then pause the game
                game.running?game.pause():game.resume(); //if the game is running then pause it else resume it
            }
        }
    }
    
    //creates a drawer object to draw the game
    //this object will be the size of the browser window when the game first loads
    function Drawer(canvasId, game){    
        this.canvas=document.getElementById(canvasId);  
        this.canvas.width=game.ww;  //sets the canvas width to the game width
        this.canvas.height=game.hh; //sets the canvas height to the game height
        
        this.ctx=this.canvas.getContext('2d'); //sets the context for the canvas to 2d
        this.ctx.font='20px Verdana'; 
        
        this.colors=['gray', 'red', 'orange', 'yellow', 'green', 'blue', 'violet']; // creats a list of colors for the invaders
    };
    Drawer.prototype={
        draw:function(){ //draws the game
            this.ctx.fillStyle='rgba(0, 0, 0, 0.4)'; //sets the fill style to black with 0.4 opacity 
            this.ctx.fillRect(0, 0, game.ww, game.hh); //fills the canvas
            
            //draws the invaders
            for(var i=0; i<game.invaders.length; ++i){ //loops through the invaders
                this.ctx.fillStyle=this.colors[game.invaders[i].health%this.colors.length]; //sets the fill style to the color of the invaders health
                this.ctx.fillRect(game.invaders[i].pos.x, game.invaders[i].pos.y, game.invaders[i].size.w, game.invaders[i].size.h); //fills the invader
            }
            
            //draws the upgrades
            this.ctx.fillStyle='lime'; //sets the fill style to lime
            for(var i=0; i<game.upgrades.length; ++i){ //loops through the upgrades
                this.ctx.fillText(game.upgrades[i].type, game.upgrades[i].pos.x+this.ctx.measureText(game.upgrades[i].type)/2, game.upgrades[i].pos.y); //draws the upgrade
            }
            
            //draws the player and bullets
            this.ctx.fillStyle='white';
            
            //draws the player
            this.ctx.fillRect(game.player.pos.x, game.player.pos.y, game.player.size.w, game.player.size.h);
            
            //draws the bullets
            for(var i=0; i<game.bullets.length; ++i){
                this.ctx.fillRect(game.bullets[i].pos.x, game.bullets[i].pos.y, game.bullets[i].size.w, game.bullets[i].size.h);
            }
            
            //draws the game info
            this.ctx.fillStyle='rgba(255, 255, 255, 0.2)';
            this.ctx.fillRect(20, 15, this.ctx.measureText('Invaders left: '+game.invaders.length).width+40, 120); //draws the game info background
            
            //draws the game info text
            this.ctx.fillStyle='white';
            
            //draws the game info text
            this.ctx.fillText('Wave '+game.currWave, 40, 40); 
            this.ctx.fillText('Invaders left: '+game.invaders.length, 40, 80);
            this.ctx.fillText('Health: '+game.player.health, 40, 120)
        },

        //draws the pause screen
        pause:function(){
            this.ctx.fillStyle='rgba(10, 40, 10, 0.4)'; 
            this.ctx.fillRect(0, 0, game.ww, game.hh);
            
            this.ctx.fillStyle='white';
            
            this.ctx.font='12px Verdana';
            this.ctx.fillText('P to resume', game.ww/2-this.ctx.measureText('P to resume').width, game.hh/2+5);
            
            this.ctx.font='20px Verdana';
            this.ctx.fillText('Paused', game.ww/2-this.ctx.measureText('Paused').width, game.hh/2 - 20);
        },
        resume:function(){ // redraws the game screen
            this.ctx.fillStyle='black';
            this.ctx.fillRect(0, 0, game.ww, game.hh);
        }
    }
    
    //creates a player object
    function Player(game){
        this.game=game;

        this.pos=new Vec(game.ww/2, game.hh-20); //sets the player position to the middle of the screen
        this.vel=new Vec(0, 0); //sets the player velocity to 0
        this.acc=new Vec(0, 0); //sets the player acceleration to 0
        
        this.size={w:20, h:20}; //sets the player size to 20x20
        
        this.acc.link(this.vel.link(this.pos)); //links the acceleration, velocity and position
        
        this.shootTime=0; //sets the shoot time to 0
        this.shootVel=100; //sets the shoot velocity to 100
        this.shootSpeed=1; //sets the shoot speed to 1
        
        this.bulletsCount=1;    //sets the bullet count to 1
        this.power=1;           //sets the power to 1
        this.pierce=1;          //sets the pierce to 1
        this.bulletSpeed=2;     //sets the bullet speed to 2
        
        this.health=3;      //sets the health to 3
    }
    Player.prototype={      
        update:function(){ //updates the player
            if(this.health<=0) game.gameOver(); //if the player health is less than or equal to 0 then end the game
            
            switch(checkBoundings(this)){   //checks the boundings of the player and takes action to prevent player to leave the screen
                case 'x':this.vel.x*=-1; break; //if the player is out of the x boundings then reverse the x velocity
                case 'y':this.vel.y*=-1; break; //if the player is out of the y boundings then reverse the y velocity
            }
            //checks the keys pressed and sets the acceleration and velocity of the player
            if(game.keys.left) this.acc.x-=0.1; //if the left arrow key is pressed then decrease the x acceleration by -0.1
            if(game.keys.right) this.acc.x+=0.1;    //if the right arrow key is pressed then increase the x acceleration by 0.1
            
            if(game.keys.down) this.acc.y+=0.1; //if the down arrow key is pressed then increase the y acceleration by 0.1
            if(game.keys.up) this.acc.y-=0.1;   //if the up arrow key is pressed then decrease the y acceleration by -0.1
            
            this.acc.x*=0.2;    //decreases the x acceleration by 0.2
            this.vel.x*=0.99;  //decreases the x velocity by 0.99
            
            this.acc.y*=0.2;    //decreases the y acceleration by 0.2
            this.vel.y*=0.99;   //decreases the y velocity by 0.99
            
            this.acc.update();  //updates the acceleration
            
            //checks if the player should shoot
            if(this.shootTime<=0){ 
                if(game.keys.space){    //if the space key is pressed then shoot
                    var section=Math.PI/(this.bulletsCount+1); //sets the section to PI divided by the bullet count plus 1
                    for(var i=1; i<=this.bulletsCount; ++i) game.bullets.push(new Bullet(this, 0, Math.cos(section*i)*this.bulletSpeed, Math.sin(Math.PI+section*i)*this.bulletSpeed, this.power, this.pierce));    //loops through the bullet count and adds a new bullet to the bullets array
                    this.shootTime=this.shootVel;   //sets the shoot time to the shoot velocity
                }
            }else this.shootTime-=this.shootSpeed;  //decreases the shoot time by the shoot speed
        }
    }
    function Invader(game, x, y, invertX, invertY, health, bulletCount, pierce, power){ //creates an invader object
        this.pos=new Vec(x, y); //sets the position of the invader
        this.vel=new Vec(1, 0); //sets the velocity of the invader
        
        this.size={w:10, h:10}; //sets the size of the invader
        
        this.vel.link(this.pos);    //links the velocity and position
        
        this.patrolX=0; //sets the patrol x to 0
        this.patrolY=0; //sets the patrol y to 0
        this.invertX=invertX;   //sets the invert x to the invert x
        this.invertY=invertY;   //sets the invert y to the invert y
        
        //resets variables
        this.dir=1; 
        this.health=health;
        this.bulletCount=bulletCount||1; 
        this.pierce=pierce||1;
        this.power=power||1;
    }
    
    Invader.prototype={
        update:function(){  //updates the invader
            if(this.health<=0) return game.invaders.splice(game.invaders.indexOf(this), 1); //if the invader health is less than or equal to 0 then remove the invader from the invaders array
            if(this.pos.y>game.hh) game.gameOver(); //if the invader is out of the screen then end the game
            
            this.patrolX+=this.vel.x;   //increases the patrol x by the x velocity
            this.patrolY+=this.vel.y;   //increases the patrol y by the y velocity
            
            if(this.patrolX>=this.invertX||this.patrolX<0){ //if the patrol x is greater than or equal to the invert x or less than 0 then reverse the direction
                this.vel.x=0;   //sets the x velocity to 0
                this.vel.y=1;   //sets the y velocity to 1
            }
            if(this.patrolY>=this.invertY){ //if the patrol y is greater than or equal to the invert y then reverse the direction
                this.dir*=-1;   //reverses the direction
                this.vel.x=this.dir;    //sets the x velocity to the direction
                this.vel.y=0;   //sets the y velocity to 0
                this.patrolY=0; //resets the patrol y to 0
            }
            
            this.vel.update();  //updates the velocity
        },

        //creates a shoot function
        shoot:function(){ 
            var section=Math.PI/(this.bulletCount+1); //sets the section to PI divided by the bullet count plus 1
            for(var i=1; i<=this.bulletCount; ++i){   //loops through the bullet count
                game.bullets.push(new Bullet(this, 1, Math.cos(section*i), Math.sin(section*i), this.power, this.pierce));  //adds a new bullet to the bullets array
            }
        }
    }//creates an upgrade object
    function Upgrade(parent){
        this.type=['shootSpeed', 'bulletsCount', 'power', 'bulletSpeed', 'pierce'][(Math.random()*5)|0];    //sets the type of the upgrade to a random type
        
        this.pos=new Vec(parent.pos.x, parent.pos.y); 
        this.vel=new Vec(0, 1);
        
        this.size={w:8, h:8};
        
        this.vel.link(this.pos);
    }
    Upgrade.prototype={
        update:function(){
            this.vel.update();
        },
        use:function(){
            game.upgrades.splice(game.upgrades.indexOf(this), 1);
        }
    }
    function Bullet(parent, isInvader, vx, vy, power, pierce){
        this.isInvader=isInvader;
        this.power=power;
        this.pierce=pierce;
        
        this.pos=new Vec(parent.pos.x+parent.size.w/2, parent.pos.y+parent.size.h/2);
        this.vel=new Vec(vx, vy);
        
        this.size={w:3, h:5};
        
        this.vel.link(this.pos);
    }
    Bullet.prototype={
        update:function(){
            if(this.pierce<=0) return game.bullets.splice(game.bullets.indexOf(this), 1); 
            
            this.vel.update();
            
            if(this.pos.outOfBoundings()) game.bullets.splice(game.bullets.indexOf(this), 1)
        }
    }
    
    function Vec(x, y){
        this.x=((x*100)|0)/100;
        this.y=((y*100)|0)/100;
        
        this.links=[];
    }
    Vec.prototype={
        updateVec:function(v2){
            v2.x+=this.x;
            v2.y+=this.y;
        },
        link:function(vec){
            this.links.push(vec);
            return this;
        },
        outOfBoundings:function(){
            if(this.x<0||this.x>game.ww) return 'x';
            if(this.y<0||this.y>game.hh) return 'y';
            return false;
        },
        update:function(){
            for(var i=0; i<this.links.length; ++i){
                this.updateVec(this.links[i]);
                this.links[i].update();
            }
        }
    }
    function checkBoundings(b){
        if(b.pos.x<0||b.pos.x+b.size.w>game.ww) return 'x';
        if(b.pos.y<0||b.pos.y+b.size.h>game.hh) return 'y';
        return false;
    }
    function checkCollision(b1, b2){
        return !(b1.pos.x+b1.size.w<b2.pos.x||
                 b1.pos.y+b1.size.h<b2.pos.y||
                 b1.pos.y>b2.pos.y+b2.size.h||
                 b1.pos.x>b2.pos.x+b2.size.w)
    }
})()