// ===============================================
// Drawing Functions for Shapes
// ===============================================

function drawGrid() {
    if (isGridVisible) {
        // Calculate the visible world area based on current pan, zoom, and canvas size
        const worldViewLeft = -panX / scale;
        const worldViewRight = worldViewLeft + (canvas.width / scale);
        const worldViewTop = -panY / scale;
        const worldViewBottom = worldViewTop + (canvas.height / scale);

        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1 / scale;

        for (let i = Math.floor(worldViewLeft / GRID_SIZE) * GRID_SIZE; i <= worldViewRight; i += GRID_SIZE) {
            ctx.beginPath();
            ctx.moveTo(i, worldViewTop);
            ctx.lineTo(i, worldViewBottom);
            ctx.stroke();
        }
        for (let i = Math.floor(worldViewTop / GRID_SIZE) * GRID_SIZE; i <= worldViewBottom; i += GRID_SIZE) {
            ctx.beginPath();
            ctx.moveTo(worldViewLeft, i);
            ctx.lineTo(worldViewRight, i);
            ctx.stroke();
        }
    }
}

function drawPolygons() {
    polygons.forEach(polygon => {
        const isSelected = selectedElement && selectedElement.type === 'polygon' && selectedElement.id === polygon.id;
        const isHovered = hoveredElement && hoveredElement.type === 'polygon' && hoveredElement.id === polygon.id;

        let fillStyle = `rgba(209, 213, 219, 0.45)`;
        let strokeStyle = polygon.color || `rgb(34, 197, 94)`;

        if (isSelected) {
            strokeStyle = `rgb(22, 163, 74)`;
        } else if (isHovered) {
            strokeStyle = `rgb(52, 211, 153)`;
        }
        
        if (polygon.isClosed) {
            ctx.fillStyle = fillStyle;
            ctx.beginPath();
            polygon.lines.forEach(line => {
                 if (line.type === 'arc') {
                    ctx.arc(line.cx, line.cy, line.radius, line.startAngle, line.endAngle);
                } else {
                    ctx.lineTo(line.x1, line.y1);
                }
            });
            const lastLine = polygon.lines[polygon.lines.length-1];
            if(lastLine.type !== 'arc') ctx.lineTo(lastLine.x2, lastLine.y2);

            ctx.closePath();
            ctx.fill();
        }

        if (polygon.lineType === 'dashed') {
            ctx.setLineDash([5 / scale, 5 / scale]);
        } else if (polygon.lineType === 'construction') {
            ctx.setLineDash([12 / scale, 3 / scale, 4 / scale, 3 / scale]);
        } else {
            ctx.setLineDash([]);
        }

        polygon.lines.forEach(line => {
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = (polygon.lineWidth || 2) / scale;
            ctx.beginPath();
            if (line.type === 'arc') {
                 ctx.arc(line.cx, line.cy, line.radius, line.startAngle, line.endAngle, !line.clockwise);
            } else {
                ctx.moveTo(line.x1, line.y1);
                ctx.lineTo(line.x2, line.y2);
            }
            ctx.stroke();
        });
        
        ctx.setLineDash([]);

        if (isHovered || isSelected) {
            ctx.fillStyle = strokeStyle;
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = 2 / scale;
            polygon.lines.forEach(line => {
                if(line.type !== 'arc') {
                    ctx.beginPath();
                    ctx.arc(line.x1, line.y1, POINT_HOVER_RADIUS / scale, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.stroke();
                }
            });
            const lastLine = polygon.lines[polygon.lines.length - 1];
             if(lastLine.type !== 'arc') {
                ctx.beginPath();
                ctx.arc(lastLine.x2, lastLine.y2, POINT_HOVER_RADIUS / scale, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
            }
        }
    });

    if (currentPolygonLines) {
        ctx.strokeStyle = 'rgb(34, 197, 94)';
        ctx.lineWidth = 3 / scale;
        ctx.beginPath();
        ctx.moveTo(currentPolygonLines[0].x1, currentPolygonLines[0].y1);
        currentPolygonLines.forEach(line => ctx.lineTo(line.x2, line.y2));
        ctx.stroke();
        
        ctx.fillStyle = 'rgb(34, 197, 94)';
        ctx.strokeStyle = 'rgb(34, 197, 94)';
        ctx.lineWidth = 2 / scale;
        currentPolygonLines.forEach(line => {
            ctx.beginPath();
            ctx.arc(line.x1, line.y1, POINT_HOVER_RADIUS / scale, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        });
        const lastLine = currentPolygonLines[currentPolygonLines.length - 1];
        ctx.beginPath();
        ctx.arc(lastLine.x2, lastLine.y2, POINT_HOVER_RADIUS / scale, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    }
}

function drawCircles() {
    circles.forEach(circle => {
        const isSelected = selectedElement && selectedElement.type === 'circle' && selectedElement.id === circle.id;
        const isHovered = hoveredElement && hoveredElement.type === 'circle' && hoveredElement.id === circle.id;

        let fillStyle = circle.isConstruction ? 'transparent' : `rgba(209, 213, 219, 0.45)`;
        let strokeStyle = circle.color || `rgb(34, 197, 94)`;
        
        if (isSelected) {
            strokeStyle = `rgb(29, 78, 216)`; // A darker blue for selection
        } else if (isHovered && !isSelected) {
            strokeStyle = `rgb(52, 211, 153)`;
        }
        
        if (circle.lineType === 'dashed') {
            ctx.setLineDash([5 / scale, 5 / scale]);
        } else if (circle.lineType === 'construction') {
            ctx.setLineDash([12 / scale, 3 / scale, 4 / scale, 3 / scale]);
             // Set construction line style
            ctx.lineCap = 'round'; // Optional: Round the line endings
            // const phase = performance.now() * 0.01;  // Use a small multiple for slower animation
            // ctx.setLineDashOffset(phase); // Animate the dash offset

        } else {
            ctx.setLineDash([]);
        }

        ctx.fillStyle = fillStyle;
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = (circle.lineWidth || 2)  / scale;
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        ctx.setLineDash([]);
    });
}
        
function drawRectangles() {
    rectangles.forEach(rectangle => {
        const isSelected = selectedElement && selectedElement.type === 'rectangle' && selectedElement.id === rectangle.id;
        const isHovered = hoveredElement && hoveredElement.type === 'rectangle' && hoveredElement.id === rectangle.id;
        
        let fillStyle = `rgba(209, 213, 219, 0.45)`;
        let strokeStyle = rectangle.color || `rgb(34, 197, 94)`;
        
        if (isSelected) {
            strokeStyle = `rgb(22, 163, 74)`;
        } else if (isHovered) {
            strokeStyle = `rgb(52, 211, 153)`;
        }
        
        if (rectangle.lineType === 'dashed') {
            ctx.setLineDash([5 / scale, 5 / scale]);
        } else if (rectangle.lineType === 'construction') {
            ctx.setLineDash([12 / scale, 3 / scale, 4 / scale, 3 / scale]);
        } else {
            ctx.setLineDash([]);
        }

        ctx.fillStyle = fillStyle;
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = (rectangle.lineWidth || 2) / scale;
        ctx.beginPath();
        ctx.rect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
        ctx.fill();
        ctx.stroke();
        
        ctx.setLineDash([]);
        
        if (isSelected) {
            ctx.fillStyle = strokeStyle;
            const corners = [
                {x: rectangle.x, y: rectangle.y},
                {x: rectangle.x + rectangle.width, y: rectangle.y},
                {x: rectangle.x + rectangle.width, y: rectangle.y + rectangle.height},
                {x: rectangle.x, y: rectangle.y + rectangle.height}
            ];
            corners.forEach(corner => {
                ctx.beginPath();
                ctx.arc(corner.x, corner.y, RECTANGLE_HANDLE_RADIUS / scale, 0, 2 * Math.PI);
                ctx.fill();
            });
        }
    });
}
        
function drawArcs() {
    arcs.forEach(arc => {
        const isSelected = selectedElement && selectedElement.type === 'arc' && selectedElement.id === arc.id;
        const isHovered = hoveredElement && hoveredElement.type === 'arc' && hoveredElement.id === arc.id;

        let strokeStyle = arc.color || `rgb(34, 197, 94)`;

        if (isSelected) {
            strokeStyle = `rgb(22, 163, 74)`;
        } else if (isHovered) {
            strokeStyle = `rgb(52, 211, 153)`;
        }

        if (arc.lineType === 'dashed') {
            ctx.setLineDash([5 / scale, 5 / scale]);
        } else if (arc.lineType === 'construction') {
            ctx.setLineDash([12 / scale, 3 / scale, 4 / scale, 3 / scale]);
        } else {
            ctx.setLineDash([]);
        }

        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = (arc.lineWidth || 2) / scale;
        ctx.beginPath();
        ctx.arc(arc.cx, arc.cy, arc.radius, arc.startAngle, arc.endAngle, arc.anticlockwise);
        ctx.stroke();

        ctx.setLineDash([]);

        // Draw handles if selected or hovered
        if (isSelected || isHovered) {
            ctx.fillStyle = strokeStyle;
            const startPoint = {
                x: arc.cx + arc.radius * Math.cos(arc.startAngle),
                y: arc.cy + arc.radius * Math.sin(arc.startAngle)
            };
            const endPoint = {
                x: arc.cx + arc.radius * Math.cos(arc.endAngle),
                y: arc.cy + arc.radius * Math.sin(arc.endAngle)
            };

            // Draw start point handle
            ctx.beginPath();
            ctx.arc(startPoint.x, startPoint.y, POINT_HOVER_RADIUS / scale, 0, 2 * Math.PI);
            ctx.fill();

            // Draw end point handle
            ctx.beginPath();
            ctx.arc(endPoint.x, endPoint.y, POINT_HOVER_RADIUS / scale, 0, 2 * Math.PI);
            ctx.fill();
            
            // Draw center point handle
            ctx.beginPath();
            ctx.arc(arc.cx, arc.cy, POINT_HOVER_RADIUS / scale, 0, 2 * Math.PI);
            ctx.fill();
        }
    });
}
        
function drawEllipses() {
    ellipses.forEach(ellipse => {
        const isSelected = selectedElement && selectedElement.type === 'ellipse' && selectedElement.id === ellipse.id;
        const isHovered = hoveredElement && hoveredElement.type === 'ellipse' && hoveredElement.id === ellipse.id;

        let fillStyle = `rgba(209, 213, 219, 0.45)`;
        let strokeStyle = ellipse.color || `rgb(34, 197, 94)`;

        if (isSelected) {
            strokeStyle = `rgb(22, 163, 74)`;
        } else if (isHovered) {
            strokeStyle = `rgb(52, 211, 153)`;
        }

        if (ellipse.lineType === 'dashed') {
            ctx.setLineDash([5 / scale, 5 / scale]);
        } else if (ellipse.lineType === 'construction') {
            ctx.setLineDash([12 / scale, 3 / scale, 4 / scale, 3 / scale]);
        } else {
            ctx.setLineDash([]);
        }

        ctx.fillStyle = fillStyle;
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = (ellipse.lineWidth || 2) / scale;
        ctx.beginPath();
        ctx.ellipse(ellipse.x, ellipse.y, ellipse.radiusX, ellipse.radiusY, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        ctx.setLineDash([]);

        // Draw center point when hovered or selected
        if (isSelected || isHovered) {
            ctx.fillStyle = strokeStyle;
            ctx.strokeStyle = '#000000ff'; // White outline for visibility
            ctx.lineWidth = 1 / scale;
            ctx.beginPath();
            ctx.arc(ellipse.x, ellipse.y, POINT_HOVER_RADIUS / scale, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        }
    });
}

function drawRegularPolygons() {
    regularPolygons.forEach(polygon => {
        const isSelected = selectedElement && selectedElement.type === 'regularPolygon' && selectedElement.id === polygon.id;
        const isHovered = hoveredElement && hoveredElement.type === 'regularPolygon' && hoveredElement.id === polygon.id;

        let fillStyle = `rgba(209, 213, 219, 0.45)`;
        let strokeStyle = polygon.color || `rgb(34, 197, 94)`;

        if (isSelected) {
            strokeStyle = `rgb(29, 78, 216)`; // A darker blue for selection
        } else if (isHovered && !isSelected) {
            strokeStyle = `rgb(52, 211, 153)`;
        }

        if (polygon.lineType === 'dashed') {
            ctx.setLineDash([5 / scale, 5 / scale]);
        } else if (polygon.lineType === 'construction') {
            ctx.setLineDash([12 / scale, 3 / scale, 4 / scale, 3 / scale]);
        } else {
            ctx.setLineDash([]);
        }

        ctx.fillStyle = fillStyle;
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = (polygon.lineWidth || 2) / scale;
        ctx.beginPath();

        let vertexRadius = polygon.radius;
        if (polygon.inscribed === true) { // User wants "Inscribed" to be tangent to the circle
            vertexRadius = polygon.radius / Math.cos(Math.PI / polygon.sides);
        } else { // User wants "Circumscribed" to have corners on the circle
            vertexRadius = polygon.radius;
        }

        // Draw center and vertex points if the whole polygon is selected or hovered
        if (isSelected || isHovered) {
            ctx.fillStyle = strokeStyle;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1 / scale;

            // Draw center point
            ctx.beginPath();
            ctx.arc(polygon.x, polygon.y, POINT_HOVER_RADIUS / scale, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();

            // Draw vertex points
            for (let i = 0; i < polygon.sides; i++) {
                const angle = (i / polygon.sides) * 2 * Math.PI - Math.PI / 2;
                const x = polygon.x + vertexRadius * Math.cos(angle);
                const y = polygon.y + vertexRadius * Math.sin(angle);
                ctx.beginPath();
                ctx.arc(x, y, POINT_HOVER_RADIUS / scale, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
            }
        }

        let p1 = null, p2 = null;
        for (let i = 0; i < polygon.sides; i++) {
            const angle = (i / polygon.sides) * 2 * Math.PI - Math.PI / 2;
            const nextAngle = ((i + 1) / polygon.sides) * 2 * Math.PI - Math.PI / 2;
            p1 = { x: polygon.x + vertexRadius * Math.cos(angle), y: polygon.y + vertexRadius * Math.sin(angle) };
            p2 = { x: polygon.x + vertexRadius * Math.cos(nextAngle), y: polygon.y + vertexRadius * Math.sin(nextAngle) };

            const isSideSelected = selectedGeometricElement && selectedGeometricElement.type === 'edge' && selectedGeometricElement.shapeId === polygon.id && selectedGeometricElement.sideIndex === i;
            const isSideHovered = hoveredGeometricElement && hoveredGeometricElement.type === 'edge' && hoveredGeometricElement.shapeId === polygon.id && hoveredGeometricElement.sideIndex === i;

            let sideStrokeStyle = strokeStyle;
            if (isSideSelected) {
                sideStrokeStyle = '#1d4ed8'; // Dark blue for selected side
            } else if (isSideHovered && !isSideSelected) {
                sideStrokeStyle = '#60a5fa'; // Light blue for hovered side
            }

            ctx.strokeStyle = sideStrokeStyle;
            ctx.lineWidth = (isSideSelected || isSideHovered) ? (polygon.lineWidth || 2 + 1) / scale : (polygon.lineWidth || 2) / scale;

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }

        ctx.setLineDash([]);
    });
}

function drawSlots() {
    slots.forEach(slot => {
        const isSelected = selectedElement && selectedElement.type === 'slot' && selectedElement.id === slot.id;
        const isHovered = hoveredElement && hoveredElement.type === 'slot' && hoveredElement.id === slot.id;

        let fillStyle = `rgba(209, 213, 219, 0.45)`;
        let strokeStyle = slot.color || `rgb(34, 197, 94)`;

        if (isSelected) {
            strokeStyle = `rgb(22, 163, 74)`;
        } else if (isHovered) {
            strokeStyle = `rgb(52, 211, 153)`;
        }

        if (slot.lineType === 'dashed') {
            ctx.setLineDash([5 / scale, 5 / scale]);
        } else if (slot.lineType === 'construction') {
            ctx.setLineDash([12 / scale, 3 / scale, 4 / scale, 3 / scale]);
        } else {
            ctx.setLineDash([]);
        }

        ctx.fillStyle = fillStyle;
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = (slot.lineWidth || 2) / scale;

        const angle = Math.atan2(slot.p2.y - slot.p1.y, slot.p2.x - slot.p1.x);
        const perpAngle = angle + Math.PI / 2;

        // Define the four tangent points of the slot
        const p1_top = { x: slot.p1.x + slot.radius * Math.cos(perpAngle), y: slot.p1.y + slot.radius * Math.sin(perpAngle) }; // Top-left tangent
        const p1_bot = { x: slot.p1.x - slot.radius * Math.cos(perpAngle), y: slot.p1.y - slot.radius * Math.sin(perpAngle) }; // Bottom-left tangent
        const p2_top = { x: slot.p2.x + slot.radius * Math.cos(perpAngle), y: slot.p2.y + slot.radius * Math.sin(perpAngle) }; // Top-right tangent
        const p2_bot = { x: slot.p2.x - slot.radius * Math.cos(perpAngle), y: slot.p2.y - slot.radius * Math.sin(perpAngle) }; // Bottom-right tangent

        // --- Draw the main shape ---
        ctx.fillStyle = fillStyle;
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = (slot.lineWidth || 2) / scale;
        ctx.beginPath();
        ctx.arc(slot.p1.x, slot.p1.y, slot.radius, perpAngle, perpAngle + Math.PI);
        ctx.lineTo(p2_bot.x, p2_bot.y);
        ctx.arc(slot.p2.x, slot.p2.y, slot.radius, perpAngle + Math.PI, perpAngle);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // --- Draw Highlights for Individual Segments ---
        const elementsToHighlight = [hoveredGeometricElement, selectedGeometricElement];
        elementsToHighlight.forEach((element, index) => {
            if (!element || element.shapeId !== slot.id) return;

            const isSelected = index === 1;
            ctx.strokeStyle = isSelected ? '#1d4ed8' : '#60a5fa';
            ctx.lineWidth = ((slot.lineWidth || 2) + (isSelected ? 2 : 1)) / scale;

            if (element.type === 'edge') {
                const line = getLineFromElementInfo(element);
                if (line) {
                    ctx.beginPath();
                    ctx.moveTo(line.x1, line.y1);
                    ctx.lineTo(line.x2, line.y2);
                    ctx.stroke();
                }
            } else if (element.type === 'arc_contour') {
                const arc = getArcFromElementInfo(element);
                if (arc) {
                    ctx.beginPath();
                    ctx.arc(arc.cx, arc.cy, arc.radius, arc.startAngle, arc.endAngle);
                    ctx.stroke();
                }
            } else if (element.type.includes('point')) {
                const point = getPointFromElementInfo(element);
                if (point) {
                    ctx.fillStyle = isSelected ? '#3b82f6' : '#93c5fd';
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, (POINT_HOVER_RADIUS + 2) / scale, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
        });

        ctx.setLineDash([]);

        // Draw handles if the entire slot is selected or hovered
        if (isSelected || isHovered) {
            ctx.fillStyle = strokeStyle;
            const pointsToDraw = [
                slot.p1, // Center of first arc
                slot.p2, // Center of second arc
                p1_top, p1_bot, p2_top, p2_bot // The four tangency points
            ];

            pointsToDraw.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, POINT_HOVER_RADIUS / scale, 0, 2 * Math.PI);
                ctx.fill();
            });
        }
    });
}
function drawTexts() {
    texts.forEach(textObj => {
        const isSelected = selectedElement && selectedElement.type === 'text' && selectedElement.id === textObj.id;
        const isHovered = hoveredElement && hoveredElement.type === 'text' && hoveredElement.id === textObj.id;

        ctx.fillStyle = textObj.color || 'black';
        let fontStyle = '';
        if (textObj.italic) fontStyle += 'italic ';
        if (textObj.bold) fontStyle += 'bold ';
        ctx.font = `${fontStyle}${textObj.size / scale}px ${textObj.font}`;
        ctx.textAlign = textObj.align || 'left';
        ctx.textBaseline = 'top';

        const lines = textObj.content.split('\n');
        const lineHeight = textObj.size / scale;

        lines.forEach((line, i) => {
            ctx.fillText(line, textObj.x, textObj.y + i * lineHeight);
            if (textObj.underline) {
                const textWidth = ctx.measureText(line).width;
                let underlineX = textObj.x;
                if (textObj.align === 'center') underlineX -= textWidth / 2;
                else if (textObj.align === 'right') underlineX -= textWidth;
                ctx.fillRect(underlineX, textObj.y + (i + 1) * lineHeight, textWidth, 1 / scale);
            }
        });
    });
}
        
function drawSplines() {
    splines.forEach(spline => {
        if (spline.points.length < 2) return;

        const isSelected = selectedElement && selectedElement.type === 'spline' && selectedElement.id === spline.id;
        const isHovered = hoveredElement && hoveredElement.type === 'spline' && hoveredElement.id === spline.id;

        let strokeStyle = spline.color || `rgb(34, 197, 94)`;

        if (isSelected) {
            strokeStyle = `rgb(22, 163, 74)`;
        } else if (isHovered) {
            strokeStyle = `rgb(52, 211, 153)`;
        }

        if (spline.lineType === 'dashed') {
            ctx.setLineDash([5 / scale, 5 / scale]);
        } else if (spline.lineType === 'construction') {
            ctx.setLineDash([12 / scale, 3 / scale, 4 / scale, 3 / scale]);
        } else {
            ctx.setLineDash([]);
        }

        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = (spline.lineWidth || 2) / scale;
        ctx.beginPath();

        ctx.moveTo(spline.points[0].x, spline.points[0].y);
        for (let i = 0; i < spline.points.length - 1; i++) {
            const p0 = spline.points[i === 0 ? 0 : i - 1];
            const p1 = spline.points[i];
            const p2 = spline.points[i + 1];
            const p3 = spline.points[i + 2 < spline.points.length ? i + 2 : spline.points.length - 1];

            const cp1 = {
                x: p1.x + (p2.x - p0.x) / 6,
                y: p1.y + (p2.y - p0.y) / 6
            };
            const cp2 = {
                x: p2.x - (p3.x - p1.x) / 6,
                y: p2.y - (p3.y - p1.y) / 6
            };

            ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        if (isSelected || isHovered) {
            ctx.fillStyle = strokeStyle;
            spline.points.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, POINT_HOVER_RADIUS / scale, 0, 2 * Math.PI);
                ctx.fill();
            });
        }
    });

    if (currentSplinePoints) {
        ctx.strokeStyle = 'rgb(34, 197, 94)';
        ctx.lineWidth = 3 / scale;
        ctx.setLineDash([3 / scale, 3 / scale]);
        ctx.beginPath();
        ctx.moveTo(currentSplinePoints[0].x, currentSplinePoints[0].y);
        for (let i = 1; i < currentSplinePoints.length; i++) {
            ctx.lineTo(currentSplinePoints[i].x, currentSplinePoints[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

function drawRulers() {
    ctx.save();
    ctx.translate(offsetX * scale, offsetY * scale);
    ctx.scale(scale, scale);

    const canvasWidth = canvas.width / scale;
    const canvasHeight = canvas.height / scale;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2 / scale;
    ctx.beginPath();
    ctx.moveTo(-offsetX, 0);
    ctx.lineTo(-offsetX + canvasWidth, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -offsetY);
    ctx.lineTo(0, -offsetY + canvasHeight);
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(0, 0, 4 / scale, 0, 2 * Math.PI);
    ctx.fill();

    ctx.font = `${10 / scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#000000';
    ctx.lineWidth = 1 / scale;

    const majorTickInterval = PIXELS_PER_MM * 10;
    
    const startX = Math.floor((-offsetX) / majorTickInterval) * majorTickInterval;
    const endX = Math.ceil((canvasWidth - offsetX) / majorTickInterval) * majorTickInterval;
    for (let i = startX; i <= endX; i += majorTickInterval) {
        if (i !== 0) {
            ctx.beginPath();
            ctx.moveTo(i, 0 - (5 / scale));
            ctx.lineTo(i, 0 + (5 / scale));
            ctx.stroke();
            ctx.fillText(`${(i / PIXELS_PER_MM).toFixed(0)}mm`, i, 0 + (7 / scale));
        }
    }
    
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const startY = Math.floor((-offsetY) / majorTickInterval) * majorTickInterval;
    const endY = Math.ceil((canvas.height - offsetY) / majorTickInterval) * majorTickInterval;
    for (let i = startY; i <= endY; i += majorTickInterval) {
        if (i !== 0) {
            ctx.beginPath();
            ctx.moveTo(0 - (5 / scale), i);
            ctx.lineTo(0 + (5 / scale), i);
            ctx.stroke();
            ctx.fillText(`${(i / PIXELS_PER_MM).toFixed(0)}mm`, 0 - (7 / scale), i);
        }
    }
    
    ctx.restore();
}

function drawTempShape() {
    if (tempShape) {
        ctx.lineWidth = 2 / scale;
        ctx.setLineDash([5 / scale, 5 / scale]);

        if (tempShape.type === 'circle') {
            ctx.strokeStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(tempShape.x, tempShape.y, tempShape.radius, 0, 2 * Math.PI);
            ctx.stroke();
        } else if (tempShape.type === 'rectangle') {
            ctx.strokeStyle = '#4f46e5';
            ctx.beginPath();
            ctx.rect(tempShape.x, tempShape.y, tempShape.width, tempShape.height);
            ctx.stroke();
        } else if (tempShape.type === 'ellipse') {
            ctx.strokeStyle = '#de73ff';
            ctx.beginPath();
            ctx.ellipse(tempShape.x, tempShape.y, tempShape.radiusX, tempShape.radiusY, 0, 0, 2 * Math.PI);
            ctx.stroke();
        } else if (tempShape.type === 'regularPolygon') {
            ctx.strokeStyle = '#8b5cf6'; // A purple color for the preview
            ctx.beginPath();
            let vertexRadius = tempShape.radius;
            if (tempShape.inscribed === true) { // Inscribed (tangent)
                vertexRadius = tempShape.radius / Math.cos(Math.PI / tempShape.sides);
            } // else Circumscribed (corners on circle) -> vertexRadius is already correct
            for (let i = 0; i < tempShape.sides; i++) {
                const angle = (i / tempShape.sides) * 2 * Math.PI - Math.PI / 2;
                const x = tempShape.x + vertexRadius * Math.cos(angle);
                const y = tempShape.y + vertexRadius * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();

            // Draw the temporary construction circle for the preview
            ctx.setLineDash([3 / scale, 3 / scale]);
            ctx.strokeStyle = '#a0aec0';
            ctx.beginPath();
                    
            ctx.arc(tempShape.x, tempShape.y, tempShape.radius, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.setLineDash([]); // Reset for other temp shapes
        } else if (tempShape.type === 'arc') {
            ctx.strokeStyle = '#ff7373'; // A reddish color for the preview
            ctx.fillStyle = '#ff7373';
            ctx.setLineDash([3 / scale, 3 / scale]);

            if (tempShape.step === 1) { // Drawing line from p1 to mouse
                ctx.beginPath();
                ctx.moveTo(tempShape.p1.x, tempShape.p1.y);
                ctx.lineTo(tempShape.mousePos.x, tempShape.mousePos.y);
                ctx.stroke();
                // Draw p1
                ctx.beginPath();
                ctx.arc(tempShape.p1.x, tempShape.p1.y, POINT_HOVER_RADIUS / scale, 0, 2 * Math.PI);
                ctx.fill();
            } else if (tempShape.step === 2) { // Drawing arc preview
                // Draw p1 and p2
                ctx.beginPath(); ctx.arc(tempShape.p1.x, tempShape.p1.y, POINT_HOVER_RADIUS / scale, 0, 2 * Math.PI); ctx.fill();
                ctx.beginPath(); ctx.arc(tempShape.p2.x, tempShape.p2.y, POINT_HOVER_RADIUS / scale, 0, 2 * Math.PI); ctx.fill();
                
                // Draw the baseline
                ctx.beginPath();
                ctx.moveTo(tempShape.p1.x, tempShape.p1.y);
                ctx.lineTo(tempShape.p2.x, tempShape.p2.y);
                ctx.stroke();

                // Draw the arc preview
                const arcParams = calculateArcFromThreePoints(tempShape.p1, tempShape.p2, tempShape.mousePos);
                if (arcParams) {
                    ctx.beginPath();
                    ctx.arc(arcParams.x, arcParams.y, arcParams.radius, arcParams.startAngle, arcParams.endAngle, arcParams.anticlockwise);
                    ctx.stroke();
                }
            }
        } else if (tempShape.type === 'slot') {
            ctx.strokeStyle = '#8b5cf6'; // A purple color for the preview
            ctx.setLineDash([3 / scale, 3 / scale]);

            if (tempShape.step === 1) { // Drawing centerline from p1 to mouse
                ctx.beginPath();
                ctx.moveTo(tempShape.p1.x, tempShape.p1.y);
                ctx.lineTo(tempShape.mousePos.x, tempShape.mousePos.y);
                ctx.stroke();
            } else if (tempShape.step === 2) { // Drawing the slot outline preview
                // Draw the finalized center line
                ctx.beginPath();
                ctx.moveTo(tempShape.p1.x, tempShape.p1.y);
                ctx.lineTo(tempShape.p2.x, tempShape.p2.y);
                ctx.stroke();

                // Draw the slot preview
                const angle = Math.atan2(tempShape.p2.y - tempShape.p1.y, tempShape.p2.x - tempShape.p1.x);
                const perpAngle = angle + Math.PI / 2;
                const radius = tempShape.radius || 0;
                const p2_bot = { x: tempShape.p2.x - radius * Math.cos(perpAngle), y: tempShape.p2.y - radius * Math.sin(perpAngle) };

                ctx.beginPath();
                ctx.arc(tempShape.p1.x, tempShape.p1.y, radius, perpAngle, perpAngle + Math.PI);
                ctx.lineTo(p2_bot.x, p2_bot.y);
                ctx.arc(tempShape.p2.x, tempShape.p2.y, radius, perpAngle + Math.PI, perpAngle);
                ctx.closePath();
                ctx.stroke();
            }
        } else if (tempShape.type === 'text') {
            ctx.fillStyle = tempShape.color || 'rgba(0, 0, 0, 0.5)';
            let fontStyle = '';
            if (tempShape.italic) fontStyle += 'italic ';
            if (tempShape.bold) fontStyle += 'bold ';
            ctx.font = `${fontStyle}${tempShape.size / scale}px ${tempShape.font}`;
            ctx.textAlign = tempShape.align || 'left';
            ctx.textBaseline = 'top';

            const lines = tempShape.content.split('\n');
            const lineHeight = tempShape.size / scale;

            lines.forEach((line, i) => {
                ctx.fillText(line, tempShape.x, tempShape.y + i * lineHeight);
            });

            ctx.setLineDash([]);
        }

        ctx.setLineDash([]);
    }
}

function drawSnapPoint() {
    if (snapPoint) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2 / scale;
        ctx.beginPath();
        ctx.arc(snapPoint.x, snapPoint.y, (POINT_HOVER_RADIUS + 2) / scale, 0, 2 * Math.PI);
        ctx.stroke();
    }
}