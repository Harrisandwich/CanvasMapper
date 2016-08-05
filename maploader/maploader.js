var CanvasLoader = function(canvas,json)
{
    this.canvas = canvas;
    this.canvasContext = canvas.getContext("2d");
    this.loader = new MapLoader();
    this.backgroundImage = {};
    //this.maps = loader.load(json);

    this.mouseDown = function()
    {
        /*
            this.maps.forEach(function(el,i)
            {
                if(el.checkCollision({x:event.clientX, y:event.clientY}))
                {
                    
                }
            });
        */
    }

    this.setCanvasDimensions = function(w,h)
    {
        canvas.width = w;
        canvas.height = h;
    }
    this.setBackground = function(imageID,imageX,imageY,width,height)
    {

        this.backgroundImage = {
            id:imageID,
            x:imageX,
            y:imageY,
            width:width,
            height:height,
        };
        this.setCanvasDimensions(width,height);
    }
    this.loadBackgroundImage = function(elementID)
    {

        var imgObj = new Image();
        var cLoader = this;
        imgObj.onload = function(){
            cLoader.setBackground(elementID,0,0,this.width,this.height);
            cLoader.drawBackground();
        }
        imgObj.src = $("#"+elementID).attr("src");
    }
    
    
    this.drawBackground = function()
    {
        var img = document.getElementById(this.backgroundImage.id);
        this.canvasContext.drawImage(img,this.backgroundImage.x,this.backgroundImage.y,this.backgroundImage.width,this.backgroundImage.height);
    }

    
};

var MapLoader = function(canv,path)
{

    this.canvas = canv;

    this.path = path;
    this.obj;

    this.load = function(data)
    {

        try{
            if(this.path)
            {
                try{
                    $.getJSON(data, function(json) {
                        this.obj = json; // this will show the info it in firebug console
                    });
                }
                catch(e)
                {
                    console.log("This is not a valid server file path. Are you running a server? If not, then use the json string function of the loader.");
                }
            }
            else
            {
                this.obj = JSON.parse(data); 
            }
            this.obj.polys.forEach(function(el,i)
            {
                el.clicked = false;
                
                el.checkCollison = function(mousePos,boundingBoxScale)
                {
                        
                    try{
                        
                        if(boundingBoxScale >= 0.6 && boundingBoxScale <=1)
                        {
                            var xDis = this.boundingBox.left.x - this.boundingBox.right.x;
                            var yDis = this.boundingBox.bottom.y - this.boundingBox.top.y; 
                            var xScalingFactor = (xDis - (xDis * boundingBoxScale));
                            var yScalingFactor = (yDis - (yDis * boundingBoxScale));
                            if(mousePos.x < (this.boundingBox.right.x - xScalingFactor) && mousePos.x > (this.boundingBox.left.x + xScalingFactor))
                            {
                                if(mousePos.y < (this.boundingBox.bottom.y - yScalingFactor)&& mousePos.y > (this.boundingBox.top.y  + yScalingFactor))
                                {
                                    return true;
                                }
                            }
                        }
                        else
                        {
                            console.log("Bounding box scale out of range. Please use a number between 0.6 and 1 inclusive");
                        }
                        
                    }
                    catch(e)
                    {
                        console.log("Failure checking collison. Did you load the right type of data?");
                    }

                    return false;
                };

                el.checkCollisionToScale = function(mousePos,boundingBoxScale,canvasScale)
                {
                    mousePos.x = mousePos.x / canvasScale;
                    mousePos.y = mousePos.y / canvasScale;

                    try{
                        
                        if(boundingBoxScale >= 0.6 && boundingBoxScale <=1)
                        {
                            var xDis = this.boundingBox.left.x - this.boundingBox.right.x;
                            var yDis = this.boundingBox.bottom.y - this.boundingBox.top.y; 
                            var xScalingFactor = (xDis - (xDis * boundingBoxScale));
                            var yScalingFactor = (yDis - (yDis * boundingBoxScale));
                            if(mousePos.x < (this.boundingBox.right.x - xScalingFactor) && mousePos.x > (this.boundingBox.left.x + xScalingFactor))
                            {
                                if(mousePos.y < (this.boundingBox.bottom.y - yScalingFactor)&& mousePos.y > (this.boundingBox.top.y  + yScalingFactor))
                                {
                                    return true;
                                }
                            }
                        }
                        else
                        {
                            console.log("Bounding box scale out of range. Please use a number between 0.6 and 1 inclusive");
                        }
                        
                    }
                    catch(e)
                    {
                        console.log("Failure checking collison. Did you load the right type of data?");
                    }

                    return false;
                }


                el.draw = function(color)
                {

                    canvasContext.fillStyle = color;
                    canvasContext.beginPath();
                    canvasContext.moveTo(el.points[0].x,el.points[0].y);
                    for(var p = 1; p < el.points.length; p++)
                    {
                        canvasContext.lineTo(el.points[p].x,el.points[p].y);
                    }
                    
                    canvasContext.closePath();
                    canvasContext.fill();

                    
                    
                };
            });


            return this.obj.polys

        }
        catch(e)
        {
            console.log("Something went wrong during load");
        }


    }

};