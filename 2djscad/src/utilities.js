// ===============================================
// Constants
// ===============================================

const PIXELS_PER_MM = 15;
const GRID_SIZE = PIXELS_PER_MM; // Each grid square is 1mm
const ZOOM_SENSITIVITY = 0.001;
const CLOSE_LOOP_THRESHOLD = 15;
const HOVER_TOLERANCE = 10;
const POINT_HOVER_RADIUS = 5;
const RECTANGLE_HANDLE_RADIUS = 5;
const DIMENSION_OFFSET = 20;
const SNAP_RADIUS = 10; // Radius for snapping to points

// ===============================================
// Coordinate System and Drawing Helpers
// ===============================================

function getCanvasCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    const canvasX = (mouseX - panX) / scale;
    const canvasY = (mouseY - panY) / scale;
    return { x: canvasX, y: canvasY };
}

function getScreenCoordinates(x, y) {
    const screenX = (x * scale) + panX;
    const screenY = (y * scale) + panY;
    return { x: screenX, y: screenY };
}

function snapToGrid(coord) {
    return Math.round(coord / GRID_SIZE) * GRID_SIZE;
}

function getDistance(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

function pixelsToMm(pixels) {
    return pixels / PIXELS_PER_MM;
}

function mmToPixels(mm) {
    return mm * PIXELS_PER_MM;
}

function normalizeAngle(angle) {
    return (angle + 2 * Math.PI) % (2 * Math.PI);
}

// ===============================================
// History Management Functions
// ===============================================

function saveState() {
    const state = {
        polygons: JSON.parse(JSON.stringify(polygons)),
        circles: JSON.parse(JSON.stringify(circles)),
        rectangles: JSON.parse(JSON.stringify(rectangles)),
        dimensions: JSON.parse(JSON.stringify(dimensions)),
        constraints: JSON.parse(JSON.stringify(constraints)),
        arcs: JSON.parse(JSON.stringify(arcs)),
        ellipses: JSON.parse(JSON.stringify(ellipses)),
        splines: JSON.parse(JSON.stringify(splines)),
        slots: JSON.parse(JSON.stringify(slots)),
        texts: JSON.parse(JSON.stringify(texts)),
    };
    undoStack.push(state);
    redoStack = [];
    updateUndoRedoButtons();
}

function restoreState(state) {
    polygons = state.polygons;
    circles = state.circles;
    rectangles = state.rectangles;
    dimensions = state.dimensions;
    constraints = state.constraints;
    arcs = state.arcs;
    ellipses = state.ellipses;
    splines = state.splines;
    slots = state.slots;
    texts = state.texts;

    selectedElement = null;
    hoveredElement = null;
    applyConstraints();
    draw();
    updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
    undoButton.disabled = undoStack.length <= 1;
    redoButton.disabled = redoStack.length === 0;
}

function undo() {
    if (undoStack.length > 1) {
        const undoneState = undoStack.pop();
        redoStack.push(undoneState);
        const previousState = undoStack[undoStack.length - 1];
        restoreState(previousState);
    }
}

function redo() {
    if (redoStack.length > 0) {
        const redoneState = redoStack.pop();
        undoStack.push(redoneState);
        restoreState(redoneState);
    }
}

// ===============================================
// Collision/Hover/Snap Detection Functions
// ===============================================

function getDistanceFromLineSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return Math.sqrt(Math.pow(px - x1, 2) + Math.pow(py - y1, 2));
    let t = ((px - x1) * dx + (py - y1) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    const projectionX = x1 + t * dx;
    const projectionY = y1 + t * dy;
    return Math.sqrt(Math.pow(px - projectionX, 2) + Math.pow(py - projectionY, 2));
}

function isMouseOverPolygon(x, y) {
    for (const polygon of polygons) {
        for (const line of polygon.lines) {
            if (line.type === 'arc') {
                 const dist = getDistance({x,y}, {x:line.cx, y:line.cy});
                 if(Math.abs(dist - line.radius) < HOVER_TOLERANCE / scale) return polygon;
            } else {
                if (getDistanceFromLineSegment(x, y, line.x1, line.y1, line.x2, line.y2) < HOVER_TOLERANCE / scale) return polygon;
            }
        }
    }
    return null;
}

function getPolylineSegmentAt(x, y) {
    for (const polygon of polygons) {
        for (let i = 0; i < polygon.lines.length; i++) {
            const line = polygon.lines[i];
             if (line.type === 'arc') {
                 const dist = getDistance({x,y}, {x:line.cx, y:line.cy});
                 if(Math.abs(dist - line.radius) < HOVER_TOLERANCE / scale) {
                     return { polygonId: polygon.id, lineIndex: i, type: 'arc' };
                 }
            } else {
                if (getDistanceFromLineSegment(x, y, line.x1, line.y1, line.x2, line.y2) < HOVER_TOLERANCE / scale) {
                    return { polygonId: polygon.id, lineIndex: i, x1: line.x1, y1: line.y1, x2: line.x2, y2: line.y2, type: 'line' };
                }
            }
        }
    }
    return null;
}

function getRectangleSideAt(x, y) {
    for (const rect of rectangles) {
         const sides = [
            { name: 'top', x1: rect.x, y1: rect.y, x2: rect.x + rect.width, y2: rect.y },
            { name: 'right', x1: rect.x + rect.width, y1: rect.y, x2: rect.x + rect.width, y2: rect.y + rect.height },
            { name: 'bottom', x1: rect.x + rect.width, y1: rect.y + rect.height, x2: rect.x, y2: rect.y + rect.height },
            { name: 'left', x1: rect.x, y1: rect.y + rect.height, x2: rect.x, y2: rect.y }
         ];
         for (const side of sides) {
             if (getDistanceFromLineSegment(x, y, side.x1, side.y1, side.x2, side.y2) < HOVER_TOLERANCE / scale) {
                 return { rectangleId: rect.id, side: side.name };
             }
         }
    }
    return null;
}

function isMouseOverCircle(x, y) {
    for (const circle of circles) {
        const dist = getDistance({x,y}, {x:circle.x, y:circle.y});
        if (Math.abs(dist - circle.radius) < HOVER_TOLERANCE / scale) return circle;
    }
    return null;
}

function isMouseOverArc(x, y) {
     for (const arc of arcs) {
        const dist = getDistance({x, y}, {x: arc.cx, y: arc.cy});
        if (Math.abs(dist - arc.radius) < HOVER_TOLERANCE / scale) {
            let angle = Math.atan2(y - arc.cy, x - arc.cx);
            let start = normalizeAngle(arc.startAngle);
            let end = normalizeAngle(arc.endAngle);
            angle = normalizeAngle(angle);

            if (start <= end) {
                if (angle >= start && angle <= end) return arc;
            } else { 
                if (angle >= start || angle <= end) return arc;
            }
        }
    }
    return null;
}

function isMouseOverEllipse(x, y) {
    for (const ellipse of ellipses) {
        const dx = x - ellipse.x;
        const dy = y - ellipse.y;
        if ((dx * dx) / (ellipse.radiusX * ellipse.radiusX) + (dy * dy) / (ellipse.radiusY * ellipse.radiusY) <= 1) {
            return ellipse;
        }
    }
    return null;
}

function isMouseOverSpline(x, y) {
    for (const spline of splines) {
        for (let i = 0; i < spline.points.length - 1; i++) {
            if (getDistanceFromLineSegment(x, y, spline.points[i].x, spline.points[i].y, spline.points[i+1].x, spline.points[i+1].y) < HOVER_TOLERANCE / scale) {
                return spline;
            }
        }
    }
    return null;
}

function isMouseOverRegularPolygon(x, y) {
    for (const polygon of regularPolygons) {
        // Calculate the actual maximum radius to a vertex for accurate hover detection.
        let vertexRadius = polygon.radius;
        if (polygon.inscribed === true) { // Inscribed (tangent) means vertices are further out
            vertexRadius = polygon.radius / Math.cos(Math.PI / polygon.sides);
        }
        
        const dist = getDistance({x, y}, {x: polygon.x, y: polygon.y});
        if (dist < vertexRadius + HOVER_TOLERANCE / scale) {
            return polygon;
        }
    }
    return null;
}

function getRegularPolygonSideAt(x, y) {
    for (const polygon of regularPolygons) {
        let vertexRadius = polygon.radius;
        if (polygon.inscribed === true) { // Inscribed (tangent) means vertices are further out
            vertexRadius = polygon.radius / Math.cos(Math.PI / polygon.sides);
        }

        let p1 = null, p2 = null;
        for (let i = 0; i <= polygon.sides; i++) {
            const angle = (i / polygon.sides) * 2 * Math.PI - Math.PI / 2;
            p2 = {
                x: polygon.x + vertexRadius * Math.cos(angle),
                y: polygon.y + vertexRadius * Math.sin(angle)
            };

            if (p1) { // If we have a previous point, we can form a side
                if (getDistanceFromLineSegment(x, y, p1.x, p1.y, p2.x, p2.y) < HOVER_TOLERANCE / scale) {
                    return {
                        type: 'edge',
                        shapeType: 'regularPolygon',
                        shapeId: polygon.id,
                        sideIndex: i - 1
                    };
                }
            }
            p1 = p2;
        }
    }
    return null;
}

function isMouseOverSlot(x, y) {
     for (const slot of slots) {
         // A simple bounding box check first for performance
         const minX = Math.min(slot.p1.x, slot.p2.x) - slot.radius;
         const maxX = Math.max(slot.p1.x, slot.p2.x) + slot.radius;
         const minY = Math.min(slot.p1.y, slot.p2.y) - slot.radius;
         const maxY = Math.max(slot.p1.y, slot.p2.y) + slot.radius;
         if (x < minX || x > maxX || y < minY || y > maxY) continue;
 
         const distToLine = getDistanceFromLineSegment(x, y, slot.p1.x, slot.p1.y, slot.p2.x, slot.p2.y);
         if (distToLine <= slot.radius + HOVER_TOLERANCE / scale) return slot;
     }
     return null;
}

function isMouseOverText(x, y) {
    // This function requires the canvas context `ctx` to measure text.
    // It's a bit of a dependency leak, but necessary for accurate hit-testing.
    for (const textObj of texts) {
        let fontStyle = '';
        if (textObj.italic) fontStyle += 'italic ';
        if (textObj.bold) fontStyle += 'bold ';
        ctx.font = `${fontStyle}${textObj.size / scale}px ${textObj.font}`;

        const lines = textObj.content.split('\n');
        const lineHeight = textObj.size / scale;
        const totalHeight = lines.length * lineHeight;
        const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width)) || 0;

        let textX = textObj.x;
        if (textObj.align === 'center') {
            textX -= maxWidth / 2;
        } else if (textObj.align === 'right') {
            textX -= maxWidth;
        }

        if (x >= textX && x <= textX + maxWidth && y >= textObj.y && y <= textObj.y + totalHeight) {
            return textObj;
        }
    }
    return null;
}

function isMouseOverRectangle(x, y) {
    for (const rect of rectangles) {
        if (x > rect.x && x < rect.x + rect.width && y > rect.y && y < rect.y + rect.height) return rect;
    }
    return null;
}

function isMouseOverDimension(x, y) {
    for (const dim of dimensions) {
        const dimData = getDimensionDrawingData(dim);
        if (!dimData) continue;
         if (dimData.type === 'angle') {
            const distFromCenter = getDistance(dimData.p1, { x, y });
            // Check if mouse is near the dimension arc
            if (Math.abs(distFromCenter - dim.offset) < HOVER_TOLERANCE / scale) {
                let angle = normalizeAngle(Math.atan2(y - dimData.p1.y, x - dimData.p1.x));
                let start = normalizeAngle(dimData.startAngle);
                let end = normalizeAngle(dimData.endAngle);
                // Check if the angle of the mouse is within the start and end angles of the dimension arc
                if (start > end) { // Handle angle wrap around 0/360
                    if (angle >= start || angle <= end) return dim;
                }
                if (angle >= start && angle <= end) return dim;
            }
        } else if (dimData.type === 'diameter') {
            const leaderLength = 40 / scale;
            const cosA = Math.cos(dimData.angle);
            const sinA = Math.sin(dimData.angle);
            const startX = dimData.midX + cosA * (dimData.value / 2);
            const startY = dimData.midY + sinA * (dimData.value / 2);
            const breakX = startX + cosA * leaderLength;
            const breakY = startY + sinA * leaderLength;
            
            const text = `Ø${pixelsToMm(dimData.value).toFixed(2)}`;
            const textLineLength = (ctx.measureText(text).width + 10 / scale);
            const isLeft = cosA < 0;
            const textLineX = isLeft ? breakX - textLineLength : breakX + textLineLength;

            // Check distance to the leader line (radial part)
            if (getDistanceFromLineSegment(x, y, startX, startY, breakX, breakY) < HOVER_TOLERANCE / scale) return dim;

            // Check distance to the horizontal part of the leader
            if (getDistanceFromLineSegment(x, y, breakX, breakY, textLineX, breakY) < HOVER_TOLERANCE / scale) return dim;
        } else {
            const dimLineAngle = dimData.angle;
            const cosA = Math.cos(dimLineAngle);
            const sinA = Math.sin(dimLineAngle);
            const p1 = { x: dimData.midX - cosA * dimData.value / 2, y: dimData.midY - sinA * dimData.value / 2 };
            const p2 = { x: dimData.midX + cosA * dimData.value / 2, y: dimData.midY + sinA * dimData.value / 2 };
            if (getDistanceFromLineSegment(x, y, p1.x, p1.y, p2.x, p2.y) < HOVER_TOLERANCE / scale) return dim; 
        }
    }
    return null;
}

function findShapeAt(x, y) {
    const hoveredDimension = isMouseOverDimension(x, y);
    if (hoveredDimension) return { id: hoveredDimension.id, type: 'dimension' };
    
    const hoveredArc = isMouseOverArc(x, y);
    if (hoveredArc) return { id: hoveredArc.id, type: 'arc' };
    
    const hoveredSpline = isMouseOverSpline(x, y);
    if (hoveredSpline) return { id: hoveredSpline.id, type: 'spline' };
    
    const hoveredPolygon = isMouseOverPolygon(x, y);
    if (hoveredPolygon) return { id: hoveredPolygon.id, type: 'polygon' };
    
    const hoveredCircle = isMouseOverCircle(x, y);
    if (hoveredCircle) return { id: hoveredCircle.id, type: 'circle' };
    
    const hoveredEllipse = isMouseOverEllipse(x, y);
    if (hoveredEllipse) return { id: hoveredEllipse.id, type: 'ellipse' };

    const hoveredRegularPolygon = isMouseOverRegularPolygon(x, y);
    if (hoveredRegularPolygon) return { id: hoveredRegularPolygon.id, type: 'regularPolygon' };

    const hoveredSlot = isMouseOverSlot(x, y);
    if (hoveredSlot) return { id: hoveredSlot.id, type: 'slot' };

    const hoveredText = isMouseOverText(x, y);
    if (hoveredText) return { id: hoveredText.id, type: 'text' };

    const hoveredRectangle = isMouseOverRectangle(x, y);
    if (hoveredRectangle) return { id: hoveredRectangle.id, type: 'rectangle' };

    return null;
}

function findShapeById(id, type) {
    switch (type) {
        case 'rectangle': return rectangles.find(r => r.id === id);
        case 'circle': return circles.find(c => c.id === id);
        case 'polygon': return polygons.find(p => p.id === id);
        case 'dimension': return dimensions.find(d => d.id === id);
        case 'arc': return arcs.find(a => a.id === id);
        case 'ellipse': return ellipses.find(e => e.id === id);
        case 'spline': return splines.find(s => s.id === id);
        case 'regularPolygon': return regularPolygons.find(p => p.id === id);
        case 'slot': return slots.find(s => s.id === id);
        case 'text': return texts.find(t => t.id === id);
        default: return null;
    }
}

function findSnapPoint(x, y) {
    let closestPoint = null;
    let minDistance = SNAP_RADIUS / scale;

    const checkPoint = (p) => {
        const dist = getDistance({x, y}, p);
        if (dist < minDistance) {
            minDistance = dist;
            closestPoint = p;
        }
    };

    polygons.forEach(p => {
        p.lines.forEach(l => {
            if (l.type !== 'arc') {
                checkPoint({x: l.x1, y: l.y1});
                checkPoint({x: l.x2, y: l.y2});
            }
        });
    });

    rectangles.forEach(r => {
        checkPoint({x: r.x, y: r.y});
        checkPoint({x: r.x + r.width, y: r.y});
        checkPoint({x: r.x, y: r.y + r.height});
        checkPoint({x: r.x + r.width, y: r.y + r.height});
    });

    circles.forEach(c => checkPoint({x: c.x, y: c.y}));
    arcs.forEach(a => checkPoint({x: a.cx, y: a.cy}));
    ellipses.forEach(e => checkPoint({x: e.x, y: e.y}));
    splines.forEach(s => s.points.forEach(p => checkPoint(p)));
    regularPolygons.forEach(p => checkPoint({x: p.x, y: p.y}));
    slots.forEach(s => { checkPoint(s.p1); checkPoint(s.p2); });
    texts.forEach(t => checkPoint({x: t.x, y: t.y}));

    return closestPoint;
}

function getGeometricElementAt(x, y) {
    // Priority 1: Points (vertices, centers)
    for (const p of polygons) {
        for (let i = 0; i < p.lines.length; i++) {
             if(p.lines[i].type !== 'arc') {
                if (getDistance({x, y}, {x: p.lines[i].x1, y: p.lines[i].y1}) < HOVER_TOLERANCE / scale) return { type: 'point', shapeType: 'polygon', shapeId: p.id, lineIndex: i, pointType: 'start' };
                if (getDistance({x, y}, {x: p.lines[i].x2, y: p.lines[i].y2}) < HOVER_TOLERANCE / scale) return { type: 'point', shapeType: 'polygon', shapeId: p.id, lineIndex: i, pointType: 'end' };
             }
        }
    }
    for (const r of rectangles) {
        const corners = [{x:r.x, y:r.y, corner:'topLeft'}, {x:r.x+r.width, y:r.y, corner:'topRight'}, {x:r.x, y:r.y+r.height, corner:'bottomLeft'}, {x:r.x+r.width, y:r.y+r.height, corner:'bottomRight'}];
        for (const corner of corners) {
            if (getDistance({x, y}, corner) < HOVER_TOLERANCE / scale) return { type: 'point', shapeType: 'rectangle', shapeId: r.id, corner: corner.corner };
        }
    }
    for (const c of circles) {
        if (getDistance({x, y}, {x: c.x, y: c.y}) < HOVER_TOLERANCE / scale) return { type: 'circle_center', shapeType: 'circle', shapeId: c.id };
    }
    for (const a of arcs) {
        const startPoint = { x: a.cx + a.radius * Math.cos(a.startAngle), y: a.cy + a.radius * Math.sin(a.startAngle) };
        if (getDistance({x, y}, startPoint) < HOVER_TOLERANCE / scale) return { type: 'point', shapeType: 'arc', shapeId: a.id, pointType: 'start' };
        
        const endPoint = { x: a.cx + a.radius * Math.cos(a.endAngle), y: a.cy + a.radius * Math.sin(a.endAngle) };
        if (getDistance({x, y}, endPoint) < HOVER_TOLERANCE / scale) return { type: 'point', shapeType: 'arc', shapeId: a.id, pointType: 'end' };

        if (getDistance({x, y}, {x: a.cx, y: a.cy}) < HOVER_TOLERANCE / scale) return { type: 'arc_center', shapeType: 'arc', shapeId: a.id };
    }

    // Add detection for arc defining points (p1, p2, p3)
    for (const a of arcs) {
        if (getDistance({x, y}, a.p1) < HOVER_TOLERANCE / scale) return { type: 'point', shapeType: 'arc', shapeId: a.id, pointType: 'start' };
        if (getDistance({x, y}, a.p2) < HOVER_TOLERANCE / scale) return { type: 'point', shapeType: 'arc', shapeId: a.id, pointType: 'end' };
        if (getDistance({x, y}, a.p3) < HOVER_TOLERANCE / scale) return { type: 'point', shapeType: 'arc', shapeId: a.id, pointType: 'mid' };
    }
    for (const e of ellipses) {
        if (getDistance({x, y}, {x: e.x, y: e.y}) < HOVER_TOLERANCE / scale) return { type: 'ellipse_center', shapeType: 'ellipse', shapeId: e.id };
    }
    for (const p of regularPolygons) {
        // Check center point
        if (getDistance({x, y}, {x: p.x, y: p.y}) < HOVER_TOLERANCE / scale) {
            return { type: 'regularPolygon_center', shapeType: 'regularPolygon', shapeId: p.id };
        }

        // Check vertices
        let vertexRadius = p.radius;
        if (p.inscribed === true) { // Inscribed (tangent) means vertices are further out
            vertexRadius = p.radius / Math.cos(Math.PI / p.sides);
        }

        for (let i = 0; i < p.sides; i++) {
            const angle = (i / p.sides) * 2 * Math.PI - Math.PI / 2;
            const vertex = {
                x: p.x + vertexRadius * Math.cos(angle),
                y: p.y + vertexRadius * Math.sin(angle)
            };
            if (getDistance({x, y}, vertex) < HOVER_TOLERANCE / scale) {
                return { type: 'point', shapeType: 'regularPolygon', shapeId: p.id, pointType: 'vertex', vertexIndex: i };
            }
        }
    }

    // Priority 2: Edges and Contours
    const regularPolygonSide = getRegularPolygonSideAt(x, y);
    if (regularPolygonSide) {
        // Override the whole-shape selection if an edge is closer
        selectedElement = regularPolygonSide;
        return regularPolygonSide;
    }

    const polylineSegment = getPolylineSegmentAt(x, y);
    if (polylineSegment) return { type: 'edge', shapeType: 'polygon', shapeId: polylineSegment.polygonId, lineIndex: polylineSegment.lineIndex };
    
    const rectangleSide = getRectangleSideAt(x, y);
    if (rectangleSide) return { type: 'edge', shapeType: 'rectangle', shapeId: rectangleSide.rectangleId, side: rectangleSide.side };

    const circleContour = isMouseOverCircle(x, y);
    if (circleContour) return { type: 'circle_contour', shapeType: 'circle', shapeId: circleContour.id };

    const arcContour = isMouseOverArc(x, y);
    if (arcContour) return { type: 'arc_contour', shapeType: 'arc', shapeId: arcContour.id };

    const ellipseContour = isMouseOverEllipse(x, y);
    if (ellipseContour) return { type: 'ellipse_contour', shapeType: 'ellipse', shapeId: ellipseContour.id };

    // Slot specific geometric elements (points and edges)
    for (const s of slots) {
        const angle = Math.atan2(s.p2.y - s.p1.y, s.p2.x - s.p1.x);
        const perpAngle = angle + Math.PI / 2;

        // Check center points
        if (getDistance({x, y}, s.p1) < HOVER_TOLERANCE / scale) return { type: 'point', shapeType: 'slot', shapeId: s.id, pointType: 'p1_center' };
        if (getDistance({x, y}, s.p2) < HOVER_TOLERANCE / scale) return { type: 'point', shapeType: 'slot', shapeId: s.id, pointType: 'p2_center' };

        // Define and check straight edges
        const p1_top = { x: s.p1.x + s.radius * Math.cos(perpAngle), y: s.p1.y + s.radius * Math.sin(perpAngle) };
        const p2_top = { x: s.p2.x + s.radius * Math.cos(perpAngle), y: s.p2.y + s.radius * Math.sin(perpAngle) };
        if (getDistanceFromLineSegment(x, y, p1_top.x, p1_top.y, p2_top.x, p2_top.y) < HOVER_TOLERANCE / scale) return { type: 'edge', shapeType: 'slot', shapeId: s.id, side: 'top' };

        const p1_bot = { x: s.p1.x - s.radius * Math.cos(perpAngle), y: s.p1.y - s.radius * Math.sin(perpAngle) };
        const p2_bot = { x: s.p2.x - s.radius * Math.cos(perpAngle), y: s.p2.y - s.radius * Math.sin(perpAngle) };
        if (getDistanceFromLineSegment(x, y, p1_bot.x, p1_bot.y, p2_bot.x, p2_bot.y) < HOVER_TOLERANCE / scale) return { type: 'edge', shapeType: 'slot', shapeId: s.id, side: 'bottom' };
        
        // Check tangency points
        if (getDistance({x, y}, p1_top) < HOVER_TOLERANCE / scale) return { type: 'point', shapeType: 'slot', shapeId: s.id, pointType: 'p1_top' };
        if (getDistance({x, y}, p1_bot) < HOVER_TOLERANCE / scale) return { type: 'point', shapeType: 'slot', shapeId: s.id, pointType: 'p1_bot' };
        if (getDistance({x, y}, p2_top) < HOVER_TOLERANCE / scale) return { type: 'point', shapeType: 'slot', shapeId: s.id, pointType: 'p2_top' };
        if (getDistance({x, y}, p2_bot) < HOVER_TOLERANCE / scale) return { type: 'point', shapeType: 'slot', shapeId: s.id, pointType: 'p2_bot' };

        // Check end caps (arcs)
        const distToP1 = getDistance({x, y}, s.p1);
        if (Math.abs(distToP1 - s.radius) < HOVER_TOLERANCE / scale) {
            const angleToMouse = Math.atan2(y - s.p1.y, x - s.p1.x);
            if (normalizeAngle(angleToMouse - perpAngle) <= Math.PI + 0.01) return { type: 'arc_contour', shapeType: 'slot', shapeId: s.id, end: 'p1' };
        }
        const distToP2 = getDistance({x, y}, s.p2);
        if (Math.abs(distToP2 - s.radius) < HOVER_TOLERANCE / scale) {
            const angleToMouse = Math.atan2(y - s.p2.y, x - s.p2.x);
            if (normalizeAngle(angleToMouse - (perpAngle + Math.PI)) <= Math.PI + 0.01) return { type: 'arc_contour', shapeType: 'slot', shapeId: s.id, end: 'p2' };
        }
    }
    return null;
}

function getClosestPointOnElement(point, elementInfo) {
    const shape = findShapeById(elementInfo.shapeId, elementInfo.shapeType);
    if (!shape) return null;

    if (elementInfo.type.includes('edge')) {
        const line = getLineFromElementInfo(elementInfo);
        if (line) {
            return getClosestPointOnLineSegment(point.x, point.y, line.x1, line.y1, line.x2, line.y2);
        }
    } else if (elementInfo.type.includes('contour')) {
        if (shape.type === 'circle') {
            const angle = Math.atan2(point.y - shape.y, point.x - shape.x);
            return { x: shape.x + Math.cos(angle) * shape.radius, y: shape.y + Math.sin(angle) * shape.radius };
        } else if (shape.type === 'arc') {
            const angle = Math.atan2(point.y - shape.cy, point.x - shape.cx);
            // Note: This doesn't clamp the point to the arc's segment, but for coincidence, it's usually what's desired.
            return { x: shape.cy + Math.cos(angle) * shape.radius, y: shape.cy + Math.sin(angle) * shape.radius };
        } else if (shape.type === 'ellipse') {
            const angle = Math.atan2(point.y - shape.y, point.x - shape.x);
            return { x: shape.x + Math.cos(angle) * shape.radiusX, y: shape.y + Math.sin(angle) * shape.radiusY };
        }
    }

    return null;
}

// ===============================================
// Deletion Logic
// ===============================================

function isSameGeometricElement(el1, el2) {
    if (!el1 || !el2) return false;
    // A quick and dirty way to check for deep equality of these simple objects
    return JSON.stringify(el1) === JSON.stringify(el2);
}

function deleteElement(element) {
    if (!element) return;
    switch(element.type) {
        case 'polygon': polygons = polygons.filter(p => p.id !== element.id); break;
        case 'circle': circles = circles.filter(c => c.id !== element.id); break;
        case 'rectangle': rectangles = rectangles.filter(r => r.id !== element.id); break;
        case 'dimension': dimensions = dimensions.filter(d => d.id !== element.id); break;
        case 'arc': arcs = arcs.filter(a => a.id !== element.id); break;
        case 'ellipse': ellipses = ellipses.filter(e => e.id !== element.id); break;
        case 'spline': splines = splines.filter(s => s.id !== element.id); break;
        case 'regularPolygon': regularPolygons = regularPolygons.filter(p => p.id !== element.id); break;
        case 'slot': slots = slots.filter(s => s.id !== element.id); break;
        case 'text': texts = texts.filter(t => t.id !== element.id); break;
    }
    selectedElement = null;
    saveState();
    // saveState(); // The caller of deleteElement should handle saving state
    // The caller of deleteElement should handle clearing selection and saving state
    draw();
}

// ===============================================
// General Helper Functions
// ===============================================

function isSameGeometricElement(el1, el2) {
    if (!el1 || !el2) return false;
    // A quick and dirty way to check for deep equality of these simple objects
    return JSON.stringify(el1) === JSON.stringify(el2);
}

function findLineIntersection(line1, line2, onSegment = true) {
    if (!line1 || !line2) return null;
    const { x1, y1, x2, y2 } = line1;
    const { x1: x3, y1: y3, x2: x4, y2: y4 } = line2;

    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (den === 0) return null;

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
    
    const intersectionPoint = { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };

    if (onSegment) {
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return intersectionPoint;
        }
        return null;
    }
    return intersectionPoint;
}

function getPointOnShapeBoundary(shape, angle) {
    if (shape.type === 'circle' || shape.type === 'arc') {
        const center = { x: shape.cx ?? shape.x, y: shape.cy ?? shape.y };
        return {
            x: center.x + shape.radius * Math.cos(angle),
            y: center.y + shape.radius * Math.sin(angle)
        };
    } else if (shape.type === 'ellipse') {
        const { x, y, radiusX, radiusY } = shape;
        const tanAngle = Math.tan(angle);
        const x_bound = (radiusX * radiusY) / Math.sqrt(radiusY * radiusY + radiusX * radiusX * tanAngle * tanAngle);
        let pointX = x + (Math.cos(angle) >= 0 ? x_bound : -x_bound);
        let pointY = y + (Math.sin(angle) >= 0 ? Math.abs(x_bound * tanAngle) : -Math.abs(x_bound * tanAngle));
        return { x: pointX, y: pointY };
    }
    return null;
}

function findClosestPointsBetweenEllipses(ellipse1, ellipse2) {
    let p1 = { x: ellipse1.x, y: ellipse1.y };
    let p2 = { x: ellipse2.x, y: ellipse2.y };

    // Iteratively find the closest points. 10 iterations is usually enough to converge.
    for (let i = 0; i < 10; i++) {
        const angle1 = Math.atan2(p2.y - ellipse1.y, p2.x - ellipse1.x);
        p1 = getPointOnShapeBoundary(ellipse1, angle1);

        const angle2 = Math.atan2(p1.y - ellipse2.y, p1.x - ellipse2.x);
        p2 = getPointOnShapeBoundary(ellipse2, angle2);
    }
    return { point1: p1, point2: p2 };
}

function findClosestPointsEllipseLine(ellipse, line) {
    let pointOnLine = { x: (line.x1 + line.x2) / 2, y: (line.y1 + line.y2) / 2 };
    let pointOnEllipse = { x: ellipse.x, y: ellipse.y };

    for (let i = 0; i < 10; i++) {
        // Given a point on the line, find the closest point on the ellipse
        const angleToLinePoint = Math.atan2(pointOnLine.y - ellipse.y, pointOnLine.x - ellipse.x);
        pointOnEllipse = getPointOnShapeBoundary(ellipse, angleToLinePoint);

        // Given the new point on the ellipse, find the closest point on the line
        pointOnLine = getClosestPointOnLineSegment(pointOnEllipse.x, pointOnEllipse.y, line.x1, line.y1, line.x2, line.y2);
    }
    return { pointOnEllipse, pointOnLine };
}

function getClosestPointOnEllipse(line, ellipse) {
    // This is a complex problem. We'll use an iterative approach.
    // Start with the center of the line segment.
    let closestPointOnLine = { x: (line.x1 + line.x2) / 2, y: (line.y1 + line.y2) / 2 };
    let closestPointOnEllipse;

    for (let i = 0; i < 5; i++) { // Iterate a few times to converge
        // Find the point on the ellipse boundary in the direction of the point on the line
        const angle = Math.atan2(closestPointOnLine.y - ellipse.y, closestPointOnLine.x - ellipse.x);
        const a = ellipse.radiusX;
        const b = ellipse.radiusY;
        const tan_t = Math.tan(angle);
        const x_e = (a * b) / Math.sqrt(b * b + a * a * tan_t * tan_t);
        
        closestPointOnEllipse = {
            x: ellipse.x + (Math.cos(angle) > 0 ? 1 : -1) * x_e,
            y: ellipse.y + (Math.cos(angle) > 0 ? 1 : -1) * x_e * tan_t
        };

        // Find the closest point on the line to this new ellipse point
        closestPointOnLine = getClosestPointOnLineSegment(closestPointOnEllipse.x, closestPointOnEllipse.y, line.x1, line.y1, line.x2, line.y2);
    }
    return closestPointOnEllipse;
}

function getPointFromElementInfo(elementInfo) {
    if (!elementInfo) return null;
    const shape = findShapeById(elementInfo.shapeId, elementInfo.shapeType);
    if (!shape) return null;

    switch (elementInfo.type) {
        case 'point':
            if (elementInfo.shapeType === 'polygon') {
                if (elementInfo.pointType === 'start') return { x: shape.lines[elementInfo.lineIndex].x1, y: shape.lines[elementInfo.lineIndex].y1 };
                else return { x: shape.lines[elementInfo.lineIndex].x2, y: shape.lines[elementInfo.lineIndex].y2 };
            }
            if (elementInfo.shapeType === 'rectangle') {
                if (elementInfo.corner === 'topLeft') return {x: shape.x, y: shape.y};
                if (elementInfo.corner === 'topRight') return {x: shape.x + shape.width, y: shape.y};
                if (elementInfo.corner === 'bottomLeft') return {x: shape.x, y: shape.y + shape.height};
                if (elementInfo.corner === 'bottomRight') return {x: shape.x + shape.width, y: shape.y + shape.height};
            }
            if (elementInfo.shapeType === 'arc') {
                // Return the actual defining points
                if (elementInfo.pointType === 'start') return shape.p1;
                if (elementInfo.pointType === 'end') return shape.p2;
                if (elementInfo.pointType === 'mid') return shape.p3;
            }
            if (elementInfo.shapeType === 'regularPolygon') {
                let vertexRadius = shape.radius;
                if (shape.inscribed === true) { // Inscribed (tangent)
                    vertexRadius = shape.radius / Math.cos(Math.PI / shape.sides);
                }
                const angle = (elementInfo.vertexIndex / shape.sides) * 2 * Math.PI - Math.PI / 2;
                return {
                    x: shape.x + vertexRadius * Math.cos(angle),
                    y: shape.y + vertexRadius * Math.sin(angle)
                };
            }
            if (elementInfo.shapeType === 'slot') {
                const s = shape;
                const angle = Math.atan2(s.p2.y - s.p1.y, s.p2.x - s.p1.x);
                const perpAngle = angle + Math.PI / 2;

                switch (elementInfo.pointType) {
                    case 'p1_center': return s.p1;
                    case 'p2_center': return s.p2;
                    case 'p1_top': return { x: s.p1.x + s.radius * Math.cos(perpAngle), y: s.p1.y + s.radius * Math.sin(perpAngle) };
                    case 'p1_bot': return { x: s.p1.x - s.radius * Math.cos(perpAngle), y: s.p1.y - s.radius * Math.sin(perpAngle) };
                    case 'p2_top': return { x: s.p2.x + s.radius * Math.cos(perpAngle), y: s.p2.y + s.radius * Math.sin(perpAngle) };
                    case 'p2_bot': return { x: s.p2.x - s.radius * Math.cos(perpAngle), y: s.p2.y - s.radius * Math.sin(perpAngle) };
                }
            }
            break;
        case 'circle_center':
            return { x: shape.x, y: shape.y };
        case 'arc_center':
            return { x: shape.cx, y: shape.cy };
        case 'ellipse_center':
            return { x: shape.x, y: shape.y };
        case 'regularPolygon_center':
            return { x: shape.x, y: shape.y };
    }
    return null;
}

function getLineFromElementInfo(elementInfo) {
    if (!elementInfo || elementInfo.type !== 'edge') return null;
    const shape = findShapeById(elementInfo.shapeId, elementInfo.shapeType);
    if (!shape) return null;

    if (elementInfo.shapeType === 'polygon') {
        return shape.lines[elementInfo.lineIndex];
    } else if (elementInfo.shapeType === 'rectangle') {
        const r = shape;
        const sides = [
            { name: 'top', x1: r.x, y1: r.y, x2: r.x + r.width, y2: r.y },
            { name: 'right', x1: r.x + r.width, y1: r.y, x2: r.x + r.width, y2: r.y + r.height },
            { name: 'bottom', x1: r.x + r.width, y1: r.y + r.height, x2: r.x, y2: r.y + r.height },
            { name: 'left', x1: r.x, y1: r.y + r.height, x2: r.x, y2: r.y }
        ];
        return sides.find(s => s.name === elementInfo.side);
    } else if (elementInfo.shapeType === 'regularPolygon') {
        let vertexRadius = shape.radius;
        if (shape.inscribed === true) { // Inscribed (tangent)
            vertexRadius = shape.radius / Math.cos(Math.PI / shape.sides);
        }
        const angle1 = (elementInfo.sideIndex / shape.sides) * 2 * Math.PI - Math.PI / 2;
        const angle2 = ((elementInfo.sideIndex + 1) / shape.sides) * 2 * Math.PI - Math.PI / 2;
        
        const p1 = { x: shape.x + vertexRadius * Math.cos(angle1), y: shape.y + vertexRadius * Math.sin(angle1) };
        const p2 = { x: shape.x + vertexRadius * Math.cos(angle2), y: shape.y + vertexRadius * Math.sin(angle2) };

        return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
    } else if (elementInfo.shapeType === 'slot') {
        const s = shape;
        const angle = Math.atan2(s.p2.y - s.p1.y, s.p2.x - s.p1.x);
        const perpAngle = angle + Math.PI / 2;
        if (elementInfo.side === 'top') {
            return { x1: s.p1.x + s.radius * Math.cos(perpAngle), y1: s.p1.y + s.radius * Math.sin(perpAngle), x2: s.p2.x + s.radius * Math.cos(perpAngle), y2: s.p2.y + s.radius * Math.sin(perpAngle) };
        } else if (elementInfo.side === 'bottom') {
            return { x1: s.p1.x - s.radius * Math.cos(perpAngle), y1: s.p1.y - s.radius * Math.sin(perpAngle), x2: s.p2.x - s.radius * Math.cos(perpAngle), y2: s.p2.y - s.radius * Math.sin(perpAngle) };
        }
    }
    return null;
}

function getArcFromElementInfo(elementInfo) {
    if (!elementInfo || !elementInfo.type.includes('arc')) return null;
    const shape = findShapeById(elementInfo.shapeId, elementInfo.shapeType);
    if (!shape) return null;

    if (elementInfo.shapeType === 'arc') {
        return { cx: shape.cx, cy: shape.cy, radius: shape.radius, startAngle: shape.startAngle, endAngle: shape.endAngle, anticlockwise: shape.anticlockwise };
    } else if (elementInfo.shapeType === 'slot') {
        const s = shape;
        const angle = Math.atan2(s.p2.y - s.p1.y, s.p2.x - s.p1.x);
        const perpAngle = angle + Math.PI / 2;

        if (elementInfo.end === 'p1') {
            return { cx: s.p1.x, cy: s.p1.y, radius: s.radius, startAngle: perpAngle, endAngle: perpAngle + Math.PI };
        } else if (elementInfo.end === 'p2') {
            return { cx: s.p2.x, cy: s.p2.y, radius: s.radius, startAngle: perpAngle + Math.PI, endAngle: perpAngle };
        }
    }

    return null;
}

function getClosestPointOnLineSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return { x: x1, y: y1 };
    let t = ((px - x1) * dx + (py - y1) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    return { x: x1 + t * dx, y: y1 + t * dy };
}

function safeEval(expression) {
    try {
        if (/^[\d\s()+\-*/.]+$/.test(expression)) {
            return new Function('return ' + expression)();
        }
        return null;
    } catch (e) {
        console.error("Invalid expression:", e);
        return null;
    }
}

function rotatePoint(point, center, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const nx = center.x + dx * cos - dy * sin;
    const ny = center.y + dx * sin + dy * cos;
    return { x: nx, y: ny };
}

function findLineCircleIntersections(line, circle) {
    const {x1, y1, x2, y2} = line;
    const {x: cx, y: cy, radius: r} = circle;
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    const A = dx * dx + dy * dy;
    const B = 2 * (dx * (x1 - cx) + dy * (y1 - cy));
    const C = (x1 - cx) * (x1 - cx) + (y1 - cy) * (y1 - cy) - r * r;
    
    const det = B * B - 4 * A * C;
    if (A <= 0.0000001 || det < 0) return [];

    const points = [];
    if (det === 0) {
        const t = -B / (2 * A);
        points.push({ x: x1 + t * dx, y: y1 + t * dy });
    } else {
        const t1 = (-B + Math.sqrt(det)) / (2 * A);
        const t2 = (-B - Math.sqrt(det)) / (2 * A);
        points.push({ x: x1 + t1 * dx, y: y1 + t1 * dy });
        points.push({ x: x1 + t2 * dx, y: y1 + t2 * dy });
    }
    return points;
}

function findCircleCircleIntersections(c1, c2) {
    const {x: x1, y: y1, radius: r1} = c1;
    const {x: x2, y: y2, radius: r2} = c2;

    const d = getDistance({x:x1, y:y1}, {x:x2, y:y2});
    if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) return [];

    const a = (r1*r1 - r2*r2 + d*d) / (2*d);
    const h = Math.sqrt(r1*r1 - a*a);

    const x_mid = x1 + a * (x2 - x1) / d;
    const y_mid = y1 + a * (y2 - y1) / d;

    const points = [];
    points.push({
        x: x_mid + h * (y2 - y1) / d,
        y: y_mid - h * (x2 - x1) / d
    });

    if (h > 0) {
        points.push({
            x: x_mid - h * (y2 - y1) / d,
            y: y_mid + h * (x2 - x1) / d
        });
    }
    return points;
}

function isPointOnLineSegment(p, a, b, tolerance = 0.1) {
    const distAP = getDistance(a, p);
    const distPB = getDistance(p, b);
    const distAB = getDistance(a, b);
    return Math.abs(distAP + distPB - distAB) < tolerance;
}

function isPointOnArc(p, arc, tolerance = 0.1) {
    if (Math.abs(getDistance(p, {x: arc.cx, y: arc.cy}) - arc.radius) > tolerance) {
        return false;
    }
    let angle = normalizeAngle(Math.atan2(p.y - arc.cy, p.x - arc.cx));
    let start = normalizeAngle(arc.startAngle);
    let end = normalizeAngle(arc.endAngle);

    if (arc.clockwise) {
        if (start < end) start += 2 * Math.PI;
        return angle <= start && angle >= end;
    } else {
        if (start > end) end += 2 * Math.PI;
        return angle >= start && angle <= end;
    }
}

function calculateArcFromThreePoints(p1, p2, p3, newRadius = null) {
    const x1 = p1.x, y1 = p1.y;
    const x2 = p2.x, y2 = p2.y;
    let x3 = p3.x, y3 = p3.y;

    if (newRadius !== null) {
        // If a new radius is provided, find a new center and p3.
        const mid = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
        const d_sq = Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);
        
        const h_sq = newRadius * newRadius - d_sq / 4;
        if (h_sq < 0) {
            console.warn("Arc not possible with the given radius (too small).");
            return null;
        }
        const h = Math.sqrt(h_sq);

        const perp_vec = { x: -(y2 - y1), y: (x2 - x1) };
        const len_perp = Math.sqrt(perp_vec.x * perp_vec.x + perp_vec.y * perp_vec.y);
        if (len_perp < 1e-6) return null; // p1 and p2 are the same
        
        const perp_unit_vec = { x: perp_vec.x / len_perp, y: perp_vec.y / len_perp };

        // Get the original arc parameters to determine which side the center should be on.
        const oldArcParams = calculateArcFromThreePoints(p1, p2, p3);
        if (!oldArcParams) return null;

        // Determine the "side" for the new center. This is the crucial fix.
        // We use a cross product of the vector from the chord midpoint to the old center
        // and the perpendicular vector of the chord. This gives a stable sign (+1 or -1)
        // indicating which side of the chord the center lies on.
        const old_center_vec = { x: oldArcParams.x - mid.x, y: oldArcParams.y - mid.y };
        const side = Math.sign(old_center_vec.x * perp_unit_vec.x + old_center_vec.y * perp_unit_vec.y) || 1;

        const cx = mid.x + side * h * perp_unit_vec.x;
        const cy = mid.y + side * h * perp_unit_vec.y;

        const startAngle = Math.atan2(y1 - cy, x1 - cx);
        const endAngle = Math.atan2(y2 - cy, x2 - cx);

        // To find the new p3, we need to determine the correct middle angle.
        // We check if the original arc was a major arc and adjust the mid-angle accordingly.
        const isMajorArc = !oldArcParams.anticlockwise === (normalizeAngle(oldArcParams.endAngle) > normalizeAngle(oldArcParams.startAngle));
        let midAngle = (startAngle + endAngle) / 2;
        if (isMajorArc) midAngle += Math.PI;

        const newP3 = { x: cx + newRadius * Math.cos(midAngle), y: cy + newRadius * Math.sin(midAngle) };

        return { x: cx, y: cy, radius: newRadius, startAngle, endAngle, anticlockwise: oldArcParams.anticlockwise, p3: newP3 };
    }
    // Check for collinearity using the area of the triangle
    const area = x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2);
    if (Math.abs(area) < 1e-6) {
        return null; // Points are collinear
    }

    // Calculate center of the circle (circumcenter)
    const d = 2 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2));
    const cx = ((x1*x1 + y1*y1) * (y2 - y3) + (x2*x2 + y2*y2) * (y3 - y1) + (x3*x3 + y3*y3) * (y1 - y2)) / d;
    const cy = ((x1*x1 + y1*y1) * (x3 - x2) + (x2*x2 + y2*y2) * (x1 - x3) + (x3*x3 + y3*y3) * (x2 - x1)) / d;

    const radius = Math.sqrt(Math.pow(x1 - cx, 2) + Math.pow(y1 - cy, 2));

    const startAngle = Math.atan2(y1 - cy, x1 - cx);
    const endAngle = Math.atan2(y2 - cy, x2 - cx);
    const middleAngle = Math.atan2(y3 - cy, x3 - cx);

    const n_start = normalizeAngle(startAngle);
    const n_end = normalizeAngle(endAngle);
    const n_middle = normalizeAngle(middleAngle);

    let p3_on_minor_ccw_arc;
    if (n_start < n_end) {
        p3_on_minor_ccw_arc = (n_middle > n_start && n_middle < n_end);
    } else { // Arc crosses the 0-radian line
        p3_on_minor_ccw_arc = (n_middle > n_start || n_middle < n_end);
    }
    
    const anticlockwise = !p3_on_minor_ccw_arc;

    return { x: cx, y: cy, radius, startAngle, endAngle, anticlockwise };
}