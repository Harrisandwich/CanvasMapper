//Variables----------------------------------------------------------------------------------------------------------------------------------------

//For Canvas---------------------------------------------------------------------------------------------------------------------------------------
var SEC_IN_MILISECONDS = 1000;
var FPS =60;
var canvas;
var canvasContext;

//Program Specific---------------------------------------------------------------------------------------------------------------------------------
//const
const MAX_VERT = 4;

//arrays
var polys = [];
var drawBuffer = [];

//nums
var offsetWidth = 0;
var snapThresh = 10;
var hoveredPoly = -1;
var testMap;
var clickOffsetX = 0;
var clickOffsetY = 0;
var boundingBoxScale = 1;
var zoomLevel = 1;

//flags
var testDataLoaded = false;
var showBoundingBox = false;
var useAltBounds = false;
var drawing = false;
var saving = false;
var usingstamp = false;
var autoConfirm = false;

//objs
var drawTimer = null;
var image = null;
var stamp = null;
var loader = null;
var toolset = null;
var defaultTool = null;
var snapPoint ={x:0,y:0,size:0};
var mousePos = {x:0,y:0, size:0}
var imgObj = new Image();
var backgroundImage = {};


//Objects------------------------------------------------------------------------------------------------------------------------------------------
class ToolSet 
{
    constructor()
    {
        this.tools = [];
    }
}

class Tool
{
    constructor(id, path,callback, onActivate,group,tip)
    {
        this.id = id;
        this.action = callback;
        this.hoverAction = null;
        this.onActivate = onActivate;
        this.onDeactivate = null;
        this.enabled = true;
        this.active = false;
        this.iconPath = path;
        this.button = null;
        this.buttonGroup = group;
        this.tip = tip;
    }

    activate()
    {
        $(this.button).addClass("active");
        this.active = true;

        if(this.onActivate != null)
        {
            this.onActivate();
        }
        
    }

    deactivate()
    {
        $(this.button).removeClass("active");
        this.active = false;
        if(this.onDeactivate != null)
        {
            this.onDeactivate();
        }
    }

    enable()
    {
        $(this.button).prop('disabled', false);
        $(this.button).removeClass("disabled");
        this.enabled = true;
    }

    disable()
    {
        $(this.button).prop('disabled', true);
        $(this.button).addClass("disabled");
        this.enabled = false;
    }

}
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
    //replace below with tool actions 
    toolset.tools.forEach(function(tool,i,arr)
    {
        if(tool.active && tool.action != null)
        {
            tool.action();
        }
    });    
}

function mouseMove()
{

    toolset.tools.forEach(function(tool,i,arr)
    {
        if(tool.active && tool.hoverAction != null)
        {
            tool.hoverAction();
        }
    });
    
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
    
    drawing = false;
    saving = true;
    snapPoint ={x:0,y:0,size:0};
    showMessage("Drawing Complete!");
    if(!autoConfirm)
    {
        $(".prompt").show();
        drawBackground();
        drawLines();
    }
    else
    {
        savePoly();
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


        
        $("#img-buffer").html("<img onerror='onNotFound()' id='loadedImage' src='loader/image." + $(".img-choose-dropdown").val() + "' />");

        imgObj.onload = function(){
            console.log(this.width,this.height);
            setBackground("loadedImage",0,0,this.width,this.height);
            drawBackground();
            toolset.tools.forEach(function(el,i)
            {
                el.enable();
            });
            defaultTool.activate();

        }
        imgObj.src = "./loader/image."+$(".img-choose-dropdown").val();

        showMessage("Image Loaded. Drawing enabled.");
        $(".img-choose.section").hide();

        $(".btn.reset").show();
    }
    catch(e)
    {
        
    }
    
}

function onNotFound()
{
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
        "<div class='item' onmouseover='showPoly("+i+")' onmouseout='hidePolys()'><h4>Poly "+i+"</h4><button class='btn stamp' value='stamp' onclick='createStamp("+i+")'>Use as Stamp</button><button class='btn delete' value='No' onclick='removePoly("+i+")'>Delete</button></div>");
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

function createStamp(index)
{
    //get all points in polygon
    var offsetPoints = [];
    stamp = new Poly();

    //'zero' first point

    polys[index].points.forEach(function(el,i,arr)
    {
        //I need to get the distance between the first point in the array vs other points
        //ex [0].x - [i].x etc

        
        var tempPoint = 
        {
            x : el.x - arr[0].x,
            y : el.y - arr[0].y
        }

        stamp.points.push(tempPoint);
        
        
    });

    showMessage("Stamp created from Poly " + index);
}

function initTools()
{
    toolset = new ToolSet();
    var rowMax = 3;
    var rowNum = 0;
    //create tools
    //constructor(id, path,callback)
    var lineTool = new Tool("line","icons/line-icon.svg",lineAction,null,"draw","Draw straight lines");
    var stampTool = new Tool("stamp","icons/stamp-icon.svg",stampAction,null,"draw","Draw using a current polygon");
    var zoomOutTool = new Tool("zoomOut","icons/zoomOut-icon.svg",null,null,"display","Zoom out");
    var zoomInTool = new Tool("zoomIn","icons/zoomIn-icon.svg",null,null,"display","Zoom in");
    var boundingBoxTool = new Tool("showBounding","icons/bounding-icon.svg",null,null,"render", "Show polygon bounding box");
    var autoConfirmTool = new Tool("autoConfirm","icons/autoConfirm-icon.svg",null,null,"auto","Auto confirm completed polygons");

    zoomInTool.onActivate = function()
    {
        zoomInAction(this);
    }
    zoomOutTool.onActivate = function()
    {
        zoomOutAction(this);
    }
    boundingBoxTool.onActivate = function()
    {
        boundingBoxAction(true);
    };
    boundingBoxTool.onDeactivate = function()
    {
        boundingBoxAction(false);
    }
    lineTool.hoverAction = function()
    {
        lineHoverAction();
    }
    lineTool.onActivate = function()
    {
        lineOnActivate();
    }
    stampTool.onActivate = function()
    {
        stampOnActivate();
    }
    stampTool.hoverAction = function()
    {
        stampHoverAction();
    }

    autoConfirmTool.onActivate = function()
    {
        enableAutoConfirm();
    }

    autoConfirmTool.onDeactivate = function()
    {
        disableAutoConfirm();
    }

    toolset.tools.push(lineTool);
    toolset.tools.push(stampTool);
    toolset.tools.push(boundingBoxTool);
    toolset.tools.push(zoomOutTool);
    toolset.tools.push(zoomInTool);
    toolset.tools.push(autoConfirmTool);
    defaultTool = toolset.tools[0];

    $(".button-grid.tools").html("<div class='row-"+rowNum+"'></div>");
    toolset.tools.forEach(function(tool,i,arr)
    {
        $(".button-grid.tools .row-"+rowNum).append("<button onclick=\"activateTool('"+tool.id+"')\" id='"+tool.id+"' class='btn control toggle tooltip' ><span class='tooltiptext'>"+tool.tip+"</span><object style='pointer-events: none;' class='btn-icon "+tool.id+"' data='"+tool.iconPath+"' type='image/svg+xml'></object></button>");

      
        tool.button = $("#"+tool.id);
        if((i+1)%rowMax == 0)
        {
            rowNum++;
            $(".button-grid.tools").append("<div class='row-"+rowNum+"'></div>")
        }
        tool.disable();
        
    });
}

function activateTool(id)
{
    toolset.tools.forEach(function(el,i,arr)
    {
        if(el.id == id)
        {
            if(el.enabled && !el.active)
            {
                for(var t in arr)
                {
                    if(arr[t].buttonGroup == el.buttonGroup)
                    {
                        arr[t].deactivate();
                    }
                }
                
                el.activate();
                
            }
            else if (el.enabled && el.active)
            {
                el.deactivate();
            }
        }
    });
}
//Backbone------------------------------------------------------------------------------------------------------------------------------------------
function start()
{
    refreshList();
    loader = new MapLoader(false);
    initTools();
    clickOffsetY = canvas.width - $("canvas").css("width");
    clickOffsetX = canvas.height - $("canvas").css("height");
}

function restart()
{
    polys = [];
    drawBuffer = [];

    
    offsetWidth = 0;
    snapThresh = 10;
    hoveredPoly = -1;
    testMap;
    clickOffsetX = 0;
    clickOffsetY = 0;
    boundingBoxScale = 1;
    zoomLevel = 1;

    
    testDataLoaded = false;
    showBoundingBox = false;
    useAltBounds = false;
    drawing = false;
    saving = false;
    usingstamp = false;
    autoConfirm = false;
    
    drawTimer = null;
    image = null;
    stamp = null;
    loader = null;
    toolset = null;
    defaultTool = null;
    snapPoint ={x:0,y:0,size:0};
    mousePos = {x:0,y:0, size:0}
    imgObj = new Image();
    backgroundImage = {};

    $("canvas").css("width",$("canvas").attr("width") * zoomLevel);
    $("canvas").css("height",$("canvas").attr("height") * zoomLevel);
    $(".img-choose.section").show();
    $(".btn.load").hide();
    $(".btn.reset").hide();
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    showMessage("Canvas reset");
    start();
}
function mainLoop()
{
    drawScene();
}

function drawScene()
{
    drawBackground();
    if($("#line").hasClass("active"))
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
function increaseZoom()
{
    if((zoomLevel - 0.1) >= 0.1)
    {
        zoomLevel -= 0.1;
    }
}
function decreaseZoom()
{
    if((zoomLevel + 0.1) <= 2)
    {
        zoomLevel += 0.1;
    }
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

function downloadLoader()
{

    //encodeURIComponent(JSON.stringify(storageObj));
    var dlAnchorElem = document.getElementById('downloadAnchorElem');
    dlAnchorElem.setAttribute("href","maploader/maploader.js");
    dlAnchorElem.setAttribute("download", "maploader/maploader.js");
    dlAnchorElem.click();
}

function getRawJson()
{
    if(polys.length > 0)
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
    else
    {
        showMessage("No polygons for output");
    }

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


//Tool functions

function lineAction()
{
    var rect = canvas.getBoundingClientRect();
    var mouseXTransformed = event.clientX/ zoomLevel;
    var mouseYTransformed = event.clientY / zoomLevel;
    var clickPoint = {x:mouseXTransformed, y:mouseYTransformed }
    var line = {
            pointOne: {},
            pointTwo: {},
    };
    setMousePos(clickPoint);
    
    if(getDistance(snapPoint,mousePos) > (snapThresh / zoomLevel))
    {

        
        line.pointOne = clickPoint;
        line.pointTwo = mousePos;

        if(drawBuffer.length > 0)
        {
            drawBuffer[drawBuffer.length-1].pointTwo = clickPoint;
            
        }
        drawBuffer.push(line);
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

function stampAction()
{
    if(stamp != null )
    {
        if(!saving)
        {
            drawBuffer = [];
            var mouseXTransformed = event.clientX/ zoomLevel;
            var mouseYTransformed = event.clientY / zoomLevel;
            var mousePoint = {x:mouseXTransformed, y:mouseYTransformed};
            setMousePos(mousePoint);
            var stampGhost = new Poly();
            stamp.points.forEach(function(el,i,arr)
            {
                var point = {x:0,y:0}
                if(i == 0)
                {
                    point.x = mousePos.x;
                    point.y = mousePos.y;
                }
                else
                {
                    point.x = el.x + mousePos.x;
                    point.y = el.y + mousePos.y;
                }

                stampGhost.points.push(point);
            });
            stampGhost.points.forEach(function(el,i,arr)
            {
                var newLine = {
                        pointOne: {},
                        pointTwo: {},
                };
                newLine.pointOne = el;
                if(i+1 < arr.length)
                {
                    newLine.pointTwo = arr[i+1];
                }
                else if(i+1 == arr.length)
                {
                    drawBackground();
                    drawPoly(stampGhost);
                    endDrawing();
                }
                else
                {
                    newLine.pointTwo = arr[0];
                }
                
                drawBuffer.push(newLine);
                
            });
        }
    }
    else
    {
        showMessage("No stamp created");
    }
    
}

function zoomOutAction(button)
{
    //scale down the canvas container
    //move the container 
    increaseZoom();
    $("canvas").css("width",$("canvas").attr("width") * zoomLevel);
    $("canvas").css("height",$("canvas").attr("height") * zoomLevel);
    //$("#canvas-container").css("top", "0px");
    //$("#canvas-container").css("left", "0px");
    button.deactivate();
}

function zoomInAction(button)
{
    //scale up the canvas container
    //move  the container 
    decreaseZoom();
    $("canvas").css("width",$("canvas").attr("width") * zoomLevel);
    $("canvas").css("height",$("canvas").attr("height") * zoomLevel);
    //$("#canvas-container").css("top", "0px");
    //$("#canvas-container").css("left", "0px");
    button.deactivate();
}

function boundingBoxAction(isActive)
{

   
    toggleBoundingBox(isActive);
        
    
    
}

function lineOnActivate()
{
    drawBuffer = [];
    drawBackground();
}

function lineHoverAction()
{
    var mouseXTransformed = event.clientX/ zoomLevel;
    var mouseYTransformed = event.clientY / zoomLevel;
    var mousePoint = {x:mouseXTransformed, y:mouseYTransformed };
    setMousePos(mousePoint);
    
    if(drawBuffer.length > 0)
    {
        if(!saving)
        {
            snapPoint = {x: drawBuffer[0].pointOne.x, y: drawBuffer[0].pointOne.y, size: snapThresh};
            drawBuffer[drawBuffer.length-1].pointTwo = mousePos;
            highlightStartPoint();
            showMessage("Drawing in progress. Right click to cancel current drawing.");
            drawBackground();
            drawLines();
            highlightStartPoint();
        }
    }
}
function disableAutoConfirm()
{
    autoConfirm = false;
}
function enableAutoConfirm()
{
    autoConfirm = true;
}
function stampOnActivate()
{
    drawBuffer = [];
}
function stampHoverAction()
{
    if(stamp != null)
    {
        if(!saving)
        {
            var mouseXTransformed = event.clientX/ zoomLevel;
            var mouseYTransformed = event.clientY / zoomLevel;
            var mousePoint = {x:mouseXTransformed, y:mouseYTransformed};
            setMousePos(mousePoint);
            var stampGhost = new Poly();
            stamp.points.forEach(function(el,i,arr)
            {
                var point = {x:0,y:0}
                if(i == 0)
                {
                    point.x = mousePos.x;
                    point.y = mousePos.y;
                }
                else
                {
                    point.x = el.x + mousePos.x;
                    point.y = el.y + mousePos.y;
                }

                stampGhost.points.push(point);

                if((i+1) === arr.length) {
                  drawBackground();
                  drawPoly(stampGhost);
                }
            });
        }
    }
}

