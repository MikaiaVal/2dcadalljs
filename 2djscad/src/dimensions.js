// ===============================================
// Dimensioning Logic
// ===============================================

function handleDimensionClick(x, y) {
    const clickedElement = getGeometricElementAt(x, y);

    if (dimensionCreationStep === 0) {
        if (clickedElement) {
            // Always go to step 1 after the first valid element is clicked.
            // The logic in step 1 and updateTempDimension will handle what kind of dimension to create.
            firstElementForDimension = clickedElement;
            dimensionCreationStep = 1;
            tempDimension = createTempDimensionFromElements(firstElementForDimension, null, x, y);
        }
    } else if (dimensionCreationStep === 1) {
        if (clickedElement) {
            const firstIsPoint = firstElementForDimension.type === 'point' || firstElementForDimension.type === 'circle_center';
            const secondIsPoint = clickedElement.type === 'point' || clickedElement.type === 'circle_center';
            const firstIsEdge = firstElementForDimension.type === 'edge';
            const secondIsEdge = clickedElement.type === 'edge';

            if (firstIsPoint && secondIsPoint) {
                secondElementForDimension = clickedElement;
                tempDimension = createTempDimensionFromElements(firstElementForDimension, secondElementForDimension, x, y);
                dimensionCreationStep = 2;
            } else if (firstIsEdge && secondIsEdge) {
                secondElementForDimension = clickedElement;
                tempDimension = createTempDimensionFromElements(firstElementForDimension, secondElementForDimension, x, y);
                dimensionCreationStep = 2;
            } else {
                // If the second click is not valid for a 2-element dimension, finalize the 1-element dimension.
                finalizeDimension();
            }
        } else {
            finalizeDimension();
        }
    } else if (dimensionCreationStep === 2) {
        finalizeDimension();
    }
}

function resetDimensionCreation() {
    dimensionCreationStep = 0;
    firstElementForDimension = null;
    secondElementForDimension = null;
    tempDimension = null;
    draw();
}

function finalizeDimension() {
    if (tempDimension) {
        tempDimension.id = dimensionIdCounter++;
        dimensions.push(JSON.parse(JSON.stringify(tempDimension)));
        saveState();
    }
    resetDimensionCreation();
}

function createTempDimensionFromElements(el1, el2, mouseX, mouseY) {
    if (!el2) { // Single element dimension
        if (el1.type === 'edge' && el1.shapeType === 'regularPolygon') {
            return { dimensionType: 'polygon_side_length', element1: el1, offset: DIMENSION_OFFSET };
        }
        else if (el1.type === 'edge') {
            return { dimensionType: 'line', element1: el1, offset: DIMENSION_OFFSET };
        } else if (el1.type === 'circle_contour') {
            const circle = findShapeById(el1.shapeId, 'circle');
            return {
                dimensionType: 'diameter',
                element1: el1,
                angle: Math.atan2(mouseY - circle.y, mouseX - circle.x)
            };
        } else if (el1.type === 'arc_contour') {
            const arc = findShapeById(el1.shapeId, 'arc');
            return {
                dimensionType: 'radius',
                element1: el1,
                angle: Math.atan2(mouseY - arc.cy, mouseX - arc.cx)
            };
        } else if (el1.type === 'ellipse_contour') {
            const ellipse = findShapeById(el1.shapeId, 'ellipse');
            const angle = Math.atan2(mouseY - ellipse.y, mouseX - ellipse.x);
            // Determine if the user is clicking more on the horizontal or vertical side
            if (Math.abs(Math.cos(angle)) * ellipse.radiusY > Math.abs(Math.sin(angle)) * ellipse.radiusX) {
                return { dimensionType: 'ellipse_width', element1: el1, offset: DIMENSION_OFFSET };
            } else {
                return { dimensionType: 'ellipse_height', element1: el1, offset: DIMENSION_OFFSET };
            }
        } else if (el1.type === 'arc_contour' && el1.shapeType === 'slot') {
            const slot = findShapeById(el1.shapeId, 'slot');
            if (!slot) return null;
            const arcCenter = (el1.end === 'p1') ? slot.p1 : slot.p2;
            return {
                dimensionType: 'radius',
                element1: el1,
                angle: Math.atan2(mouseY - arcCenter.y, mouseX - arcCenter.x)
            };
        }



    } else { // Two element dimension
        if ((el1.type === 'point' || el1.type === 'circle_center') && (el2.type === 'point' || el2.type === 'circle_center')) {
            return { dimensionType: 'aligned', element1: el1, element2: el2, offset: DIMENSION_OFFSET };
        }
        if (el1.type === 'edge' && el2.type === 'edge') {
            return { dimensionType: 'angle', element1: el1, element2: el2, offset: DIMENSION_OFFSET * 2 };
        }
    }
    return null;
}

function updateTempDimension(mouseX, mouseY) {
    if (!tempDimension) return;

    if (tempDimension.element2) {
        if (tempDimension.dimensionType === 'angle') {
            const line1 = getLineFromElementInfo(tempDimension.element1);
            const line2 = getLineFromElementInfo(tempDimension.element2);
            const intersection = findLineIntersection(line1, line2, false);

            if (intersection) { // Ensure vectors point away from the intersection
                tempDimension.offset = getDistance({ x: mouseX, y: mouseY }, intersection);

                const p1_far = getDistance(intersection, {x: line1.x1, y: line1.y1}) > getDistance(intersection, {x: line1.x2, y: line1.y2}) ? {x: line1.x1, y: line1.y1} : {x: line1.x2, y: line1.y2};
                const p2_far = getDistance(intersection, {x: line2.x1, y: line2.y1}) > getDistance(intersection, {x: line2.x2, y: line2.y2}) ? {x: line2.x1, y: line2.y1} : {x: line2.x2, y: line2.y2};

                const v1_vec = { x: p1_far.x - intersection.x, y: p1_far.y - intersection.y };
                const v2_vec = { x: p2_far.x - intersection.x, y: p2_far.y - intersection.y };

                const mouse_vec = {x: mouseX - intersection.x, y: mouseY - intersection.y};

                const cross_v1_mouse = v1_vec.x * mouse_vec.y - v1_vec.y * mouse_vec.x;
                const cross_mouse_v2 = mouse_vec.x * v2_vec.y - mouse_vec.y * v2_vec.x;
                const cross_v1_v2 = v1_vec.x * v2_vec.y - v1_vec.y * v2_vec.x;

                if (cross_v1_v2 > 0) {
                    tempDimension.isReflex = !(cross_v1_mouse > 0 && cross_mouse_v2 > 0);
                } else {
                    tempDimension.isReflex = !(cross_v1_mouse < 0 && cross_mouse_v2 < 0);
                }
            }
        } else {
            const p1 = getPointFromElementInfo(tempDimension.element1);
            const p2 = getPointFromElementInfo(tempDimension.element2);
            if (!p1 || !p2) return;

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            
            const angleToMouse = Math.atan2(mouseY - midY, mouseX - midX);
            const lineAngle = Math.atan2(dy, dx);
            let angleDiff = Math.abs(normalizeAngle(angleToMouse - lineAngle));
            
            const deadZone = Math.PI / 6; 
            if (angleDiff > Math.PI / 2 - deadZone && angleDiff < Math.PI / 2 + deadZone) {
                tempDimension.dimensionType = 'aligned';
            } else {
                 if (Math.abs(dx) > Math.abs(dy)) {
                     tempDimension.dimensionType = (Math.abs(mouseY - midY) > Math.abs(mouseX - midX)) ? 'vertical' : 'horizontal';
                } else {
                     tempDimension.dimensionType = (Math.abs(mouseX - midX) > Math.abs(mouseY - midY)) ? 'horizontal' : 'vertical';
                }
            }

            if (tempDimension.dimensionType === 'aligned') {
                const perpAngle = lineAngle + Math.PI / 2;
                tempDimension.offset = (mouseX - p1.x) * Math.cos(perpAngle) + (mouseY - p1.y) * Math.sin(perpAngle);
            } else if (tempDimension.dimensionType === 'horizontal') {
                tempDimension.offset = mouseY - p1.y;
            } else if (tempDimension.dimensionType === 'vertical') {
                tempDimension.offset = mouseX - p1.x;
            }
        }
    } else {
        if (tempDimension.dimensionType === 'line') {
            const line = getLineFromElementInfo(tempDimension.element1);
            if (!line) return;
            const angle = Math.atan2(line.y2 - line.y1, line.x2 - line.x1) + Math.PI / 2;
            tempDimension.offset = (mouseX - line.x1) * Math.cos(angle) + (mouseY - line.y1) * Math.sin(angle);
        } else if (tempDimension.dimensionType === 'diameter') {
            const circle = findShapeById(tempDimension.element1.shapeId, 'circle');
            if (circle) tempDimension.angle = Math.atan2(mouseY - circle.y, mouseX - circle.x);
        } else if (tempDimension.dimensionType === 'radius' && tempDimension.element1.shapeType === 'slot') {
            const slot = findShapeById(tempDimension.element1.shapeId, 'slot');
            const arcCenter = (tempDimension.element1.end === 'p1') ? slot.p1 : slot.p2;
            if (slot) tempDimension.angle = Math.atan2(mouseY - arcCenter.y, mouseX - arcCenter.x);
        }
         else if (tempDimension.dimensionType === 'radius') {
            const arc = findShapeById(tempDimension.element1.shapeId, 'arc');
            if (arc) tempDimension.angle = Math.atan2(mouseY - arc.cy, mouseX - arc.cx);
        } else if (tempDimension.dimensionType === 'polygon_side_length') {
            const polygon = findShapeById(tempDimension.element1.shapeId, 'regularPolygon');
            if (!polygon) return;
            let vertexRadius = polygon.radius;
            if (polygon.inscribed === true) {
                vertexRadius = polygon.radius / Math.cos(Math.PI / polygon.sides);
            }
            const angle1 = (tempDimension.element1.sideIndex / polygon.sides) * 2 * Math.PI - Math.PI / 2;
            const angle2 = ((tempDimension.element1.sideIndex + 1) / polygon.sides) * 2 * Math.PI - Math.PI / 2;
            const p1 = { x: polygon.x + vertexRadius * Math.cos(angle1), y: polygon.y + vertexRadius * Math.sin(angle1) };
            const lineAngle = Math.atan2((polygon.y + vertexRadius * Math.sin(angle2)) - p1.y, (polygon.x + vertexRadius * Math.cos(angle2)) - p1.x);
            const perpAngle = lineAngle + Math.PI / 2;
            tempDimension.offset = (mouseX - p1.x) * Math.cos(perpAngle) + (mouseY - p1.y) * Math.sin(perpAngle);
        } else if (tempDimension.dimensionType === 'ellipse_width') {
            const ellipse = findShapeById(tempDimension.element1.shapeId, 'ellipse');
            if (!ellipse) return;
            const p1 = { x: ellipse.x - ellipse.radiusX, y: ellipse.y };
            tempDimension.offset = mouseY - p1.y;
        } else if (tempDimension.dimensionType === 'ellipse_height') {
            const ellipse = findShapeById(tempDimension.element1.shapeId, 'ellipse');
            if (!ellipse) return;
            const p1 = { x: ellipse.x, y: ellipse.y - ellipse.radiusY };
            tempDimension.offset = mouseX - p1.x;
        }
    }
}

function getDimensionDrawingData(dim) {
    let data = {
        type: dim.dimensionType,
        p1: null, p2: null,
        value: 0,
        midX: 0, midY: 0,
        angle: 0
    };
    
    if (dim.dimensionType === 'diameter') {
        const circle = findShapeById(dim.element1.shapeId, 'circle');
        if (!circle) return null;
        data.value = circle.radius * 2;
        data.angle = dim.angle;
        const cosA = Math.cos(data.angle);
        const sinA = Math.sin(data.angle);
        data.p1 = { x: circle.x - cosA * circle.radius, y: circle.y - sinA * circle.radius };
        data.p2 = { x: circle.x + cosA * circle.radius, y: circle.y + sinA * circle.radius };
        data.midX = circle.x;
        data.midY = circle.y;
    } else if (dim.dimensionType === 'radius') {
        const shape = findShapeById(dim.element1.shapeId, dim.element1.shapeType || 'arc'); // Fallback for older data
        if (!shape) return null;
 
        let center, radius;
        if (shape.type === 'arc') {
            center = { x: shape.cx, y: shape.cy };
            radius = shape.radius;
        } else if (shape.type === 'slot') {
            center = (dim.element1.end === 'p1') ? shape.p1 : shape.p2;
            radius = shape.radius;
        } else {
            return null;
        }
 
        data.value = radius;
        data.angle = dim.angle;
        const cosA = Math.cos(data.angle);
        const sinA = Math.sin(data.angle);
        data.p1 = { x: center.x, y: center.y };
        data.p2 = { x: center.x + cosA * radius, y: center.y + sinA * radius };
        data.midX = center.x + cosA * radius / 2;
        data.midY = center.y + sinA * radius / 2;
 
    } else if (dim.dimensionType === 'ellipse_width' || dim.dimensionType === 'ellipse_height') {
        const ellipse = findShapeById(dim.element1.shapeId, 'ellipse');
        if (!ellipse) return null;
        const isWidth = dim.dimensionType === 'ellipse_width';
        data.value = isWidth ? ellipse.radiusX * 2 : ellipse.radiusY * 2;
        data.angle = isWidth ? 0 : Math.PI / 2; // Horizontal for width, Vertical for height
        data.p1 = isWidth ? { x: ellipse.x - ellipse.radiusX, y: ellipse.y } : { x: ellipse.x, y: ellipse.y - ellipse.radiusY };
        data.p2 = isWidth ? { x: ellipse.x + ellipse.radiusX, y: ellipse.y } : { x: ellipse.x, y: ellipse.y + ellipse.radiusY };
        data.midX = isWidth ? ellipse.x : ellipse.x + dim.offset;
        data.midY = isWidth ? ellipse.y + dim.offset : ellipse.y;
    } else if (dim.dimensionType === 'polygon_side_length') {
        const polygon = findShapeById(dim.element1.shapeId, 'regularPolygon');
        if (!polygon) return null;

        let vertexRadius = polygon.radius;
        if (polygon.inscribed === true) { // Inscribed (tangent) means vertices are further out
            vertexRadius = polygon.radius / Math.cos(Math.PI / polygon.sides);
        }

        const angle1 = (dim.element1.sideIndex / polygon.sides) * 2 * Math.PI - Math.PI / 2;
        const angle2 = ((dim.element1.sideIndex + 1) / polygon.sides) * 2 * Math.PI - Math.PI / 2;

        data.p1 = { x: polygon.x + vertexRadius * Math.cos(angle1), y: polygon.y + vertexRadius * Math.sin(angle1) };
        data.p2 = { x: polygon.x + vertexRadius * Math.cos(angle2), y: polygon.y + vertexRadius * Math.sin(angle2) };

        data.value = getDistance(data.p1, data.p2);
        data.angle = Math.atan2(data.p2.y - data.p1.y, data.p2.x - data.p1.x);
        const perpAngle = data.angle + Math.PI / 2;
        data.midX = (data.p1.x + data.p2.x) / 2 + Math.cos(perpAngle) * dim.offset;
        data.midY = (data.p1.y + data.p2.y) / 2 + Math.sin(perpAngle) * dim.offset;

    } else if (dim.dimensionType === 'angle') {
        const line1 = getLineFromElementInfo(dim.element1);
        const line2 = getLineFromElementInfo(dim.element2);
        if (!line1 || !line2) return null;

        const intersection = findLineIntersection(line1, line2, false);
        if (!intersection) return null;

        const p1_far = getDistance(intersection, {x: line1.x1, y: line1.y1}) > getDistance(intersection, {x: line1.x2, y: line1.y2}) ? {x: line1.x1, y: line1.y1} : {x: line1.x2, y: line1.y2};
        const p2_far = getDistance(intersection, {x: line2.x1, y: line2.y1}) > getDistance(intersection, {x: line2.x2, y: line2.y2}) ? {x: line2.x1, y: line2.y1} : {x: line2.x2, y: line2.y2};

        const v1_vec = { x: p1_far.x - intersection.x, y: p1_far.y - intersection.y };
        const v2_vec = { x: p2_far.x - intersection.x, y: p2_far.y - intersection.y };

        let angle1 = Math.atan2(v1_vec.y, v1_vec.x);
        let angle2 = Math.atan2(v2_vec.y, v2_vec.x);

        let innerValue = Math.abs(normalizeAngle(angle2 - angle1));
        if (innerValue > Math.PI) innerValue = 2 * Math.PI - innerValue;

        data.value = dim.isReflex ? (2 * Math.PI - innerValue) : innerValue;
        
        const cross_v1_v2 = v1_vec.x * v2_vec.y - v1_vec.y * v2_vec.x;
        if (cross_v1_v2 < 0) {
            [angle1, angle2] = [angle2, angle1];
        }

        if (dim.isReflex) {
            data.startAngle = angle2;
            data.endAngle = angle1 + (2 * Math.PI);
        } else {
            data.startAngle = angle1;
            data.endAngle = angle2;
        }

        data.p1 = intersection;
        data.midX = intersection.x;
        data.midY = intersection.y;
    } else { // Linear dimensions
        data.p1 = getPointFromElementInfo(dim.element1);
        data.p2 = dim.element2 ? getPointFromElementInfo(dim.element2) : {x: getLineFromElementInfo(dim.element1).x2, y: getLineFromElementInfo(dim.element1).y2};
        if(!dim.element2) data.p1 = {x: getLineFromElementInfo(dim.element1).x1, y: getLineFromElementInfo(dim.element1).y1};


        if (!data.p1 || !data.p2) return null;

        if (dim.dimensionType === 'horizontal') {
            data.value = Math.abs(data.p2.x - data.p1.x);
            data.angle = 0;
            data.midX = (data.p1.x + data.p2.x) / 2;
            data.midY = data.p1.y + dim.offset;
        } else if (dim.dimensionType === 'vertical') {
            data.value = Math.abs(data.p2.y - data.p1.y);
            data.angle = Math.PI / 2;
            data.midX = data.p1.x + dim.offset;
            data.midY = (data.p1.y + data.p2.y) / 2;
        } else {
            data.value = getDistance(data.p1, data.p2);
            data.angle = Math.atan2(data.p2.y - data.p1.y, data.p2.x - data.p1.x);
            const perpAngle = data.angle + Math.PI / 2;
            data.midX = (data.p1.x + data.p2.x) / 2 + Math.cos(perpAngle) * dim.offset;
            data.midY = (data.p1.y + data.p2.y) / 2 + Math.sin(perpAngle) * dim.offset;
        }
    }
    return data;
}

function updateShapeFromDimension(dim, newValue) {
    const el1 = dim.element1;
    const shape1 = findShapeById(el1.shapeId, el1.shapeType);
    if (!shape1) return;

    switch (dim.dimensionType) {
        case 'diameter':
            if (shape1.type === 'circle') {
                const newRadius = newValue / 2;
                shape1.radius = newRadius;
                // If this is a construction circle for a polygon, update the polygon too.
                if (shape1.isConstruction && shape1.parentId !== undefined) {
                    const parentPolygon = findShapeById(shape1.parentId, 'regularPolygon');
                    if (parentPolygon) {
                        parentPolygon.radius = newRadius;
                    }
                }
            }
            break;
        case 'radius':
            if (el1.shapeType === 'arc') {
                // Recalculate arc geometry based on new radius, keeping p1 and p2 fixed
                const newArcParams = calculateArcFromThreePoints(shape1.p1, shape1.p2, shape1.p3, newValue);
                if (newArcParams) {
                    // This is the crucial fix: After calculating the new arc center/angles,
                    // we must also update the p1 and p2 points to match the new geometry.
                    // This keeps the data model consistent and prevents the constraint solver
                    // from moving the points unexpectedly.
                    const newP1 = {
                        x: newArcParams.x + newArcParams.radius * Math.cos(newArcParams.startAngle),
                        y: newArcParams.y + newArcParams.radius * Math.sin(newArcParams.startAngle)
                    };
                    const newP2 = {
                        x: newArcParams.x + newArcParams.radius * Math.cos(newArcParams.endAngle),
                        y: newArcParams.y + newArcParams.radius * Math.sin(newArcParams.endAngle)
                    };
                    Object.assign(shape1, { ...newArcParams, p1: newP1, p2: newP2 });
                 } else {
                    console.warn("Could not recalculate arc for new radius.");
                 }
            } else if (el1.shapeType === 'slot') {
                shape1.radius = newValue;
            }
            break;
        case 'slot_radius': // For slot - This case was missing
            if (shape1.type === 'slot') {
                shape1.radius = newValue;
            }
            break; 
        case 'ellipse_width':
            if (shape1.type === 'ellipse') {
                shape1.radiusX = newValue / 2; // newValue is in pixels
            }
            break;
        case 'ellipse_height':
            if (shape1.type === 'ellipse') {
                shape1.radiusY = newValue / 2; // newValue is in pixels
            }
            break;
        case 'polygon_side_length':
            if (shape1.type === 'regularPolygon') {
                // To change the side length, we must change the polygon's radius.
                // sideLength = 2 * vertexRadius * sin(PI / sides)
                // vertexRadius = sideLength / (2 * sin(PI / sides))
                let newVertexRadius = newValue / (2 * Math.sin(Math.PI / shape1.sides));

                if (shape1.inscribed === true) { // Inscribed (tangent)
                    // We need to find the new base radius (apothem)
                    shape1.radius = newVertexRadius * Math.cos(Math.PI / shape1.sides);
                } else { // Circumscribed (corners on circle)
                    shape1.radius = newVertexRadius;
                }

                // Now, update the associated construction circle
                const constructionCircle = circles.find(c => c.parentId === shape1.id && c.isConstruction);
                if (constructionCircle) {
                    constructionCircle.radius = shape1.radius;
                }
            }
            break;

        case 'line': // This handles single edges, like rectangle sides
            if (shape1.type === 'rectangle') {
                if (el1.side === 'top' || el1.side === 'bottom') {
                    shape1.width = newValue; // newValue is in pixels
                } else if (el1.side === 'left' || el1.side === 'right') {
                    shape1.height = newValue; // newValue is in pixels
                }
            } else if (shape1.type === 'polygon') {
                // Anchor p1, move p2
                const line = shape1.lines[el1.lineIndex];
                const p1 = { x: line.x1, y: line.y1 };
                const p2 = { x: line.x2, y: line.y2 };
                const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                const newP2 = {
                    x: p1.x + Math.cos(angle) * newValue, // newValue is in pixels
                    y: p1.y + Math.sin(angle) * newValue,
                };
                
                const dx = newP2.x - p2.x;
                const dy = newP2.y - p2.y;

                moveGeometricPointByLinePoint({shapeId: shape1.id, shapeType: 'polygon', lineIndex: el1.lineIndex}, 'end', dx, dy);
            } else if (shape1.type === 'slot') {
                // Anchor p1, move p2
                const p1 = shape1.p1;
                const p2 = shape1.p2;
                const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                const newP2 = {
                    x: p1.x + Math.cos(angle) * newValue,
                    y: p1.y + Math.sin(angle) * newValue,
                };
                shape1.p2.x = newP2.x;
                shape1.p2.y = newP2.y;
            }
            break;

        case 'horizontal':
        case 'vertical':
        case 'aligned':
            const el2 = dim.element2;
            if (!el2) return;
            
            const p1 = getPointFromElementInfo(el1);
            const p2_original = getPointFromElementInfo(el2);
            if (!p1 || !p2_original) return;
 
            let dx = 0, dy = 0;

            if (dim.dimensionType === 'horizontal') {
                const currentDist = Math.abs(p1.x - p2_original.x);
                dx = (newValue - currentDist) * Math.sign(p2_original.x - p1.x);
            } else if (dim.dimensionType === 'vertical') {
                const currentDist = Math.abs(p1.y - p2_original.y);
                dy = (newValue - currentDist) * Math.sign(p2_original.y - p1.y);
            } else { // aligned
                const currentDist = getDistance(p1, p2_original);
                const error = newValue - currentDist;
                const angle = Math.atan2(p2_original.y - p1.y, p2_original.x - p1.x);
                dx = error * Math.cos(angle);
                dy = error * Math.sin(angle);
            }
            
            // Distribute the movement between the two points for stability
            moveGeometricPoint(el1, -dx / 2, -dy / 2);
            moveGeometricPoint(el2, dx / 2, dy / 2);
            break;
            
        case 'angle': { 
            // Ensure newValue is a valid number before proceeding
            if (isNaN(newValue) || newValue === null) {
                console.error("Invalid value provided for angle dimension update.");
                break;
            }

            const line1_info = getLineFromElementInfo(dim.element1);
            const line2_info = getLineFromElementInfo(dim.element2);
            if (!line1_info || !line2_info) break;
 
            const intersection = findLineIntersection(line1_info, line2_info, false);
            if (!intersection) break;
 
            const p1_far = getDistance(intersection, {x: line1_info.x1, y: line1_info.y1}) > getDistance(intersection, {x: line1_info.x2, y: line1_info.y2}) ? {x: line1_info.x1, y: line1_info.y1} : {x: line1_info.x2, y: line1_info.y2};
            const p2_far = getDistance(intersection, {x: line2_info.x1, y: line2_info.y1}) > getDistance(intersection, {x: line2_info.x2, y: line2_info.y2}) ? {x: line2_info.x1, y: line2_info.y1} : {x: line2_info.x2, y: line2_info.y2};

            const angle1 = Math.atan2(p1_far.y - intersection.y, p1_far.x - intersection.x);
            const angle2_current = Math.atan2(p2_far.y - intersection.y, p2_far.x - intersection.x);

            let angleDiff = normalizeAngle(angle2_current - angle1);
            if (angleDiff > Math.PI) angleDiff = angleDiff - 2 * Math.PI;

            const targetAngleDiff = dim.isReflex ? -Math.sign(angleDiff) * (2 * Math.PI - newValue) : Math.sign(angleDiff) * newValue;
            const rotationAmount = targetAngleDiff - angleDiff;

            const p2_to_rotate = getDistance(intersection, {x: line2_info.x1, y: line2_info.y1}) > getDistance(intersection, {x: line2_info.x2, y: line2_info.y2}) ? {x: line2_info.x1, y: line2_info.y1} : {x: line2_info.x2, y: line2_info.y2};
            const rotatedPoint = rotatePoint(p2_to_rotate, intersection, rotationAmount);
            const dx_rot = rotatedPoint.x - p2_to_rotate.x;
            const dy_rot = rotatedPoint.y - p2_to_rotate.y;
            // We need to move the point that is *further* from the intersection.
            const pointTypeToMove = getDistance(intersection, {x: line2_info.x1, y: line2_info.y1}) < getDistance(intersection, {x: line2_info.x2, y: line2_info.y2}) ? 'end' : 'start';
            moveGeometricPointByLinePoint(dim.element2, pointTypeToMove, dx_rot, dy_rot);
            break;
        }
    }
}

function drawDimensions() {
    const dimensionsToDraw = tempDimension ? [...dimensions, tempDimension] : dimensions;

    dimensionsToDraw.forEach(dim => {
        const isSelected = selectedElement && selectedElement.type === 'dimension' && selectedElement.id === dim.id;
        const isHovered = hoveredElement && hoveredElement.type === 'dimension' && hoveredElement.id === dim.id;
        const isTemp = !dim.hasOwnProperty('id');

        const dimData = getDimensionDrawingData(dim);
        if (!dimData) return;

        const color = isSelected || isHovered ? '#4338ca' : '#4f46e5';
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = isSelected || isHovered || isTemp ? 1.5 / scale : 1 / scale;
        ctx.font = `${20 / scale}px Arial`;
        if (isTemp) ctx.setLineDash([8 / scale, 8 / scale]);

        if (dimData.type === 'diameter') {
            const text = `Ø${pixelsToMm(dimData.value).toFixed(2)}`;
            const leaderLength = 40 / scale;
            const textLineLength = (ctx.measureText(text).width + 10 / scale);

            const cosA = Math.cos(dimData.angle);
            const sinA = Math.sin(dimData.angle);

            // Leader line start point on circle edge
            const startX = dimData.midX + cosA * (dimData.value / 2);
            const startY = dimData.midY + sinA * (dimData.value / 2);

            // Leader line break point
            const breakX = startX + cosA * leaderLength;
            const breakY = startY + sinA * leaderLength;

            // Determine text alignment and horizontal line direction
            const isLeft = cosA < 0;
            const textLineX = isLeft ? breakX - textLineLength : breakX + textLineLength;

            // Draw leader line
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(breakX, breakY);
            ctx.lineTo(textLineX, breakY);
            ctx.stroke();

            // Draw arrowhead pointing to the circle
            drawArrowhead(breakX, breakY, startX, startY, color);

            // Draw text
            ctx.textAlign = isLeft ? 'right' : 'left';
            ctx.textBaseline = 'bottom';
            ctx.fillText(text, breakX + (isLeft ? -5/scale : 5/scale), breakY - 5/scale);
        } else if (dimData.type === 'radius') {
            const text = `R${pixelsToMm(dimData.value).toFixed(2)}mm`;
            const leaderLength = 60 / scale;
            const textLineLength = (ctx.measureText(text).width + 10 / scale);

            const cosA = Math.cos(dimData.angle);
            const sinA = Math.sin(dimData.angle);

            // Correctly calculate the point on the arc's edge
            const startX = dimData.p1.x + cosA * dimData.value;
            const startY = dimData.p1.y + sinA * dimData.value;

            // Leader line break point
            const breakX = startX + cosA * (leaderLength / 2); // Use a shorter leader before the break
            const breakY = startY + sinA * (leaderLength / 2);

            // Determine text alignment and horizontal line direction
            const isLeft = cosA < 0;
            const textLineX = isLeft ? breakX - textLineLength : breakX + textLineLength;

            // Draw leader line
            ctx.beginPath();
            ctx.moveTo(dimData.p1.x, dimData.p1.y); // Start from center
            ctx.lineTo(breakX, breakY);
            ctx.lineTo(textLineX, breakY);
            ctx.stroke();
            
            drawArrowhead(breakX, breakY, startX, startY, color);

            // Draw text
            ctx.textAlign = isLeft ? 'right' : 'left';
            ctx.textBaseline = 'bottom';
            ctx.fillText(text, breakX + (isLeft ? -5/scale : 5/scale), breakY - 5/scale);
        } else if (dimData.type === 'angle') {
            // --- NEW: Enhanced Angle Dimension Drawing ---
            const text = `${(dimData.value * 180 / Math.PI).toFixed(2)}°`;
            const textWidth = ctx.measureText(text).width;
            const textAngle = dimData.startAngle + (dimData.endAngle - dimData.startAngle) / 2;

            // Calculate gap for the text
            const textArcAngle = textWidth / dim.offset;
            const gapStartAngle = textAngle - textArcAngle / 2;
            const gapEndAngle = textAngle + textArcAngle / 2;

            // Draw the first part of the arc
            ctx.beginPath();
            ctx.arc(dimData.p1.x, dimData.p1.y, dim.offset, dimData.startAngle, gapStartAngle);
            ctx.stroke();

            // Draw the second part of the arc
            ctx.beginPath();
            ctx.arc(dimData.p1.x, dimData.p1.y, dim.offset, gapEndAngle, dimData.endAngle);
            ctx.stroke();

            // Draw arrowheads
            const startPoint = { x: dimData.p1.x + dim.offset * Math.cos(dimData.startAngle), y: dimData.p1.y + dim.offset * Math.sin(dimData.startAngle) };
            const endPoint = { x: dimData.p1.x + dim.offset * Math.cos(dimData.endAngle), y: dimData.p1.y + dim.offset * Math.sin(dimData.endAngle) };
            const startTangent = dimData.startAngle - Math.PI / 2;
            const endTangent = dimData.endAngle + Math.PI / 2;
            drawArrowhead(startPoint.x - Math.cos(startTangent), startPoint.y - Math.sin(startTangent), startPoint.x, startPoint.y, color);
            drawArrowhead(endPoint.x - Math.cos(endTangent), endPoint.y - Math.sin(endTangent), endPoint.x, endPoint.y, color);

            // Draw the text in the gap
            const textX = dimData.p1.x + Math.cos(textAngle) * dim.offset;
            const textY = dimData.p1.y + Math.sin(textAngle) * dim.offset;
            ctx.save();
            ctx.translate(textX, textY);
            ctx.rotate(textAngle > Math.PI / 2 || textAngle < -Math.PI / 2 ? textAngle - Math.PI : textAngle);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(text, 0, 0);
            ctx.restore();
        } else {
            const text = `${pixelsToMm(dimData.value).toFixed(2)}mm`;
            const textWidth = ctx.measureText(text).width;
            const cosA = Math.cos(dimData.angle);
            const sinA = Math.sin(dimData.angle);

            const dimLineP1 = { x: dimData.midX - cosA * dimData.value / 2, y: dimData.midY - sinA * dimData.value / 2 };
            const dimLineP2 = { x: dimData.midX + cosA * dimData.value / 2, y: dimData.midY + sinA * dimData.value / 2 };

            ctx.beginPath();
            if (dim.dimensionType === 'horizontal') {
                ctx.moveTo(dimData.p1.x, dimData.p1.y); ctx.lineTo(dimData.p1.x, dimData.midY);
                ctx.moveTo(dimData.p2.x, dimData.p2.y); ctx.lineTo(dimData.p2.x, dimData.midY);
            } else if (dim.dimensionType === 'vertical') {
                ctx.moveTo(dimData.p1.x, dimData.p1.y); ctx.lineTo(dimData.midX, dimData.p1.y);
                ctx.moveTo(dimData.p2.x, dimData.p2.y); ctx.lineTo(dimData.midX, dimData.p2.y);
            } else {
                ctx.moveTo(dimData.p1.x, dimData.p1.y); ctx.lineTo(dimLineP1.x, dimLineP1.y);
                ctx.moveTo(dimData.p2.x, dimData.p2.y); ctx.lineTo(dimLineP2.x, dimLineP2.y);
            }
            ctx.stroke();

            const totalGap = textWidth + 10 / scale;
            const startGap = { x: dimData.midX - cosA * (totalGap / 2), y: dimData.midY - sinA * (totalGap / 2) };
            const endGap = { x: dimData.midX + cosA * (totalGap / 2), y: dimData.midY + sinA * (totalGap / 2) };
            ctx.beginPath();
            ctx.moveTo(dimLineP1.x, dimLineP1.y); ctx.lineTo(startGap.x, startGap.y);
            ctx.moveTo(endGap.x, endGap.y); ctx.lineTo(dimLineP2.x, dimLineP2.y);
            ctx.stroke();

            drawArrowhead(dimLineP2.x, dimLineP2.y, dimLineP1.x, dimLineP1.y, color);
            drawArrowhead(dimLineP1.x, dimLineP1.y, dimLineP2.x, dimLineP2.y, color);

            ctx.save();
            ctx.translate(dimData.midX, dimData.midY);
            ctx.rotate(dimData.angle > Math.PI / 2 || dimData.angle < -Math.PI / 2 ? dimData.angle - Math.PI : dimData.angle);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(text, 0, -2 / scale);
            ctx.restore();
        }

        if(isTemp) ctx.setLineDash([]);
    });
}

function drawArrowhead(fromX, fromY, toX, toY, color) {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const headlen = 10 / scale;
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
}