//Variables----------------------------------------------------------------------------------------------------------------------------------------

//For Canvas---------------------------------------------------------------------------------------------------------------------------------------
var SEC_IN_MILISECONDS = 1000;
var FPS =60;
var canvas;
var canvasContext;

//Program Specific---------------------------------------------------------------------------------------------------------------------------------
const MAX_VERT = 4;

var drawTimer = null;
var image = null;
var polys = [];
var drawBuffer = [];
var mousePos = {x:0,y:0, size:0}
var offsetWidth = 0;
var imgObj = new Image();
var backgroundImage = {};
var snapThresh = 10;
var drawing = false;
var saving = false;
var snapPoint ={x:0,y:0,size:0};
var hoveredPoly = -1;
var showBoundingBox = false;
var useAltBounds = false;
var loader = null;
var testDataLoaded = false;
var testMap;

var clickOffsetX = 0;
var clickOffsetY = 0;

var boundingBoxScale = 1;

//Objects------------------------------------------------------------------------------------------------------------------------------------------

class Poly
{
    constructor()
    {
        //an array of points (x,y)
        this.points = [];
        
    }

    getBoundingBox()
    {
        //bounding box array
        var boundingBox = {
            points:[],
            top: null,
            bottom: null,
            left: null,
            right: null,
        };
        var tempPoints = [];
        var ind = 0;
        
        this.points.forEach(function(el,i){
                tempPoints.push(el);
            });
        boundingBox.top = {y: canvas.height};
        boundingBox.bottom = {y: 0};
        boundingBox.right = {x: 0};
        boundingBox.left = {x: canvas.width};


        //gets the points closest to the sides of the canvas
        tempPoints.forEach(function(el,i,arr)
        {
            if(el.y < boundingBox.top.y)
            {
                boundingBox.top = el;
                ind = i;
                
            }
        });

        tempPoints.splice(ind,1);

        tempPoints.forEach(function(el,i,arr)
        {
            if(el.y > boundingBox.bottom.y)
            {
                boundingBox.bottom = el;
                ind = i;
                
            }
        });
        tempPoints.splice(ind,1);
        tempPoints.forEach(function(el,i,arr)
        {
            if(el.x < boundingBox.left.x)
            {
                boundingBox.left = el;
                ind = i;
                
            }
        });
        tempPoints.splice(ind,1);
        tempPoints.forEach(function(el,i,arr)
        {
            if(el.x > boundingBox.right.x)
            {
                boundingBox.right = el;
                ind = i;
                
            }
        });
        
        var xDis = boundingBox.left.x - boundingBox.right.x;
        var yDis = boundingBox.bottom.y - boundingBox.top.y; 
        var xScalingFactor = (xDis - (xDis * boundingBoxScale));
        var yScalingFactor = (yDis - (yDis * boundingBoxScale));


        var topLeft = {x:boundingBox.left.x - xScalingFactor, y:boundingBox.top.y + yScalingFactor};
        var topRight = {x:boundingBox.right.x + xScalingFactor, y:boundingBox.top.y + yScalingFactor};
        var bottomLeft = {x:boundingBox.left.x - xScalingFactor, y:boundingBox.bottom.y - yScalingFactor};
        var bottomRight = {x:boundingBox.right.x + xScalingFactor, y:boundingBox.bottom.y - yScalingFactor};

        boundingBox.points.push(topLeft);
        boundingBox.points.push(topRight);
        boundingBox.points.push(bottomRight);
        boundingBox.points.push(bottomLeft);
        
        

        //tempPoints.splice(ind,1);

        //get the points closest to the top and bottom of the canvas

        //returns an array of four points
        return boundingBox
    }

    Jsonify()
    {
        var json = {
            poly: 
            {
                points:[],
                boundingBox:
                {
                    points:[],
                    top: null,
                    bottom: null,
                    left: null,
                    right: null,
                },
            },
        };

        this.points.forEach(function(el,i,arr)
        {
            json.poly.points.push(el);
        });
        var boundingBox = this.getBoundingBox();
        
        json.poly.boundingBox = boundingBox;
        
    

        return json.poly
    }

    Stringify()
    {
        var strJson = "";
        strJson = JSON.stringify(this.Jsonify());
        return strJson
    }
}







//Functions----------------------------------------------------------------------------------------------------------------------------------------

function mouseDown()
{
    //on click start the drawing process

    
    var rect = canvas.getBoundingClientRect();
    var clickPoint = {x:event.clientX, y:event.clientY}
    var line = {
            pointOne: {},
            pointTwo: {},
    };
    setMousePos(clickPoint);
    if(!drawing && !saving)
    {
        drawing = true;
        drawBuffer = [];

        if(drawTimer != null)
        {
            clearInterval(drawTimer);
        }
        drawTimer = setInterval(mainLoop,SEC_IN_MILISECONDS/FPS);
    }

    if(drawing)
    {
        showMessage("Drawing in progress. Right click to cancel current drawing.")
    

        if(getDistance(snapPoint,mousePos) > snapThresh)
        {

            drawing = false;
            line.pointOne = clickPoint;
            line.pointTwo = mousePos;

            if(drawBuffer.length > 0)
            {
                drawBuffer[drawBuffer.length-1].pointTwo = clickPoint;
                
            }
            drawBuffer.push(line);
            drawing = true;
            console.log(clickPoint.x);
            console.log(clickPoint.y);
        }
        else
        {
            if(drawBuffer.length >= MAX_VERT)
            {

                drawBuffer[drawBuffer.length-1].pointTwo = snapPoint;
                endDrawing();
            }
            else
            {
                showMessage("You need more points to complete the drawing!");
            }
        }
    }

    
    
}

function mouseMove()
{
    var rect = canvas.getBoundingClientRect();
    if(drawing)
    {
        snapPoint = {x: drawBuffer[0].pointOne.x, y: drawBuffer[0].pointOne.y, size: snapThresh};
        var mousePoint = {x:event.clientX, y:event.clientY};
        setMousePos(mousePoint);
        drawBuffer[drawBuffer.length-1].pointTwo = mousePos;
    }
    else
    {
        var mousePoint = {x:event.clientX - rect.left, y:event.clientY - rect.top};
        setMousePos(mousePoint);
        drawBackground();
        if(saving)
        {
            drawLines();
        }
        if(testDataLoaded)
        {
            testMap.forEach(function(el,i)
            {
                if(el.checkCollison(mousePos,boundingBoxScale))
                {

                    showMessage("Bounding box hit!");
                    el.draw("rgba(0,255,0,0.2)");
                }
                else
                {
                    showMessage("");
                    
                }
            });
        }
        
    }
}

function savePoly()
{
    var tempPoly = new Poly();

    drawBuffer.forEach(function(el,ind,ar)
    {
        
        tempPoly.points.push(el.pointOne);
    });
    
    tempPoly.points.push(drawBuffer[0].pointOne);
    addPoly(tempPoly);
    saving = false;
    
}
function endDrawing()
{
    //when the last point is placed, stop drawing. Prompt user to confirm
    if(drawTimer != null)
    {
        drawing = false;
        saving = true;
        snapPoint ={x:0,y:0,size:0};
        clearInterval(drawTimer);
        showMessage("Drawing Complete!");
        $(".prompt").show();
        drawBackground();
        drawLines();
    }
}
function cancelDrawing()
{
    //clear the current drawing in progress (right click?)
    $(".prompt").hide();
    showMessage("Drawing Cancelled.");
    event.preventDefault();
    drawing = false;
    drawBuffer = [];
    snapPoint ={x:0,y:0,size:0};
    if(drawTimer != null)
    {
        clearInterval(drawTimer);
        
    }
    drawBackground();
}



function highlightStartPoint()
{
    //when the start point is hovered over, it needs to be visible
    
    if(getDistance(snapPoint,mousePos) < snapThresh)
    {
        drawCircle(snapPoint.x, snapPoint.y, snapThresh,"rgba(255,255,0,0.5)");
    }
}

function setSnap(value)
{
    snapThresh = value;
    $("#snapValue").text(value);
}



function drawLines()
{
    drawBuffer.forEach(function(el,i,arr)
    {
        
        drawLine(el.pointOne,el.pointTwo,"yellow");
    });
}

function loadPreview()
{
    $(".thumb .img-container").html("<img onerror='onNotFound()'  id='previewImage' src='loader/image." + $(".img-choose-dropdown").val() + "' />");

    $(".btn.load").show();
    showMessage("Preview Loaded. Click load image to start drawing!");
}

function loadImage()
{
    try{


        if(drawTimer != null)
        {
            clearInterval(drawTimer);
        }
        $("#img-buffer").html("<img onerror='onNotFound()' id='loadedImage' src='loader/image." + $(".img-choose-dropdown").val() + "' />");

        imgObj.onload = function(){
            console.log(this.width,this.height);
            setBackground("loadedImage",0,0,this.width,this.height);
            drawBackground();
        }
        imgObj.src = "./loader/image."+$(".img-choose-dropdown").val();

        showMessage("Image Loaded. Drawing enabled.");
        drawTimer = setInterval(mainLoop, SEC_IN_MILISECONDS/FPS);
    }
    catch(e)
    {
        if(drawTimer != null)
        {
            clearInterval(drawTimer);
        }
    }
    
}

function onNotFound()
{
    if(drawTimer != null)
    {
        clearInterval(drawTimer);
    }
    showMessage("Image not found. Make sure the name of the image is 'image' and that you've chosen the correct file type.");
}

function setMousePos(point)
{
    mousePos.x = point.x;
    mousePos.y = point.y;
}

function addPoly(poly)
{
    try{
        polys.push(poly);
        $(".prompt").hide();
        cancelDrawing();
        refreshList();
        showMessage("Poly Added.");
    }
    catch(e)
    {
        showMessage("ERROR: Poly not added.");
    }
}

function removePoly(index)
{
    //delete a drawing from the list 
    try{
        polys.splice(index,1);
        showMessage("Poly Removed.");
        $(".prompt").hide();
        refreshList();
        hidePolys();
        
    }
    catch(e)
    {
        showMessage("ERROR: Something went wrong removing polygon.");
        refreshList();
    }
}

function showPoly(index)
{
    hoveredPoly = index;
    drawPoly(polys[index]);

    if(showBoundingBox)
    {
        drawBox(polys[index])
    }
}

function hidePolys()
{
    hoveredPoly = -1;
    drawBackground();
}

function refreshList()
{
    $(".list.container").html("");
    polys.forEach(function(el,i,arr)
    {
        $(".list.container").append(
        "<div class='item' onmouseover='showPoly("+i+")' onmouseout='hidePolys()'><h4>Poly "+i+"</h4><button class='btn delete' value='No' onclick='removePoly("+i+")'>Delete</button></div>");
    });
}

function toggleBoundingBox(val)
{
    showBoundingBox = val;

    if(val)
    {
        $("#boundingScaleControl").show();
    }
    else
    {
        $("#boundingScaleControl").hide();
    }
}

function toggleBoundingBoxAlt(val)
{
    showBoundingBox = val;
}
function setBoundingScale(val)
{
    boundingBoxScale = val;
    $("#boundScaleValue").text(val);
}
function drawBox(poly)
{
    var buffer = [];
    var bBox = poly.getBoundingBox().points;
    bBox.forEach(function(el,i,arr)
    {   
        if((i+1) <= (arr.length - 1))
        {
            drawLine(el,arr[i+1],"red");
        }
        

    });

    drawLine(bBox[bBox.length - 1],bBox[0],"red");
    
    
}

function testLoader()
{
    var storageObj = {

        polys: [],

    }; 

    polys.forEach(function(el,i)
    {
        storageObj.polys.push(el.Jsonify());
    });
    testMap = loader.load(JSON.stringify(storageObj));

    testDataLoaded = true;
    getRawJson();
}

function stopLoaderTest()
{
    testDataLoaded = false;

}

function collapseSection(sectionClass)
{
    $(".section-content").each(function(ind,el)
    {
        if($(el).hasClass(sectionClass))
        {
            if($(".section-collapse."+sectionClass).text() == "-")
            {
                $(el).hide();
                $(".section-collapse."+sectionClass).text("+");
            }
            else
            {
                $(el).show();
                $(".section-collapse."+sectionClass).text("-");
            }
            
        }
    });
}
//Backbone------------------------------------------------------------------------------------------------------------------------------------------
function start()
{
    refreshList();
    loader = new MapLoader(false);
    clickOffsetY = canvas.width - $("canvas").css("width");
    clickOffsetX = canvas.height - $("canvas").css("height");
}

function mainLoop()
{
    drawScene();
}

function drawScene()
{
    drawBackground();
    if(drawing)
    {
        drawLines();
        highlightStartPoint();
    }
}
function setCanvasDimensions(w,h)
{
    canvas.width = w;
    canvas.height = h;
}

function setBackground(imageID,imageX,imageY,width,height)
{
    backgroundImage = {
        id:imageID,
        x:imageX,
        y:imageY,
        width:width,
        height:height,
    };
    setCanvasDimensions(width,height);
}
function drawBackground()
{
    var img = document.getElementById(backgroundImage.id);
    canvasContext.drawImage(img,backgroundImage.x,backgroundImage.y,backgroundImage.width,backgroundImage.height);
}

function drawLine(pointOne,pointTwo,color)
{       
    canvasContext.beginPath();
    canvasContext.moveTo(pointOne.x,pointOne.y);
    canvasContext.lineTo(pointTwo.x,pointTwo.y);
    canvasContext.lineWidth = 1;
    canvasContext.strokeStyle = color;
    canvasContext.stroke();
}

function drawCircle(leftX, topY, diameter,fillColor)
{
    canvasContext.strokeStyle = fillColor;
    canvasContext.fillStyle = fillColor;
    canvasContext.beginPath();
    //draw arc
    canvasContext.arc(leftX,topY,diameter,0,Math.PI*2,true)
    canvasContext.fill();

}

function drawPoly(poly)
{
    var points = poly.points;
    canvasContext.fillStyle = "rgba(255,255,0,0.5)";
    canvasContext.beginPath();
    canvasContext.moveTo(points[0].x,points[0].y);

    for(var p = 1; p < points.length; p++)
    {
        canvasContext.lineTo(points[p].x,points[p].y);
    }
    
    canvasContext.closePath();
    canvasContext.fill();
}

function getDistance(objectOne,objectTwo)
{
    var dx;
    var dy;

    dx = objectOne.x  - objectTwo.x;
    dy = objectOne.y  - objectTwo.y;
    
    var dis = Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2));

    dis -= objectOne.size;
    dis -= objectTwo.size;

    return dis;
}

function showMessage(msg)
{
    $(".message").text(msg);
    $(".message").show();
}


function downloadJson()
{


    var storageObj = {

        polys: [],

    }; 

    polys.forEach(function(el,i)
    {
        storageObj.polys.push(el.Jsonify());
    });


    //encodeURIComponent(JSON.stringify(storageObj));
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(storageObj));
    var dlAnchorElem = document.getElementById('downloadAnchorElem');
    dlAnchorElem.setAttribute("href",dataStr);
    dlAnchorElem.setAttribute("download", "map.json");
    dlAnchorElem.click();
}

function getRawJson()
{
    $("#jsonText").text("");
    var storageObj = {

        polys: [],

    }; 

    polys.forEach(function(el,i)
    {
        storageObj.polys.push(el.Jsonify());
    });

    $("#jsonText").text(JSON.stringify(storageObj));
    $("#testerButton").html("");
    $("#testerButton").append("<button id='load' class='export' target='_blank' onclick='testLoader()'><h3>Test Loader Collision</h3></button><button id='load' class='export' target='_blank' onclick='stopLoaderTest()'><h3>Stop Loader Test</h3></button>");
}


$(document).ready(function(){
    canvas = document.getElementsByTagName("canvas")[0];
    canvasContext = canvas.getContext('2d');
    $(".controls").css("left",window.innerWidth - $(".controls").width());
    $(".controls").css("top",0);
    //$(document).bind("mousedown", cutBranch);
    //$(document).bind("mousemove", highlightBranch);
    start();

    $("canvas").bind("mousedown",mouseDown);
    $("canvas").bind("mousemove",mouseMove);

    $("canvas").bind("contextmenu", cancelDrawing);

    
});

