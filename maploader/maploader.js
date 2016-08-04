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
                            //(100 - (100 * 0.8));
                            //(100 - 80)
                            //(20)

                            //(100 - (100 * 1));
                            //(100 - 100)
                            //(0)

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

}