// ===============================================
// Constraint Logic
// ===============================================

function handleConstraintClick(x, y) {
    const clickedElement = getGeometricElementAt(x, y);
    if (!clickedElement) {
        resetConstraintCreation();
        return;
    }

    if (constraintCreationStep === 0) {
        // Single-click constraints
        if (currentTool === 'horizontalConstraint' && clickedElement.type === 'edge') {
            constraints.push({ id: constraintIdCounter++, type: 'horizontal', element1: clickedElement });
            applyConstraints(); saveState(); draw(); return;
        }
        if (currentTool === 'verticalConstraint' && clickedElement.type === 'edge') {
            constraints.push({ id: constraintIdCounter++, type: 'vertical', element1: clickedElement });
            applyConstraints(); saveState(); draw(); return;
        }
        if (currentTool === 'fixConstraint' && (clickedElement.type === 'point' || clickedElement.type === 'circle_center')) {
            const point = getPointFromElementInfo(clickedElement);
            constraints.push({ id: constraintIdCounter++, type: 'fix', element1: clickedElement, x: point.x, y: point.y });
            applyConstraints(); saveState(); draw(); return;
        }
        
        // Start of a two-click constraint
        firstElementForConstraint = clickedElement;
        constraintCreationStep = 1;

    } else { // constraintCreationStep === 1
        let constraintType = null;
        switch(currentTool) {
            case 'coincidentConstraint': constraintType = 'coincident'; break;
            case 'tangentConstraint': constraintType = 'tangent'; break;
            case 'horizontalConstraint': constraintType = 'alignHorizontal'; break;
            case 'verticalConstraint': constraintType = 'alignVertical'; break;
            case 'parallelConstraint': constraintType = 'parallel'; break;
            case 'perpendicularConstraint': constraintType = 'perpendicular'; break;
            case 'collinearConstraint': constraintType = 'collinear'; break;
        }
        
        if (constraintType) {
            constraints.push({
                id: constraintIdCounter++,
                type: constraintType,
                element1: firstElementForConstraint, 
                element2: clickedElement
            });
            resetConstraintCreation();
            applyConstraints();
            saveState();
            draw();
        } else {
            resetConstraintCreation();
        }
    }
}

function resetConstraintCreation() {
    constraintCreationStep = 0;
    firstElementForConstraint = null;
}

function applyConstraints() {
    // Apply multiple times to solve dependencies
    for (let i = 0; i < 5; i++) {
        constraints.forEach(constraint => {
            const el1 = constraint.element1;
            const el2 = constraint.element2;
            const shape1 = findShapeById(el1.shapeId, el1.shapeType);
            if (!shape1) return;

            switch (constraint.type) {
                case 'coincident': {
                    if (!el2) break;
                    const shape2 = findShapeById(el2.shapeId, el2.shapeType);
                    if (!shape2) break;

                    const p1 = getPointFromElementInfo(el1);
                    let p2 = getPointFromElementInfo(el2);
                    if (!p1) break;

                    if (el2.type.includes('edge') || el2.type.includes('contour')) {
                        p2 = getClosestPointOnElement(p1, el2);
                    }

                    if (!p2) break;

                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
                        // Move the point to the target, but if the target is a movable point,
                        // meet in the middle for stability.
                        const isEl2Movable = el2.type.includes('point') || el2.type.includes('center');
                        moveGeometricPoint(el1, dx / (isEl2Movable ? 2 : 1), dy / (isEl2Movable ? 2 : 1));
                        if (isEl2Movable) moveGeometricPoint(el2, -dx / 2, -dy / 2);
                    }
                    break;
                }
                case 'tangent': {
                    if (!el2) break;
                    const shape2 = findShapeById(el2.shapeId, el2.shapeType);
                    if (!shape2) break;

                    // Check for circular or elliptical shapes
                    const isShape1Circular = ['circle', 'arc', 'ellipse'].includes(shape1.type);
                    const isShape2Circular = ['circle', 'arc', 'ellipse'].includes(shape2.type);

                    if (isShape1Circular && isShape2Circular) {
                        // Tangency between two circular/elliptical shapes
                        const center1 = { x: shape1.cx ?? shape1.x, y: shape1.cy ?? shape1.y };
                        const center2 = { x: shape2.cx ?? shape2.x, y: shape2.cy ?? shape2.y };
                        const dist = getDistance(center1, center2);

                        // For ellipse-involved tangency, this is a simplification.
                        // We find the point on each shape in the direction of the other's center.
                        const angleTo2 = Math.atan2(center2.y - center1.y, center2.x - center1.x);
                        const pointOn1 = getPointOnShapeBoundary(shape1, angleTo2);
                        const pointOn2 = getPointOnShapeBoundary(shape2, angleTo2 + Math.PI);

                        const currentDist = getDistance(pointOn1, pointOn2);
                        const targetDist = 0; // For tangency, they should touch.

                        if (Math.abs(currentDist - targetDist) > 0.1) {
                            const error = (targetDist - currentDist) / 2; // Distribute error
                            const moveAngle = Math.atan2(pointOn2.y - pointOn1.y, pointOn2.x - pointOn1.x);

                            // Move shapes towards each other along the line connecting the boundary points
                            moveGeometricPoint(el1, Math.cos(moveAngle) * error, Math.sin(moveAngle) * error);
                            moveGeometricPoint(el2, -Math.cos(moveAngle) * error, -Math.sin(moveAngle) * error);
                        }
                    } else { // One is circular/elliptical, one is a line
                        const circularShape = isShape1Circular ? shape1 : shape2;
                        const circularElement = isShape1Circular ? el1 : el2;
                        const lineElement = isShape1Circular ? el2 : el1;
                        const line = getLineFromElementInfo(lineElement);
                        if (!line) break;

                        if (circularShape.type === 'ellipse') {
                            // Ellipse-Line Tangency (simplified: move ellipse center to be tangent)
                            // A full solver is very complex, this is a good approximation.
                            const closestPointOnEllipse = getClosestPointOnEllipse(line, circularShape);
                            const closestPointOnLine = getClosestPointOnLineSegment(closestPointOnEllipse.x, closestPointOnEllipse.y, line.x1, line.y1, line.x2, line.y2);
                            const dx = closestPointOnLine.x - closestPointOnEllipse.x;
                            const dy = closestPointOnLine.y - closestPointOnEllipse.y;
                            if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
                                moveGeometricPoint(circularElement, dx / 2, dy / 2);
                                moveGeometricPoint(lineElement, -dx / 2, -dy / 2);
                            }
                        } else { // Circle/Arc-Line Tangency
                            const center = { x: circularShape.cx ?? circularShape.x, y: circularShape.cy ?? circularShape.y };
                            const distToLine = getDistanceFromLineSegment(center.x, center.y, line.x1, line.y1, line.x2, line.y2);
                            const error = distToLine - circularShape.radius;
                            if (Math.abs(error) > 0.1) {
                                const closestPointOnLine = getClosestPointOnLineSegment(center.x, center.y, line.x1, line.y1, line.x2, line.y2);
                                const vec = { x: center.x - closestPointOnLine.x, y: center.y - closestPointOnLine.y };
                                const len = getDistance({x:0, y:0}, vec);
                                if (len < 0.01) break; // Avoid division by zero
                                const moveVec = { x: (vec.x / len) * error, y: (vec.y / len) * error };
                                moveGeometricPoint(circularElement, -moveVec.x / 2, -moveVec.y / 2);
                                moveGeometricPoint(lineElement, moveVec.x / 2, moveVec.y / 2);
                            }
                        }
                    }
                    break;
                }
                case 'horizontal': {
                    const line = getLineFromElementInfo(el1);
                    if (line) {
                        const dy = line.y1 - line.y2;
                        if (Math.abs(dy) > 0.01) { // Distribute error
                            moveGeometricPointByLinePoint(el1, 'start', 0, dy / 2);
                            moveGeometricPointByLinePoint(el1, 'end', 0, -dy / 2);
                        }
                    }
                    break;
                }
                case 'vertical': {
                    const line = getLineFromElementInfo(el1);
                    if (line) {
                        const dx = line.x1 - line.x2;
                        if (Math.abs(dx) > 0.01) { // Distribute error
                            moveGeometricPointByLinePoint(el1, 'start', dx / 2, 0);
                            moveGeometricPointByLinePoint(el1, 'end', -dx / 2, 0);
                        }
                    }
                    break;
                }
                case 'alignHorizontal': {
                    if (!el2) break;
                    const p1 = getPointFromElementInfo(el1);
                    const p2 = getPointFromElementInfo(el2);
                    if (p1 && p2) {
                        const dy = p1.y - p2.y;
                        if (Math.abs(dy) > 0.01) {
                            moveGeometricPoint(el1, 0, -dy / 2); // Distribute error
                            moveGeometricPoint(el2, 0, dy / 2);
                        }
                    }
                    break;
                }
                case 'alignVertical': {
                    if (!el2) break;
                    const p1 = getPointFromElementInfo(el1);
                    const p2 = getPointFromElementInfo(el2);
                    if (p1 && p2) {
                        const dx = p1.x - p2.x;
                        if (Math.abs(dx) > 0.01) {
                            moveGeometricPoint(el1, -dx / 2, 0); // Distribute error
                            moveGeometricPoint(el2, dx / 2, 0);
                        }
                    }
                    break;
                }
                case 'parallel': {
                    if (!el2) break;
                    const line1 = getLineFromElementInfo(el1);
                    let line2 = getLineFromElementInfo(el2);
                    if (!line1 || !line2) break;

                    const angle1 = Math.atan2(line1.y2 - line1.y1, line1.x2 - line1.x1);
                    const angle2 = Math.atan2(line2.y2 - line2.y1, line2.x2 - line2.x1);
                    
                    const normAngle1 = (angle1 % Math.PI + Math.PI) % Math.PI;
                    const normAngle2 = (angle2 % Math.PI + Math.PI) % Math.PI;

                    if (Math.abs(normAngle1 - normAngle2) > 0.001) {
                        const angleDiff = (angle1 - angle2) / 2; // Distribute error
                        const p1_center = { x: (line1.x1 + line1.x2) / 2, y: (line1.y1 + line1.y2) / 2 };
                        const p2_center = { x: (line2.x1 + line2.x2) / 2, y: (line2.y1 + line2.y2) / 2 };
                        
                        // Rotate each line halfway towards the goal
                        rotateLine(el1, -angleDiff, p1_center);
                        rotateLine(el2, angleDiff, p2_center);
                    }
                    break;
                }
                case 'perpendicular': {
                    if (!el2) break;
                    const line1 = getLineFromElementInfo(el1);
                    const line2 = getLineFromElementInfo(el2);
                    if (!line1 || !line2) break;

                    const angle1 = Math.atan2(line1.y2 - line1.y1, line1.x2 - line1.x1);
                    const angle2 = Math.atan2(line2.y2 - line2.y1, line2.x2 - line2.x1);
                    const targetAngle = angle1 + Math.PI / 2;
                    let angleDiff = targetAngle - angle2;
                    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

                    if (Math.abs(angleDiff) > 0.001) {
                        const angleRot = angleDiff / 2; // Distribute error
                        const p1_center = { x: (line1.x1 + line1.x2) / 2, y: (line1.y1 + line1.y2) / 2 };
                        const p2_center = { x: (line2.x1 + line2.x2) / 2, y: (line2.y1 + line2.y2) / 2 };

                        // Rotate each line halfway towards the goal
                        rotateLine(el1, -angleRot, p1_center);
                        rotateLine(el2, angleRot, p2_center);
                    }
                    break;
                }
                case 'fix': {
                    const currentPoint = getPointFromElementInfo(el1);
                    if (currentPoint) {
                        const dx = constraint.x - currentPoint.x;
                        const dy = constraint.y - currentPoint.y;
                        if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
                            moveGeometricPoint(el1, dx, dy);
                        }
                    }
                }
            }
        });
    }
}

function drawConstraints() {
    constraints.forEach(constraint => {
        // ... drawing logic for all constraint types ...
    });
}

function moveGeometricPoint(elementInfo, dx, dy) {
    const shape = findShapeById(elementInfo.shapeId, elementInfo.shapeType);
    if (!shape) return;

    if (elementInfo.type === 'point') {
        if (shape.type === 'polygon') {
            const line = shape.lines[elementInfo.lineIndex];
            if (elementInfo.pointType === 'start') {
                line.x1 += dx; line.y1 += dy;
                const prevIndex = (elementInfo.lineIndex - 1 + shape.lines.length) % shape.lines.length;
                if (shape.isClosed || elementInfo.lineIndex > 0) {
                     shape.lines[prevIndex].x2 += dx; shape.lines[prevIndex].y2 += dy;
                }
            } else { // 'end'
                line.x2 += dx; line.y2 += dy;
                const nextIndex = (elementInfo.lineIndex + 1) % shape.lines.length;
                if (shape.isClosed || elementInfo.lineIndex < shape.lines.length - 1) {
                    shape.lines[nextIndex].x1 += dx; shape.lines[nextIndex].y1 += dy;
                }
            }
        } else if (shape.type === 'rectangle') {
            switch (elementInfo.corner) {
                case 'topLeft': shape.x += dx; shape.y += dy; shape.width -= dx; shape.height -= dy; break;
                case 'topRight': shape.width += dx; shape.y += dy; shape.height -= dy; break;
                case 'bottomLeft': shape.x += dx; shape.width -= dx; shape.height += dy; break;
                case 'bottomRight': shape.width += dx; shape.height += dy; break;
            }
        } else if (shape.type === 'slot') {
            if (elementInfo.pointType === 'p1_center') {
                shape.p1.x += dx;
                shape.p1.y += dy;
            } else if (elementInfo.pointType === 'p2_center') {
                shape.p2.x += dx;
                shape.p2.y += dy;
            }
        } else if (shape.type === 'regularPolygon') {
            // Moving a vertex should move the whole shape by moving its center.
            shape.x += dx;
            shape.y += dy;
            // Also move the associated construction circle
            const constructionCircle = circles.find(c => c.parentId === shape.id && c.isConstruction);
            if (constructionCircle) {
                constructionCircle.x += dx;
                constructionCircle.y += dy;
            }
        }
    } else if (elementInfo.type === 'point' && shape.type === 'arc') {
        // Moving an arc's defining point requires recalculating the arc
        let { p1, p2, p3 } = shape;
        if (elementInfo.pointType === 'start') {
            p1 = { x: p1.x + dx, y: p1.y + dy };
        } else if (elementInfo.pointType === 'end') {
            p2 = { x: p2.x + dx, y: p2.y + dy };
        } else { // Mid point
            p3 = { x: p3.x + dx, y: p3.y + dy };
        }
        
        const newArcParams = calculateArcFromThreePoints(p1, p2, p3);
        if (newArcParams) {
            shape.p1 = p1;
            shape.p2 = p2;
            shape.p3 = p3;
            Object.assign(shape, { cx: newArcParams.x, cy: newArcParams.y, radius: newArcParams.radius, startAngle: newArcParams.startAngle, endAngle: newArcParams.endAngle, anticlockwise: newArcParams.anticlockwise });
        } else {
            console.warn("Could not recalculate arc during constraint solving.");
        }
    } else if (elementInfo.type === 'ellipse_center') {
        shape.x += dx; shape.y += dy;
    } else if (elementInfo.type === 'ellipse_contour') {
        shape.x += dx; shape.y += dy;
    } else if (elementInfo.type === 'regularPolygon_center') {
        shape.x += dx;
        shape.y += dy;
        const constructionCircle = circles.find(c => c.parentId === shape.id && c.isConstruction);
        if (constructionCircle) {
            constructionCircle.x += dx;
            constructionCircle.y += dy;
        }
    } else if (elementInfo.type === 'circle_center') {
        shape.x += dx; shape.y += dy;
    } else if (elementInfo.type === 'arc_contour' || elementInfo.type === 'arc_center') {
        shape.cx += dx; shape.cy += dy;
        // Also move the defining points
        if (shape.p1) shape.p1.x += dx;
        if (shape.p1) shape.p1.y += dy;
        if (shape.p2) shape.p2.x += dx;
        if (shape.p2) shape.p2.y += dy;
        if (shape.p3) shape.p3.x += dx;
        if (shape.p3) shape.p3.y += dy;
    } else if (elementInfo.type === 'edge') { // For moving whole lines/shapes
        if (shape.type === 'polygon') {
            shape.lines.forEach(line => {
                line.x1 += dx; line.y1 += dy; line.x2 += dx; line.y2 += dy;
            });
        }
    } else if (elementInfo.type === 'circle_contour') {
        shape.x += dx; shape.y += dy;
    }
}

function moveGeometricPointByLinePoint(lineElementInfo, pointToMove, dx, dy) {
    const shape = findShapeById(lineElementInfo.shapeId, lineElementInfo.shapeType);
    if (!shape || shape.type !== 'polygon') return;
    
    const line = shape.lines[lineElementInfo.lineIndex];
    if (pointToMove === 'start') {
        line.x1 += dx; line.y1 += dy;
        const prevIndex = (lineElementInfo.lineIndex - 1 + shape.lines.length) % shape.lines.length;
        if (shape.isClosed || lineElementInfo.lineIndex > 0) {
            shape.lines[prevIndex].x2 += dx; shape.lines[prevIndex].y2 += dy;
        }
    } else { // 'end'
        line.x2 += dx; line.y2 += dy;
        const nextIndex = (lineElementInfo.lineIndex + 1) % shape.lines.length;
        if (shape.isClosed || lineElementInfo.lineIndex < shape.lines.length - 1) {
             shape.lines[nextIndex].x1 += dx; 
             shape.lines[nextIndex].y1 += dy;
        }
    }
}

function rotateLine(lineElementInfo, angle, center) {
    const shape = findShapeById(lineElementInfo.shapeId, lineElementInfo.shapeType);
    if (!shape || shape.type !== 'polygon') return;

    const line = shape.lines[lineElementInfo.lineIndex];
    const newP1 = rotatePoint({ x: line.x1, y: line.y1 }, center, angle);
    const newP2 = rotatePoint({ x: line.x2, y: line.y2 }, center, angle);
    
    moveGeometricPointByLinePoint(lineElementInfo, 'start', newP1.x - line.x1, newP1.y - line.y1);
    moveGeometricPointByLinePoint(lineElementInfo, 'end', newP2.x - line.x2, newP2.y - line.y2);
}