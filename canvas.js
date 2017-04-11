// Canvas decorations.  Based on code from https://codepen.io/techslides/pen/zowLd?css-preprocessor=none
// Adds ctx.getTransform() - returns an SVGMatrix
// Adds ctx.transformedPoint(x,y) - returns an SVGPoint
function trackTransforms(ctx){
	var svg = document.createElementNS("http://www.w3.org/2000/svg",'svg');
	var xform = svg.createSVGMatrix();
	ctx.getTransform = function(){ return xform; };

	var savedTransforms = [];
	var save = ctx.save;
	ctx.save = function(){
		 savedTransforms.push(xform.translate(0,0));
		 return save.call(ctx);
	};

	var restore = ctx.restore;
	ctx.restore = function(){
		xform = savedTransforms.pop();
		return restore.call(ctx);
	};

	var scale = ctx.scale;
	ctx.scale = function(sx,sy){
		xform = xform.scaleNonUniform(sx,sy);
		return scale.call(ctx,sx,sy);
	};

	var rotate = ctx.rotate;
	ctx.rotate = function(radians){
		 xform = xform.rotate(radians*180/Math.PI);
		 return rotate.call(ctx,radians);
	};

	var translate = ctx.translate;
	ctx.translate = function(dx,dy){
		 xform = xform.translate(dx,dy);
		 return translate.call(ctx,dx,dy);
	};

	var transform = ctx.transform;
	ctx.transform = function(a,b,c,d,e,f){
		 var m2 = svg.createSVGMatrix();
		 m2.a=a; m2.b=b; m2.c=c; m2.d=d; m2.e=e; m2.f=f;
		 xform = xform.multiply(m2);
		 return transform.call(ctx,a,b,c,d,e,f);
	};

	var setTransform = ctx.setTransform;
	ctx.setTransform = function(a,b,c,d,e,f){
		 xform.a = a;
		 xform.b = b;
		 xform.c = c;
		 xform.d = d;
		 xform.e = e;
		 xform.f = f;
		 return setTransform.call(ctx,a,b,c,d,e,f);
	};

	var resetTransform = ctx.resetTransform;
	ctx.resetTransform = function(){
		xform.a = 1;
		xform.b = 0;
		xform.c = 0;
		xform.d = 1;
		xform.e = 0;
		xform.f = 0;
		return resetTransform.call(ctx);
	};

	var pt  = svg.createSVGPoint();
	ctx.transformedPoint = function(x,y){
		 pt.x=x; pt.y=y;
		 var inverse = xform.inverse();
		 return pt.matrixTransform(inverse);
	}
}

function zoomPanContext(canvas,scaleFactor,redrawFn) {
	var ctx = canvas.getContext('2d');
	trackTransforms(ctx);

	var lastX=0, lastY=0;
	var dragStart;

	canvas.addEventListener('mousedown',function(evt){
		 document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
		 lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
		 lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
		 dragStart = ctx.transformedPoint(lastX,lastY);
	},false);

	canvas.addEventListener('mousemove',function(evt){
		lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
		lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
		if (dragStart){
			var pt = ctx.transformedPoint(lastX,lastY);
			ctx.translate(pt.x-dragStart.x,pt.y-dragStart.y);
			redrawFn(canvas,ctx);
		}
	},false);

	canvas.addEventListener('mouseup',function(evt){
		dragStart = null;
	},false);

	var zoom = function(clicks){
		var pt = ctx.transformedPoint(lastX,lastY);
		ctx.translate(pt.x,pt.y);
		var factor = Math.pow(scaleFactor,clicks);
		ctx.scale(factor,factor);
		ctx.translate(-pt.x,-pt.y);
		redrawFn(canvas,ctx);
	}

	var handleScroll = function(evt){
		var delta = evt.wheelDelta ? evt.wheelDelta/40 : evt.detail ? -evt.detail : 0;
		if (delta) zoom(delta);
		return evt.preventDefault() && false;
	};

	canvas.addEventListener('DOMMouseScroll',handleScroll,false);
	canvas.addEventListener('mousewheel',handleScroll,false);
	return ctx;
}

