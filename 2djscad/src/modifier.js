// ===============================================
// Modifier Logic
// ===============================================
function handleModifierClick(x, y) {
    const element = getGeometricElementAt(x, y);

    if (currentTool === 'trim') {
        if (element && element.type === 'edge') {
            performSmartTrim(element, x, y);
        }
    } else if (currentTool === 'offset') {
        const shapeInfo = findShapeAt(x, y);
        if (shapeInfo && (shapeInfo.type === 'rectangle' || shapeInfo.type === 'circle' || shapeInfo.type === 'polygon')) {
            firstElementForModifier = findShapeById(shapeInfo.id, shapeInfo.type);
            modifierModalTitle.textContent = 'Offset Distance';
            modifierLabel.textContent = 'Distance (mm)';
            chamferOptions.style.display = 'none';
            offsetOptions.style.display = 'block';
            modifierModal.style.display = 'flex';
            modifierValueInput.focus();
        }
    } else if (currentTool === 'fillet' || currentTool === 'chamfer') {
        if (element && element.type === 'edge') {
            if (modifierStep === 0) {
                firstElementForModifier = element;
                modifierStep = 1;
            } else {
                if (firstElementForModifier.shapeId === element.shapeId) {
                    secondElementForModifier = element;
                    modifierModalTitle.textContent = currentTool === 'fillet' ? 'Fillet Radius' : 'Chamfer Distance';
                    modifierLabel.textContent = currentTool === 'fillet' ? 'Radius (mm)' : 'Distance (mm)';
                    offsetOptions.style.display = 'none';
                    chamferOptions.style.display = currentTool === 'chamfer' ? 'block' : 'none';
                    modifierModal.style.display = 'flex';
                    modifierValueInput.focus();
                } else {
                    resetModifier();
                }
            }
        }
    }
}


function resetModifier() {
    modifierStep = 0;
    firstElementForModifier = null;
    secondElementForModifier = null;
}

function performSmartTrim(elementToTrim, clickX, clickY) {
    // This is a simplified trim and will be improved.
    const shapeToTrim = findShapeById(elementToTrim.shapeId, elementToTrim.shapeType);
    if (!shapeToTrim) return;

    if (shapeToTrim.type === 'polygon') {
        const originalLine = getLineFromElementInfo(elementToTrim);
        if (!originalLine) return;
        
        let lineToTrim = {...originalLine};
        let intersections = [];

        polygons.forEach(p => p.lines.forEach(otherLine => { 
            if (p.id !== shapeToTrim.id) {
                const intersection = findLineIntersection(lineToTrim, otherLine, true);
                if (intersection) intersections.push(intersection);
            }
        }));
        
        if (intersections.length === 0) return;

        let closestIntersection = intersections[0];
        let minDistance = getDistance({x: clickX, y: clickY}, closestIntersection);
        intersections.forEach(i => {
            const dist = getDistance({x: clickX, y: clickY}, i);
            if (dist < minDistance) {
                minDistance = dist;
                closestIntersection = i;
            }
        });
        
        if (getDistance({x: clickX, y: clickY}, {x: lineToTrim.x1, y: lineToTrim.y1}) < getDistance({x: clickX, y: clickY}, {x: lineToTrim.x2, y: lineToTrim.y2})) {
            lineToTrim.x1 = closestIntersection.x;
            lineToTrim.y1 = closestIntersection.y;
        } else {
            lineToTrim.x2 = closestIntersection.x;
            lineToTrim.y2 = closestIntersection.y;
        }
        
        shapeToTrim.lines[elementToTrim.lineIndex] = lineToTrim;
        saveState();
        draw();
    }
}

function performPolygonOffset(polygon, offset) {
    if (polygon.lines.some(line => line.type === 'arc')) {
        console.warn("Offset for polygons with fillets/arcs is not yet supported.");
        return; 
    }

    if (polygon.isClosed) {
        let area = 0;
        for (let i = 0; i < polygon.lines.length; i++) {
            const p1 = {x: polygon.lines[i].x1, y: polygon.lines[i].y1};
            const p2 = {x: polygon.lines[i].x2, y: polygon.lines[i].y2};
            area += (p1.x * p2.y - p2.x * p1.y);
        }
        
        const effectiveOffset = (area > 0) ? -offset : offset;

        const offsetLines = polygon.lines.map(line => {
            const dx = line.x2 - line.x1;
            const dy = line.y2 - line.y1;
            const length = Math.sqrt(dx*dx + dy*dy);
            if(length === 0) return null;
            const normalX = -dy / length;
            const normalY = dx / length;
            return {
                x1: line.x1 + normalX * effectiveOffset, y1: line.y1 + normalY * effectiveOffset,
                x2: line.x2 + normalX * effectiveOffset, y2: line.y2 + normalY * effectiveOffset
            };
        }).filter(l => l !== null);
        
        const newVertices = [];
        for (let i = 0; i < offsetLines.length; i++) {
            const intersection = findLineIntersection(offsetLines[i], offsetLines[(i + 1) % offsetLines.length], false);
            if (intersection) newVertices.push(intersection);
            else { console.warn("Offset failed due to parallel segments."); return; }
        }

        if (newVertices.length > 2) {
            const newLines = newVertices.map((v, i) => ({ x1: v.x, y1: v.y, x2: newVertices[(i + 1) % newVertices.length].x, y2: newVertices[(i + 1) % newVertices.length].y }));
            polygons.push({ id: polygonIdCounter++, isClosed: true, type: 'polygon', lines: newLines, ...polygon });
            saveState();
        }
    } 
}

function performRectangleOffset(rect, offset) {
    rectangles.push({
        id: rectangleIdCounter++, type: 'rectangle',
        x: rect.x - offset, y: rect.y - offset,
        width: rect.width + 2 * offset, height: rect.height + 2 * offset,
        ...rect
    });
    saveState();
}

function performCircleOffset(circle, offset) {
    const newRadius = circle.radius + offset;
    if (newRadius > 0) {
         circles.push({ id: circleIdCounter++, type: 'circle', x: circle.x, y: circle.y, radius: newRadius, ...circle });
        saveState();
    }
}

function performChamfer(line1Info, line2Info, distance, angle) {
     const polygon = findShapeById(line1Info.shapeId, 'polygon');
     if(!polygon) return;
     
     let line1 = polygon.lines[line1Info.lineIndex];
     let line2 = polygon.lines[line2Info.lineIndex];
     
     let commonVertex, p1_other, p2_other;
     if (getDistance({x: line1.x1, y: line1.y1}, {x: line2.x1, y: line2.y1}) < 1) { commonVertex = {x: line1.x1, y: line1.y1}; p1_other = {x: line1.x2, y: line1.y2}; p2_other = {x: line2.x2, y: line2.y2}; }
     else if (getDistance({x: line1.x1, y: line1.y1}, {x: line2.x2, y: line2.y2}) < 1) { commonVertex = {x: line1.x1, y: line1.y1}; p1_other = {x: line1.x2, y: line1.y2}; p2_other = {x: line2.x1, y: line2.y1}; }
     else if (getDistance({x: line1.x2, y: line1.y2}, {x: line2.x1, y: line2.y1}) < 1) { commonVertex = {x: line1.x2, y: line1.y2}; p1_other = {x: line1.x1, y: line1.y1}; p2_other = {x: line2.x2, y: line2.y2}; }
     else if (getDistance({x: line1.x2, y: line1.y2}, {x: line2.x2, y: line2.y2}) < 1) { commonVertex = {x: line1.x2, y: line1.y2}; p1_other = {x: line1.x1, y: line1.y1}; p2_other = {x: line2.x1, y: line2.y1}; }
     else { console.warn("Selected lines do not share a common vertex."); return; }
     
     const v1x = p1_other.x - commonVertex.x;
     const v1y = p1_other.y - commonVertex.y;
     const len1 = getDistance(p1_other, commonVertex);
     if (distance > len1) distance = len1;
     
     const chamferP1 = {x: commonVertex.x + (v1x/len1) * distance, y: commonVertex.y + (v1y/len1) * distance};
     
     const chamferLineAngle = Math.atan2(v1y, v1x) + (v1x * (p2_other.y - commonVertex.y) - v1y * (p2_other.x - commonVertex.x) < 0 ? 1 : -1) * angle * Math.PI / 180;
     const chamferLineRay = { x1: chamferP1.x, y1: chamferP1.y, x2: chamferP1.x + Math.cos(chamferLineAngle), y2: chamferP1.y + Math.sin(chamferLineAngle) };
     const chamferP2 = findLineIntersection(chamferLineRay, {x1: commonVertex.x, y1: commonVertex.y, x2: p2_other.x, y2: p2_other.y}, false);

     if (!chamferP2 || getDistance(commonVertex, chamferP2) > getDistance(commonVertex, p2_other)) { console.warn("Chamfer angle results in an invalid intersection."); return; }
     
     if (getDistance(commonVertex, {x:line1.x1, y:line1.y1}) < 1) { line1.x1 = chamferP1.x; line1.y1 = chamferP1.y; } else { line1.x2 = chamferP1.x; line1.y2 = chamferP1.y; }
     if (getDistance(commonVertex, {x:line2.x1, y:line2.y1}) < 1) { line2.x1 = chamferP2.x; line2.y1 = chamferP2.y; } else { line2.x2 = chamferP2.x; line2.y2 = chamferP2.y; }
     
     polygon.lines.splice(Math.max(line1Info.lineIndex, line2Info.lineIndex), 0, {x1: chamferP1.x, y1: chamferP1.y, x2: chamferP2.x, y2: chamferP2.y});
     saveState();
}

function performFillet(line1Info, line2Info, radius) {
    const polygon = findShapeById(line1Info.shapeId, 'polygon');
     if(!polygon) return;
     
     let line1 = polygon.lines[line1Info.lineIndex];
     let line2 = polygon.lines[line2Info.lineIndex];
     
     let commonVertex, p1_other, p2_other;
     if (getDistance({x: line1.x1, y: line1.y1}, {x: line2.x1, y: line2.y1}) < 1) { commonVertex = {x: line1.x1, y: line1.y1}; p1_other = {x: line1.x2, y: line1.y2}; p2_other = {x: line2.x2, y: line2.y2}; }
     else if (getDistance({x: line1.x1, y: line1.y1}, {x: line2.x2, y: line2.y2}) < 1) { commonVertex = {x: line1.x1, y: line1.y1}; p1_other = {x: line1.x2, y: line1.y2}; p2_other = {x: line2.x1, y: line2.y1}; }
     else if (getDistance({x: line1.x2, y: line1.y2}, {x: line2.x1, y: line2.y1}) < 1) { commonVertex = {x: line1.x2, y: line1.y2}; p1_other = {x: line1.x1, y: line1.y1}; p2_other = {x: line2.x2, y: line2.y2}; }
     else if (getDistance({x: line1.x2, y: line1.y2}, {x: line2.x2, y: line2.y2}) < 1) { commonVertex = {x: line1.x2, y: line1.y2}; p1_other = {x: line1.x1, y: line1.y1}; p2_other = {x: line2.x1, y: line2.y1}; }
     else { console.warn("Selected lines do not share a common vertex."); return; }
     
     const v1x = p1_other.x - commonVertex.x, v1y = p1_other.y - commonVertex.y;
     const v2x = p2_other.x - commonVertex.x, v2y = p2_other.y - commonVertex.y;
     
     const angle1 = Math.atan2(v1y, v1x);
     let angleBetween = Math.atan2(v2y, v2x) - angle1;
     if (angleBetween > Math.PI) angleBetween -= 2 * Math.PI;
     if (angleBetween < -Math.PI) angleBetween += 2 * Math.PI;

     const tangentDist = Math.abs(radius / Math.tan(angleBetween / 2));
     
     if (tangentDist > getDistance(commonVertex, p1_other) || tangentDist > getDistance(commonVertex, p2_other)) { console.warn("Fillet radius too large"); return; }
     const tangentP1 = {x: commonVertex.x + (v1x/getDistance(p1_other, commonVertex)) * tangentDist, y: commonVertex.y + (v1y/getDistance(p1_other, commonVertex)) * tangentDist};
     const tangentP2 = {x: commonVertex.x + (v2x/getDistance(p2_other, commonVertex)) * tangentDist, y: commonVertex.y + (v2y/getDistance(p2_other, commonVertex)) * tangentDist};

     const bisectorAngle = angle1 + angleBetween / 2;
     const centerDist = Math.sqrt(tangentDist*tangentDist + radius*radius);
     const arcCenter = { x: commonVertex.x + Math.cos(bisectorAngle) * centerDist, y: commonVertex.y + Math.sin(bisectorAngle) * centerDist };
     
     const filletArc = { type: 'arc', cx: arcCenter.x, cy: arcCenter.y, radius, startAngle: Math.atan2(tangentP1.y - arcCenter.y, tangentP1.x - arcCenter.x), endAngle: Math.atan2(tangentP2.y - arcCenter.y, tangentP2.x - arcCenter.x), clockwise: angleBetween < 0 };

     if (getDistance(commonVertex, {x:line1.x1, y:line1.y1}) < 1) { line1.x1 = tangentP1.x; line1.y1 = tangentP1.y; } else { line1.x2 = tangentP1.x; line1.y2 = tangentP1.y; }
     if (getDistance(commonVertex, {x:line2.x1, y:line2.y1}) < 1) { line2.x1 = tangentP2.x; line2.y1 = tangentP2.y; } else { line2.x2 = tangentP2.x; line2.y2 = tangentP2.y; }

     polygon.lines.splice(Math.max(line1Info.lineIndex, line2Info.lineIndex), 0, filletArc);
     saveState();
}

okModifierButton.addEventListener('click', () => {
    const value = parseFloat(modifierValueInput.value);
    if(isNaN(value)) return;
    
    const valueInPixels = mmToPixels(value);

    if(currentTool === 'offset' && firstElementForModifier) {
         const effectiveOffset = inverseOffsetCheckbox.checked ? -valueInPixels : valueInPixels;
         switch(firstElementForModifier.type) {
            case 'polygon': performPolygonOffset(firstElementForModifier, effectiveOffset); break;
            case 'rectangle': performRectangleOffset(firstElementForModifier, effectiveOffset); break;
            case 'circle': performCircleOffset(firstElementForModifier, effectiveOffset); break;
        }
    } else if (currentTool === 'fillet' && firstElementForModifier && secondElementForModifier) {
        performFillet(firstElementForModifier, secondElementForModifier, valueInPixels);
    } else if (currentTool === 'chamfer' && firstElementForModifier && secondElementForModifier) {
        const angle = parseFloat(chamferAngleInput.value);
        if (isNaN(angle)) return;
        performChamfer(firstElementForModifier, secondElementForModifier, valueInPixels, angle);
    }

    modifierModal.style.display = 'none';
    resetModifier();
    draw();
});

cancelModifierButton.addEventListener('click', () => {
    modifierModal.style.display = 'none';
    resetModifier();
});