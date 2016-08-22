
var CanvasLoader = function(canvas,imageId)
{
    this.canvas = canvas;
    this.canvasContext = canvas.getContext("2d");
    this.imageReady = false
    this.backgroundImage = {
        id: imageId,
    };
    
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

    this.setCanvasDimensions = function(w,h,scale)
    {
        canvas.width = w;
        canvas.height = h;
        $("canvas").css("width", (canvas.width * scale) + "px");
        $("canvas").css("height", (canvas.height * scale) + "px");
    }
    this.setBackground = function(imageID,imageX,imageY,width,height,scale)
    {

        this.backgroundImage = {
            id:imageID,
            x:imageX,
            y:imageY,
            width:width,
            height:height,
        };
        this.setCanvasDimensions(width,height,scale);
    }
    this.loadBackgroundImage = function(elementID,scale,callback)
    {

        var imgObj = new Image();
        var cLoader = this;
        imgObj.src = $("#"+elementID).attr("src");
        return imgObj.onload = function(){
            cLoader.setBackground(elementID,0,0,this.width,this.height,scale);
            cLoader.drawBackground();

            callback();
        }
        
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
    this.canvasContext = this.canvas.getContext("2d");

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
                el.canvasContext = canv.getContext("2d");
                el.boundingScale = 1;
                el.checkCollision = function(mousePos,boundingBoxScale)
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
                    var mPos = {
                        x: mousePos.x / canvasScale,
                        y: mousePos.y / canvasScale,
                    } 
                    el.boundingScale = boundingBoxScale;
                    var bBoxPoints = el.boundingBox.points;
                    var bBox = el.boundingBox;
                    var xDis = bBox.left.x - bBox.right.x;
                    var yDis = bBox.top.y - bBox.bottom.y; 
                    var xScalingFactor = (xDis - (xDis * el.boundingScale));
                    var yScalingFactor = (yDis - (yDis * el.boundingScale));

                    var topLeft = {x:bBox.left.x - xScalingFactor, y:bBox.top.y - yScalingFactor};
                    var topRight = {x:bBox.right.x + xScalingFactor, y:bBox.top.y - yScalingFactor};
                    var bottomLeft = {x:bBox.left.x - xScalingFactor, y:bBox.bottom.y + yScalingFactor};
                    var bottomRight = {x:bBox.right.x + xScalingFactor, y:bBox.bottom.y + yScalingFactor};

                    try{
                        
                        if(el.boundingScale >= 0.6 && el.boundingScale <=1)
                        {
                            /*if(mousePos.x < topRight.x && mousePos.x > topLeft.x)
                            {
                                if(mousePos.y < bottomLeft.y && mousePos.y > topLeft.y )
                                {
                                    return true;
                                }
                            }*/

                            if(mPos.x < bBox.right.x && mPos.x > bBox.left.y)
                            {
                                if(mPos.y < bBox.bottom.y && mPos.y > bBox.top.y )
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


                el.draw = function(color,debug)
                {

                    this.canvasContext.fillStyle = color;
                    this.canvasContext.beginPath();
                    this.canvasContext.moveTo(el.points[0].x,el.points[0].y);
                    for(var p = 1; p < el.points.length; p++)
                    {
                        this.canvasContext.lineTo(el.points[p].x,el.points[p].y);
                    }
                    
                    this.canvasContext.closePath();
                    this.canvasContext.fill();

                    var boundingBoxScale = el.boundingScale;
                    var bBoxPoints = el.boundingBox.points;
                    var bBox = el.boundingBox;
                    var xDis = bBox.left.x - bBox.right.x;
                    var yDis = bBox.bottom.y - bBox.top.y; 
                    var xScalingFactor = (xDis - (xDis * boundingBoxScale));
                    var yScalingFactor = (yDis - (yDis * boundingBoxScale));
                    var verts = [];

                    var topLeft = {x:bBox.left.x - xScalingFactor, y:bBox.top.y + yScalingFactor};
                    var topRight = {x:bBox.right.x + xScalingFactor, y:bBox.top.y + yScalingFactor};
                    var bottomLeft = {x:bBox.left.x - xScalingFactor, y:bBox.bottom.y - yScalingFactor};
                    var bottomRight = {x:bBox.right.x + xScalingFactor, y:bBox.bottom.y - yScalingFactor};

                    verts.push(topLeft);
                    verts.push(topRight);
                    verts.push(bottomRight);
                    verts.push(bottomLeft);

                    if(debug)
                    {
                        var buffer = [];
                        
                        
                       
                        for (var i = 0; i < verts.length; i++)
                        {   
                            if((i+1) <= (verts.length - 1))
                            {
                                this.canvasContext.beginPath();
                                this.canvasContext.moveTo(verts[i].x,verts[i].y);
                                this.canvasContext.lineTo(verts[i+1].x,verts[i+1].y);
                                this.canvasContext.lineWidth = 1;
                                this.canvasContext.strokeStyle = "red";
                                this.canvasContext.stroke();
                            }
                            

                        };

                        this.canvasContext.beginPath();
                        this.canvasContext.moveTo(verts[verts.length - 1].x,verts[verts.length - 1].y);
                        this.canvasContext.lineTo(verts[0].x,verts[0].y);
                        this.canvasContext.lineWidth = 1;
                        this.canvasContext.strokeStyle = "red";
                        this.canvasContext.stroke();
                        
                    } 

                    
                    
                };
            }, this);


            return this.obj.polys

        }
        catch(e)
        {
            console.log("Something went wrong during load");
        }


    }

};