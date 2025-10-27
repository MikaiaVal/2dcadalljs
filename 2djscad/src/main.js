// ===============================================
// Get DOM Elements
// ===============================================
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const undoButton = document.getElementById('undoButton');
const redoButton = document.getElementById('redoButton');
const gridButton = document.getElementById('gridButton');
const selectTool = document.getElementById('selectTool');
const lineTool = document.getElementById('lineTool');
const rectangleTool = document.getElementById('rectangleTool');
const circleTool = document.getElementById('circleTool');
const arcTool = document.getElementById('arcTool');
const ellipseTool = document.getElementById('ellipseTool');
const splineTool = document.getElementById('splineTool');
const slotTool = document.getElementById('slotTool');
const polygonTool = document.getElementById('polygonTool');
const dimensionTool = document.getElementById('dimensionTool');
const coincidentConstraintTool = document.getElementById('coincidentConstraintTool');
const tangentConstraintTool = document.getElementById('tangentConstraintTool');
const fixConstraintTool = document.getElementById('fixConstraintTool');
const horizontalConstraintTool = document.getElementById('horizontalConstraintTool');
const verticalConstraintTool = document.getElementById('verticalConstraintTool');
const parallelConstraintTool = document.getElementById('parallelConstraintTool');
const perpendicularConstraintTool = document.getElementById('perpendicularConstraintTool');
const collinearConstraintTool = document.getElementById('collinearConstraintTool');
const textTool = document.getElementById('textTool');
const trimTool = document.getElementById('trimTool');
const borderToolButton = document.getElementById('borderToolButton');
const offsetTool = document.getElementById('offsetTool');
const filletTool = document.getElementById('filletTool');
const chamferTool = document.getElementById('chamferTool');
const deleteButton = document.getElementById('deleteButton');
const customContextMenu = document.getElementById('customContextMenu');
const endLinesMenuItem = document.getElementById('endLinesMenuItem');
const deleteMenuItem = document.getElementById('deleteMenuItem');
const editDimensionModal = document.getElementById('editDimensionModal');
const dimensionValueInput = document.getElementById('dimensionValueInput');
const dimensionLabel = document.getElementById('dimensionLabel');
const modifierModal = document.getElementById('modifierModal');
const modifierModalTitle = document.getElementById('modifierModalTitle');
const modifierLabel = document.getElementById('modifierLabel');
const modifierValueInput = document.getElementById('modifierValueInput');
const offsetOptions = document.getElementById('offsetOptions');
const inverseOffsetCheckbox = document.getElementById('inverseOffsetCheckbox');
const chamferOptions = document.getElementById('chamferOptions');
const chamferAngleInput = document.getElementById('chamferAngleInput');
const drawToolsButton = document.getElementById('drawToolsButton');
const constraintToolsButton = document.getElementById('constraintToolsButton');
const modifyToolsButton = document.getElementById('modifyToolsButton');
const drawToolsDropdown = document.getElementById('drawToolsDropdown');
const constraintToolsDropdown = document.getElementById('constraintToolsDropdown');
const modifyToolsDropdown = document.getElementById('modifyToolsDropdown');
const activeDrawToolIcon = document.getElementById('activeDrawToolIcon');
const activeConstraintToolIcon = document.getElementById('activeConstraintToolIcon');
const activeModifyToolIcon = document.getElementById('activeModifyToolIcon');
const shapeInspectorPanel = document.getElementById('shapeInspectorPanel');
const lineColorInput = document.getElementById('lineColorInput');
const lineWidthInput = document.getElementById('lineWidthInput');
const lineTypeSelect = document.getElementById('lineTypeSelect');
const inspectorOkButton = document.getElementById('inspectorOkButton');
const inspectorCancelButton = document.getElementById('inspectorCancelButton');
const okEditButton = document.getElementById('okEditButton');
const cancelEditButton = document.getElementById('cancelEditButton');
const paperSizeModal = document.getElementById('paperSizeModal');
const paperSizeSelect = document.getElementById('paperSizeSelect');
const customSizeInputs = document.getElementById('customSizeInputs');
const customWidthInput = document.getElementById('customWidthInput');
const customHeightInput = document.getElementById('customHeightInput');
const landscapeCheckbox = document.getElementById('landscapeCheckbox');
const startDrawingButton = document.getElementById('startDrawingButton');
const borderModal = document.getElementById('borderModal');
const borderOffsetInput = document.getElementById('borderOffsetInput');
const borderThicknessInput = document.getElementById('borderThicknessInput');
const okBorderButton = document.getElementById('okBorderButton');
const cancelBorderButton = document.getElementById('cancelBorderButton');
const polygonSidesModal = document.getElementById('polygonSidesModal');
const polygonSidesInput = document.getElementById('polygonSidesInput');
const okPolygonSidesButton = document.getElementById('okPolygonSidesButton');
const cancelPolygonSidesButton = document.getElementById('cancelPolygonSidesButton');
const inscribedRadio = document.getElementById('inscribedRadio');
const circumscribedRadio = document.getElementById('circumscribedRadio');
const textToolModal = document.getElementById('textToolModal');
const textContentInput = document.getElementById('textContentInput');
const fontSizeInput = document.getElementById('fontSizeInput');
const fontColorInput = document.getElementById('fontColorInput');
const fontFamilySelect = document.getElementById('fontFamilySelect');
const fontBoldButton = document.getElementById('fontBoldButton');
const fontItalicButton = document.getElementById('fontItalicButton');
const fontUnderlineButton = document.getElementById('fontUnderlineButton');
const okTextButton = document.getElementById('okTextButton');
const cancelTextButton = document.getElementById('cancelTextButton');
const textAlignLeftButton = document.getElementById('textAlignLeftButton');
const textAlignCenterButton = document.getElementById('textAlignCenterButton');
const textAlignRightButton = document.getElementById('textAlignRightButton');


// ===============================================
// State Variables
// ===============================================
let isSnapEnabled = true;
let isGridVisible = false;
let scale = 1.0;
let panX = 0; // Renamed from offsetX for clarity
let panY = 0; // Renamed from offsetY for clarity
let isPanning = false;
let lastPointerX = 0;
let lastPointerY = 0;
let currentTool = null;
let isDraggingShape = false;
let isDraggingDimension = false;
let dragStartCoords = { x: 0, y: 0 };
let hoveredElement = null;
let selectedElement = null;
let hoveredGeometricElement = null;
let selectedGeometricElement = null;
let lastRightClickedElement = null;
let tempShape = null;
let editingDimension = null;
let editingShape = null;
let snapPoint = null;
let isDraggingDimensionModal = false;
let dimensionModalOffsetX, dimensionModalOffsetY;
let tempDimension = null;
let constraintCreationStep = 0;
let firstElementForConstraint = null;
let modifierStep = 0;
let firstElementForModifier = null;
let secondElementForModifier = null;
let dimensionCreationStep = 0;
let firstElementForDimension = null;
let secondElementForDimension = null;
let polygons = [];
let currentPolygonLines = null;
let circleIdCounter = 0;
let circles = [];
let polygonIdCounter = 0;
let rectangleIdCounter = 0;
let rectangles = [];
let dimensionIdCounter = 0;
let dimensions = [];
let constraintIdCounter = 0;
let constraints = [];
let arcIdCounter = 0;
let arcs = [];
let ellipseIdCounter = 0;
let ellipses = [];
let splineIdCounter = 0;
let splines = [];
let regularPolygonIdCounter = 0;
let regularPolygons = [];
let slotIdCounter = 0;
let slots = [];
let textIdCounter = 0;
let texts = [];
let currentSplinePoints = null;
let undoStack = [];
let redoStack = [];
let templateBorder = null;

// ===============================================
// Initialization
// ===============================================
const paperSizes = {
    'A1': { width: 594, height: 841 },
    'A2': { width: 420, height: 594 },
    'A3': { width: 297, height: 420 },
    'A4': { width: 210, height: 297 },
    'A5': { width: 148, height: 210 }
};

window.onload = function() {
    paperSizeModal.style.display = 'flex';
};

paperSizeSelect.addEventListener('change', () => {
    if (paperSizeSelect.value === 'custom') {
        customSizeInputs.classList.remove('hidden');
    } else {
        customSizeInputs.classList.add('hidden');
    }
});

startDrawingButton.addEventListener('click', () => {
    let paperWidth, paperHeight;
    const selectedSize = paperSizeSelect.value;

    if (selectedSize === 'custom') {
        paperWidth = parseFloat(customWidthInput.value);
        paperHeight = parseFloat(customHeightInput.value);
    } else {
        paperWidth = paperSizes[selectedSize].width;
        paperHeight = paperSizes[selectedSize].height;
    }

    if (landscapeCheckbox.checked) {
        [paperWidth, paperHeight] = [paperHeight, paperWidth];
    }

    if (!isNaN(paperWidth) && !isNaN(paperHeight) && paperWidth > 0 && paperHeight > 0) {
        setupPaper(mmToPixels(paperWidth), mmToPixels(paperHeight));
        paperSizeModal.style.display = 'none';
        saveState();
        draw();
    } else {
        alert("Please enter valid custom dimensions.");
    }
});

function setupPaper(width, height) {
    // Store the paper dimensions, but don't set the canvas element size here.
    canvas.paperWidth = width;
    canvas.paperHeight = height;

    // Zoom to fit the paper on screen initially
    zoomToFitPaper();
}

function zoomToFitPaper() {
    if (!canvas.paperWidth || !canvas.paperHeight) {
        console.error("Cannot zoom to fit, paper dimensions are not set.");
        return;
    }
    
    const container = document.getElementById('canvas-container');
    const padding = 10; // pixels of padding around the paper
    const viewWidth = container.clientWidth - padding * 2;
    const viewHeight = container.clientHeight - padding * 2;

    const scaleX = viewWidth / canvas.paperWidth;
    const scaleY = viewHeight / canvas.paperHeight;
    scale = Math.min(scaleX, scaleY);

    // Center the paper in the view
    panX = (container.clientWidth / 2) - (canvas.paperWidth / 2) * scale;
    panY = (container.clientHeight / 2) - (canvas.paperHeight / 2) * scale;
}

window.addEventListener('resize', () => {
    // On resize, we just need to redraw. The draw() function will handle the new canvas size.
    draw();
});

zoomFitButton.addEventListener('click', () => {
    zoomToFitPaper();
    draw();
});
function draw() {
    // Make the canvas element fill its container on every frame.
    // This ensures crisp rendering and correct coordinate mapping.
    const container = document.getElementById('canvas-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    ctx.fillStyle = '#d1d5db'; // A neutral gray background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(panX, panY); // 1. Apply pan (translation)
    ctx.scale(scale, scale);   // 2. Apply zoom (scaling)

    drawPaperAndGrid(); // Draw the paper background and grid first
    drawTemplateBorder();
    drawPolygons();
    drawCircles();
    drawRectangles();
    drawArcs();
    drawEllipses();
    drawSplines();
    drawRegularPolygons();
    drawSlots();
    drawTexts();
    drawDimensions();
    drawConstraints();
    drawTempShape();
    drawHighlights();
    drawSnapPoint();
    
    ctx.restore();

    // Rulers can be added back here if needed, drawn in screen space.
}

function drawPaperAndGrid() {
    if (!canvas.paperWidth || !canvas.paperHeight) return;

    // 1. Draw the paper background with a shadow for depth
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.paperWidth, canvas.paperHeight);
    ctx.restore();

    // 2. Draw the grid (if enabled)
    if (isGridVisible) {
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1 / scale;
        
        const gridSize = mmToPixels(10); // Grid lines every 10mm

        for (let x = gridSize; x < canvas.paperWidth; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.paperHeight);
            ctx.stroke();
        }
        for (let y = gridSize; y < canvas.paperHeight; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.paperWidth, y);
            ctx.stroke();
        }
    }
}

function drawTemplateBorder() {
    if (templateBorder) {
        ctx.strokeStyle = templateBorder.color;
        ctx.lineWidth = templateBorder.lineWidth / scale;
        ctx.setLineDash([]);
        ctx.strokeRect(templateBorder.x, templateBorder.y, templateBorder.width, templateBorder.height);
    }
}

function drawHighlights() {
    // This function draws highlights for hovered and selected geometric elements.
    // It's designed to handle multiple highlights at once, like when creating a constraint.

    const elementsToDraw = new Set();
    if (hoveredGeometricElement) elementsToDraw.add(hoveredGeometricElement);
    if (selectedGeometricElement) elementsToDraw.add(selectedGeometricElement);
    if (firstElementForConstraint) elementsToDraw.add(firstElementForConstraint);
    if (firstElementForDimension) elementsToDraw.add(firstElementForDimension);

    // Determine which elements are "selected" for styling purposes.
    const selectedElementsSet = new Set();
    if (selectedGeometricElement) selectedElementsSet.add(selectedGeometricElement);
    if (firstElementForConstraint) selectedElementsSet.add(firstElementForConstraint);
    if (firstElementForDimension) selectedElementsSet.add(firstElementForDimension);

    elementsToDraw.forEach(element => {
        if (!element) return;

        // An element is "selected" if it's in our set of selected items.
        // Otherwise, it's just being hovered over.
        const isSelected = selectedElementsSet.has(element);

        ctx.strokeStyle = isSelected ? '#1d4ed8' : '#60a5fa'; // Dark blue for select, light blue for hover
        ctx.fillStyle = isSelected ? '#3b82f6' : '#93c5fd';   // Medium blue for select, lighter for hover
        ctx.lineWidth = (isSelected ? 3 : 2) / scale;

        if (element.type.includes('point') || element.type.includes('center')) {
            const point = getPointFromElementInfo(element);
            if (point) {
                ctx.beginPath();
                ctx.arc(point.x, point.y, (POINT_HOVER_RADIUS + 2) / scale, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
            }
        } else if (element.type.includes('edge') || element.type.includes('contour')) {
            const line = getLineFromElementInfo(element);
            if (line) {
                ctx.beginPath();
                ctx.moveTo(line.x1, line.y1);
                ctx.lineTo(line.x2, line.y2);
                ctx.stroke();
            } else if (line.type === 'arc') { // Handle arc segments
                ctx.beginPath();
                ctx.arc(line.cx, line.cy, line.radius, line.startAngle, line.endAngle, line.anticlockwise);
                ctx.stroke();
            } else if (line.type === 'slot_arc') { // Handle slot arc segments
                ctx.beginPath();
                ctx.arc(line.cx, line.cy, line.radius, line.startAngle, line.endAngle);
                ctx.stroke();
            }
        }
    });
}
// ===============================================
// Main Drawing Loop
// ===============================================
// Main Event Handlers (Controller)
// ===============================================

function handlePointerDown(e) {
    e.preventDefault();
    const { x, y } = getCanvasCoordinates(e);

    if (e.button === 1) { // Middle click for panning
        isPanning = true;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        canvas.style.cursor = 'grabbing';
        selectedElement = null;
        return;
    }

    // If right-clicking during a drawing operation, just show the context menu, don't add a point.
    if (e.button === 2 && (currentTool === 'line' || currentTool === 'spline')) {
        // The contextmenu event listener will handle showing the menu.
        return;
    }

    if (e.button === 0 || e.type === 'touchstart') {
        let startX = snapPoint ? snapPoint.x : (isSnapEnabled ? snapToGrid(x) : x);
        let startY = snapPoint ? snapPoint.y : (isSnapEnabled ? snapToGrid(y) : y);

        if (currentTool === 'polygon') {
            tempShape = { type: 'regularPolygon', x: startX, y: startY, radius: 0, sides: tempShape.sides, inscribed: tempShape.inscribed };
        } else if (currentTool === 'line') {
            if (!currentPolygonLines) {
                currentPolygonLines = [{ x1: startX, y1: startY, x2: startX, y2: startY }];
            } else {
                const lastLine = currentPolygonLines[currentPolygonLines.length - 1];
                currentPolygonLines.push({ x1: lastLine.x2, y1: lastLine.y2, x2: startX, y2: startY });
            }
        } else if (currentTool === 'rectangle') {
            tempShape = { type: 'rectangle', x: startX, y: startY, width: 0, height: 0, startX: startX, startY: startY };
        } else if (currentTool === 'circle') {
            tempShape = { type: 'circle', x: startX, y: startY, radius: 0 };
        } else if (currentTool === 'arc') {
            if (!tempShape) { // First click: define start point
                tempShape = { type: 'arc', step: 1, p1: { x: startX, y: startY }, mousePos: {x,y} };
            } else if (tempShape.step === 1) { // Second click: define end point
                tempShape.step = 2;
                tempShape.p2 = { x: startX, y: startY };
            } else if (tempShape.step === 2) { // Third click: define curvature
                const p3 = { x: startX, y: startY };
                const arcParams = calculateArcFromThreePoints(tempShape.p1, tempShape.p2, p3);
                if (arcParams) {
                    arcs.push({
                        id: arcIdCounter++, type: 'arc',
                        p1: { ...tempShape.p1 }, p2: { ...tempShape.p2 }, p3: { ...p3 },
                        cx: arcParams.x, cy: arcParams.y, radius: arcParams.radius,
                        startAngle: arcParams.startAngle, endAngle: arcParams.endAngle,
                        anticlockwise: arcParams.anticlockwise, color: 'black',
                        lineWidth: 2, lineType: 'solid'
                    });
                } else {
                    console.warn("Arc could not be created (points may be collinear).");
                }
                saveState();
                tempShape = null; // Reset after creation
            }
        } else if (currentTool === 'slot') {
            if (!tempShape) { // First click: Start defining the center line
                tempShape = { type: 'slot', step: 1, p1: { x: startX, y: startY }, mousePos: { x: startX, y: startY } };
            } else if (tempShape.step === 1) { // Second click: Finalize the center line
                tempShape.step = 2;
                tempShape.p2 = { x: startX, y: startY };
                tempShape.mousePos = { x: startX, y: startY };
            } else if (tempShape.step === 2) { // Third click: Finalize the slot
                const radius = getDistanceFromLineSegment(startX, startY, tempShape.p1.x, tempShape.p1.y, tempShape.p2.x, tempShape.p2.y);
                slots.push({ id: slotIdCounter++, type: 'slot', p1: { ...tempShape.p1 }, p2: { ...tempShape.p2 }, radius: radius, color: 'black', lineWidth: 2, lineType: 'solid' });
                saveState();
                tempShape = null; // Reset after creation
            }
        } else if (currentTool === 'ellipse') {
            tempShape = { type: 'ellipse', x: startX, y: startY, radiusX: 0, radiusY: 0 };
        } else if (currentTool === 'spline') {
            if (!currentSplinePoints) {
                currentSplinePoints = [{ x: startX, y: startY }];
            }
            currentSplinePoints.push({ x: startX, y: startY });
        } else if (currentTool === 'dimension') {
            handleDimensionClick(x, y);
        } else if (currentTool === 'text') {
            texts.push({ id: textIdCounter++, ...tempShape, x: startX, y: startY });
            saveState();
            tempShape = null;
            // To revert to select tool after placing text, uncomment the next line
            // setActiveTool(selectTool);
        } else if (currentTool && currentTool.includes('Constraint')) {
            handleConstraintClick(x, y);
        } else if (['trim', 'offset', 'fillet', 'chamfer'].includes(currentTool)) {
            handleModifierClick(x, y);
        } else { // Select/Move tool is active
            const clickedGeometricElement = getGeometricElementAt(x, y);
            const clickedDimension = isMouseOverDimension(x, y);

            if (clickedGeometricElement) {
                selectedGeometricElement = clickedGeometricElement;
                selectedElement = { id: clickedGeometricElement.shapeId, type: clickedGeometricElement.shapeType };
            } else {
                selectedGeometricElement = null;
                selectedElement = findShapeAt(x, y);
            }

            if (clickedDimension) {
                isDraggingDimension = true;
                selectedElement = { id: clickedDimension.id, type: 'dimension' };
            } else if (selectedElement) {
                isDraggingShape = true;
                dragStartCoords = { x, y };
            } 
            draw();
        }
    }
}

function handlePointerMove(e) {
    e.preventDefault();
    const { x, y } = getCanvasCoordinates(e);

    if (!isPanning) {
        snapPoint = findSnapPoint(x, y);
    } else {
        snapPoint = null;
    }

    let currentX = snapPoint ? snapPoint.x : x;
    let currentY = snapPoint ? snapPoint.y : y;

    if (isPanning) {
        const dx = e.clientX - lastPointerX;
        const dy = e.clientY - lastPointerY;
        panX += dx;
        panY += dy;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
    } else if (isDraggingShape && selectedElement) {
        const dx = x - dragStartCoords.x;
        const dy = y - dragStartCoords.y;
        const draggedShape = findShapeById(selectedElement.id, selectedElement.type);

        if (draggedShape) {
            // Default move action
            const move = (shape, dx, dy) => {
                const centerX = shape.type === 'arc' ? 'cx' : 'x';
                const centerY = shape.type === 'arc' ? 'cy' : 'y';
                if (shape[centerX] !== undefined) shape[centerX] += dx;
                if (shape[centerY] !== undefined) shape[centerY] += dy;
            };

            move(draggedShape, dx, dy);

            // Check for linked shapes
            if (draggedShape.type === 'regularPolygon') {
                const linkedCircle = circles.find(c => c.parentId === draggedShape.id && c.isConstruction);
                if (linkedCircle) move(linkedCircle, dx, dy);
            } else if (draggedShape.type === 'circle' && draggedShape.isConstruction) {
                const linkedPolygon = regularPolygons.find(p => p.id === draggedShape.parentId);
                if (linkedPolygon) move(linkedPolygon, dx, dy);
            }
        }

        dragStartCoords = { x, y };
        editingShape = true; // Flag that a shape is being modified
        applyConstraints(); // Re-apply constraints during drag
    } else if (isDraggingDimension && selectedElement) {
        const dim = findShapeById(selectedElement.id, 'dimension');
        if (dim) {
            const dimData = getDimensionDrawingData(dim);
            if (dimData) {
                if (dim.dimensionType === 'horizontal' || (dim.dimensionType === 'ellipse_width' && dimData.angle === 0)) {
                    dim.offset += y - dragStartCoords.y;
                } else if (dim.dimensionType === 'vertical' || (dim.dimensionType === 'ellipse_height' && dimData.angle !== 0)) {
                    dim.offset += x - dragStartCoords.x;
                } else if (dim.dimensionType === 'aligned' || dim.dimensionType === 'line' || dim.dimensionType === 'polygon_side_length') {
                    const perpAngle = dimData.angle + Math.PI / 2;
                    const dx = x - dragStartCoords.x;
                    const dy = y - dragStartCoords.y;
                    dim.offset += dx * Math.cos(perpAngle) + dy * Math.sin(perpAngle);
                } else if (dim.dimensionType === 'diameter') {
                    const circle = findShapeById(dim.element1.shapeId, 'circle');
                    if (circle) dim.angle = Math.atan2(y - circle.y, x - circle.x);
                }
                dragStartCoords = { x, y };
            }
        }
    } else if (currentTool === 'line' && currentPolygonLines) {
        const lastLine = currentPolygonLines[currentPolygonLines.length - 1];
        lastLine.x2 = currentX;
        lastLine.y2 = currentY;
    } else if (currentTool === 'spline' && currentSplinePoints) {
        currentSplinePoints[currentSplinePoints.length - 1] = { x: currentX, y: currentY };
    } else if (tempShape) {
        if (tempShape.type === 'circle') tempShape.radius = getDistance({x:tempShape.x, y:tempShape.y}, {x:currentX, y:currentY});
        else if (tempShape.type === 'rectangle') { 
            tempShape.width = currentX - tempShape.startX; 
            tempShape.height = currentY - tempShape.startY; 
        } else if (tempShape.type === 'ellipse') {
            tempShape.radiusX = Math.abs(currentX - tempShape.x);
            tempShape.radiusY = Math.abs(currentY - tempShape.y);
        } else if (tempShape.type === 'arc') {
            tempShape.mousePos = { x, y }; // Use raw mouse coords for smooth preview
        } else if (tempShape.type === 'slot') {
            tempShape.mousePos = { x: currentX, y: currentY };
            if (tempShape.step === 2) {
                // Only calculate radius preview in step 2
                tempShape.radius = getDistanceFromLineSegment(currentX, currentY, tempShape.p1.x, tempShape.p1.y, tempShape.p2.x, tempShape.p2.y);
            }
        } else if (tempShape.type === 'regularPolygon') {
            tempShape.radius = getDistance({x:tempShape.x, y:tempShape.y}, {x:currentX, y:currentY});
        } else if (tempShape.type === 'text') {
            tempShape.x = currentX; tempShape.y = currentY;
        }
    } else if (currentTool === 'dimension' && tempDimension) {
        // Update the temporary dimension's position as the mouse moves
        updateTempDimension(x, y);
    } else {
        // Hover detection logic
        hoveredGeometricElement = getGeometricElementAt(x, y);
        if (hoveredGeometricElement) {
            hoveredElement = { id: hoveredGeometricElement.shapeId, type: hoveredGeometricElement.shapeType };
        } else {
            hoveredElement = findShapeAt(x, y);
        }
        canvas.style.cursor = (hoveredElement || hoveredGeometricElement) ? 'pointer' : 'default';
    }
    draw();
}

function handlePointerUp(e) {
    e.preventDefault();
    isPanning = false;8
    if (isDraggingShape) {
        if (editingShape) { // If a shape was being modified
            applyConstraints(); // Final constraint application
            editingShape = false;
        }
        isDraggingShape = false;
        saveState();
    }
    if (isDraggingDimension) {
        isDraggingDimension = false;
        saveState();
    }
    
    if (e.button === 0) {
        if (tempShape) {
            if (tempShape.type === 'rectangle' && (Math.abs(tempShape.width) > 1 || Math.abs(tempShape.height) > 1)) {
                rectangles.push({ 
                    id: rectangleIdCounter++, type: 'rectangle', 
                    x: tempShape.width < 0 ? tempShape.startX + tempShape.width : tempShape.startX,
                        y: tempShape.height < 0 ? tempShape.startY + tempShape.height : tempShape.startY, width: Math.abs(tempShape.width),
                        height: Math.abs(tempShape.height), color: 'black',
                        lineWidth: 2, lineType: 'solid'
                });
                saveState();
            } else if (tempShape.type === 'circle' && tempShape.radius > 1) {
                circles.push({ 
                        id: circleIdCounter++, type: 'circle', x: tempShape.x,
                        y: tempShape.y, radius: tempShape.radius, color: 'black',
                        lineWidth: 2, lineType: 'solid'
                });
                saveState();
            } else if (tempShape.type === 'ellipse' && (tempShape.radiusX > 1 || tempShape.radiusY > 1)) {
                ellipses.push({
                    id: ellipseIdCounter++, type: 'ellipse',
                    x: tempShape.x, y: tempShape.y,
                    radiusX: tempShape.radiusX, radiusY: tempShape.radiusY,
                        color: 'black', lineWidth: 2, lineType: 'solid'
                });
                saveState();
            } else if (tempShape.type === 'regularPolygon' && tempShape.radius > 1) {
                const polygonId = regularPolygonIdCounter++;
                // Create the construction circle as a separate entity
                circles.push({
                    id: circleIdCounter++, type: 'circle',
                    x: tempShape.x, y: tempShape.y, radius: tempShape.radius,
                    color: '#a0aec0', lineWidth: 1, lineType: 'dashed',
                    isConstruction: true, // Custom flag
                    parentId: polygonId, parentType: 'regularPolygon' // Link to the polygon
                });
                // Create the polygon
                regularPolygons.push({
                    id: polygonId, type: 'regularPolygon',
                    x: tempShape.x, y: tempShape.y, radius: tempShape.radius,
                    sides: tempShape.sides, 
                    inscribed: tempShape.inscribed,
                    color: 'black', lineWidth: 2, lineType: 'solid'
                });
                saveState();
            }

            if (tempShape && !['arc', 'slot', 'text'].includes(tempShape.type)) {
                tempShape = null;
            }
        }
    }
    draw();
}

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const mouseX_screen = e.clientX - rect.left;
    const mouseY_screen = e.clientY - rect.top;

    // World coordinates before zoom
    const worldX_before = (mouseX_screen - panX) / scale;
    const worldY_before = (mouseY_screen - panY) / scale;

    const scaleFactor = 1 - e.deltaY * ZOOM_SENSITIVITY;
    const newScale = Math.min(Math.max(0.1, scale * scaleFactor), 20);

    // Calculate new pan to keep the world point under the mouse constant
    panX = mouseX_screen - (worldX_before * newScale);
    panY = mouseY_screen - (worldY_before * newScale);
    
    scale = newScale;

    draw();
});

canvas.addEventListener('mousedown', handlePointerDown);
canvas.addEventListener('touchstart', handlePointerDown);
canvas.addEventListener('mousemove', handlePointerMove);
canvas.addEventListener('touchmove', handlePointerMove);
canvas.addEventListener('mouseup', handlePointerUp);
canvas.addEventListener('touchend', handlePointerUp);

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    
    if (currentTool === 'dimension') {
        resetDimensionCreation();
    }
    if (currentTool && (currentTool.includes('Constraint') || ['trim', 'offset', 'fillet', 'chamfer'].includes(currentTool))) {
        resetConstraintCreation();
        resetModifier();
    }

    const shapeAtCursor = findShapeAt(getCanvasCoordinates(e).x, getCanvasCoordinates(e).y);
    const isDrawingLine = currentTool === 'line' && currentPolygonLines && currentPolygonLines.length > 0;
    const isDrawingSpline = currentTool === 'spline' && currentSplinePoints && currentSplinePoints.length > 0;

    if (currentTool === null && shapeAtCursor) {
        lastRightClickedElement = shapeAtCursor;
        deleteMenuItem.style.display = 'block';
        endLinesMenuItem.style.display = 'none';
        customContextMenu.style.left = `${e.clientX}px`;
        customContextMenu.style.top = `${e.clientY}px`;
        customContextMenu.style.display = 'block';
    } else if(isDrawingLine || isDrawingSpline){
        endLinesMenuItem.style.display = 'block';
        deleteMenuItem.style.display = 'none';
        customContextMenu.style.left = `${e.clientX}px`;
        customContextMenu.style.top = `${e.clientY}px`;
        customContextMenu.style.display = 'block';
    }
});

canvas.addEventListener('dblclick', (e) => {
    if (currentTool !== null) return;
    const { x, y } = getCanvasCoordinates(e);
    
    const clickedDimension = isMouseOverDimension(x, y);
    if (clickedDimension) {
        editingDimension = clickedDimension;
        const dimData = getDimensionDrawingData(clickedDimension);
        if (dimData) {
            if (dimData.type === 'angle') {
                dimensionLabel.textContent = 'New Value (deg or expression)';
                dimensionValueInput.value = (dimData.value * 180 / Math.PI).toFixed(2);
            } else {
                dimensionLabel.textContent = 'New Value (mm or expression)';
                dimensionValueInput.value = pixelsToMm(dimData.value).toFixed(2);
            }
            editDimensionModal.style.display = 'flex';
            dimensionValueInput.focus();
            dimensionValueInput.select();
        }
        return;
    }

    const clickedText = isMouseOverText(x, y);
    if (clickedText) {
        editingShape = clickedText;
        textContentInput.value = editingShape.content;
        fontSizeInput.value = editingShape.size;
        fontColorInput.value = editingShape.color;
        fontFamilySelect.value = editingShape.font;
        fontBoldButton.classList.toggle('active-tool', editingShape.bold);
        fontItalicButton.classList.toggle('active-tool', editingShape.italic);
        fontUnderlineButton.classList.toggle('active-tool', editingShape.underline);
        
        const alignmentButtons = [textAlignLeftButton, textAlignCenterButton, textAlignRightButton];
        alignmentButtons.forEach(btn => btn.classList.remove('active-tool'));
        const activeAlignButton = alignmentButtons.find(btn => btn.dataset.align === (editingShape.align || 'left'));
        if (activeAlignButton) activeAlignButton.classList.add('active-tool');
        textToolModal.style.display = 'flex';
        return;
    }

    const clickedShapeInfo = findShapeAt(x, y);
    if(clickedShapeInfo && clickedShapeInfo.type !== 'dimension') {
        editingShape = findShapeById(clickedShapeInfo.id, clickedShapeInfo.type);
        if (editingShape) {
            lineColorInput.value = editingShape.color || '#22c55e';
            lineWidthInput.value = editingShape.lineWidth || 2;
            lineTypeSelect.value = editingShape.lineType || 'solid';
            shapeInspectorPanel.style.display = 'block';
            lineWidthInput.focus();
            lineWidthInput.select();
        }
    }
});
        
window.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') {
        return;
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElement) {
            deleteElement(selectedElement);
        }
    } else if (e.key === 'Escape') {
        if (currentTool === 'dimension') {
            resetDimensionCreation();
        }
        if (currentTool && (currentTool.includes('Constraint') || ['trim', 'offset', 'fillet', 'chamfer'].includes(currentTool))) {
            resetConstraintCreation();
            resetModifier();
        }
         currentPolygonLines = null;
         currentSplinePoints = null;
         tempShape = null;
         selectedElement = null;
         selectedGeometricElement = null;
         draw();
    }
});


// ===============================================
// UI Listeners (Buttons, Modals, etc.)
// ===============================================
const allToolButtons = document.querySelectorAll('#topBar button');
const toolButtons = [selectTool, lineTool, rectangleTool, circleTool, arcTool, ellipseTool, splineTool, polygonTool, slotTool, textTool, dimensionTool, coincidentConstraintTool, tangentConstraintTool, fixConstraintTool, horizontalConstraintTool, verticalConstraintTool, parallelConstraintTool, perpendicularConstraintTool, collinearConstraintTool, trimTool, offsetTool, filletTool, chamferTool];

function setActiveTool(button) {
    allToolButtons.forEach(btn => {
        btn.classList.remove('active-tool');
        btn.classList.add('bg-gray-200', 'text-gray-800');
        btn.classList.remove('bg-indigo-500', 'text-white');
    });

    const parentDropdown = button.closest('.dropdown-content');
    
    if (parentDropdown) {
         const mainButton = parentDropdown.previousElementSibling;
         mainButton.classList.add('active-tool');
         mainButton.classList.remove('bg-gray-200', 'text-gray-800');
         mainButton.classList.add('bg-indigo-500', 'text-white');
    } else {
         button.classList.add('active-tool');
         button.classList.remove('bg-gray-200', 'text-gray-800');
         button.classList.add('bg-indigo-500', 'text-white');
    }

    const newTool = button.id.replace('Tool', '');

    if (newTool === 'polygon') {
        polygonSidesModal.style.display = 'flex';
        polygonSidesInput.focus();
        // The actual tool change will happen when the modal is confirmed.
    } else {
        currentTool = newTool === 'select' ? null : newTool;
    }
    if (newTool === 'text') {
        // Reset modal to default state for new text
        resetTextModal();
    }
    if (newTool === 'text') {
        textToolModal.style.display = 'flex';
    }
    
    if (drawToolsDropdown.contains(button)) {
        activeDrawToolIcon.innerHTML = button.innerHTML;
    } else if (constraintToolsDropdown.contains(button)) {
        activeConstraintToolIcon.innerHTML = button.innerHTML;
    } else if (modifyToolsDropdown.contains(button)) {
        activeModifyToolIcon.innerHTML = button.innerHTML;
    }
    
    drawToolsDropdown.style.display = 'none';
    constraintToolsDropdown.style.display = 'none';
    modifyToolsDropdown.style.display = 'none';

    resetConstraintCreation();
    resetDimensionCreation();
    resetModifier();
    selectedElement = null;
    selectedGeometricElement = null;
    draw();
}

toolButtons.forEach(button => {
    button.addEventListener('click', () => setActiveTool(button));
});

drawToolsButton.addEventListener('click', () => {
    constraintToolsDropdown.style.display = 'none';
    modifyToolsDropdown.style.display = 'none';
    drawToolsDropdown.style.display = drawToolsDropdown.style.display === 'block' ? 'none' : 'block';
});

constraintToolsButton.addEventListener('click', () => {
    drawToolsDropdown.style.display = 'none';
    modifyToolsDropdown.style.display = 'none';
    constraintToolsDropdown.style.display = constraintToolsDropdown.style.display === 'block' ? 'none' : 'block';
});

modifyToolsButton.addEventListener('click', () => {
    drawToolsDropdown.style.display = 'none';
    constraintToolsDropdown.style.display = 'none';
    modifyToolsDropdown.style.display = modifyToolsDropdown.style.display === 'block' ? 'none' : 'block';
});
        
deleteButton.addEventListener('click', () => {
    if (selectedElement) {
        deleteElement(selectedElement);
    }
});

let isDraggingInspector = false;
let inspectorOffsetX, inspectorOffsetY;

shapeInspectorPanel.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'LABEL') {
        return;
    }
    isDraggingInspector = true;
    inspectorOffsetX = e.clientX - shapeInspectorPanel.offsetLeft;
    inspectorOffsetY = e.clientY - shapeInspectorPanel.offsetTop;
    e.preventDefault();
});
        
document.addEventListener('mousemove', (e) => {
    if (isDraggingInspector) {
        shapeInspectorPanel.style.left = `${e.clientX - inspectorOffsetX}px`;
        shapeInspectorPanel.style.top = `${e.clientY - inspectorOffsetY}px`;
    }
    if (isDraggingDimensionModal) {
        editDimensionModal.style.left = `${e.clientX - dimensionModalOffsetX}px`;
        editDimensionModal.style.top = `${e.clientY - dimensionModalOffsetY}px`;
    }
});
        
document.addEventListener('mouseup', () => {
    isDraggingInspector = false;
    isDraggingDimensionModal = false;
});
        
inspectorOkButton.addEventListener('click', () => {
    if (editingShape) {
        editingShape.color = lineColorInput.value;
        editingShape.lineWidth = parseInt(lineWidthInput.value, 10);
        editingShape.lineType = lineTypeSelect.value;
        
        shapeInspectorPanel.style.display = 'none';
        editingShape = null;
        saveState();
        draw();
    }
});
        
inspectorCancelButton.addEventListener('click', () => {
    shapeInspectorPanel.style.display = 'none';
    editingShape = null;
});

editDimensionModal.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        applyDimensionChange();
    } else if (e.key === 'Escape') {
        cancelEditButton.click();
    }
});

cancelEditButton.addEventListener('click', () => {
    editDimensionModal.style.display = 'none';
    editingDimension = null;
});

okEditButton.addEventListener('click', applyDimensionChange);

function applyDimensionChange() {
    if (editingDimension) {
        const expression = dimensionValueInput.value;
        const calculatedValue = safeEval(expression);

        if (calculatedValue !== null && !isNaN(calculatedValue)) {
            let finalValueInPixels;
            if (editingDimension.dimensionType === 'angle') {
                finalValueInPixels = calculatedValue * Math.PI / 180; // Convert degrees to radians
            } else {
                finalValueInPixels = mmToPixels(calculatedValue); // Convert mm to pixels
            }
            
            updateShapeFromDimension(editingDimension, finalValueInPixels);
            
            // Update the dimension's value *after* the shape has been changed
            editingDimension.value = finalValueInPixels;
            
            applyConstraints(); // Re-solve constraints after a parametric change
            saveState();
            draw();

            editDimensionModal.style.display = 'none';
            editingDimension = null;
            dimensionValueInput.style.borderColor = ''; // Reset border color
        } else {
            dimensionValueInput.style.borderColor = 'red';
        }
    }
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
                        moveGeometricPoint(el1, dx, dy);
                    }
                    break;
                }
                case 'tangent': {
                    if (!el2) break;
                    const shape2 = findShapeById(el2.shapeId, el2.shapeType);
                    if (!shape2) break;

                    const isShape1Circular = shape1.type === 'circle' || shape1.type === 'arc';
                    const isShape2Circular = shape2.type === 'circle' || shape2.type === 'arc';

                    if (isShape1Circular && isShape2Circular) {
                        // Circle/Arc to Circle/Arc
                        const c1_center = { x: shape1.cx ?? shape1.x, y: shape1.cy ?? shape1.y };
                        const c2_center = { x: shape2.cx ?? shape2.x, y: shape2.cy ?? shape2.y };
                        const dist = getDistance(c1_center, c2_center);
                        const targetDist = shape1.radius + shape2.radius;
                        if (Math.abs(dist - targetDist) > 0.1) {
                            const error = (targetDist - dist) / 2; // Distribute error
                            const angle = Math.atan2(c2_center.y - c1_center.y, c2_center.x - c1_center.x);
                            
                            moveGeometricPoint(el1, -Math.cos(angle) * error, -Math.sin(angle) * error);
                            moveGeometricPoint(el2, Math.cos(angle) * error, Math.sin(angle) * error);
                        }
                    } else {
                        // Circle/Arc to Line
                        const circularShape = isShape1Circular ? shape1 : shape2;
                        const circularElement = isShape1Circular ? el1 : el2;
                        const lineInfo = !isShape1Circular ? el1 : el2;
                        
                        const center = { x: circularShape.cx ?? circularShape.x, y: circularShape.cy ?? circularShape.y };
                        const radius = circularShape.radius;

                        let line = getLineFromElementInfo(lineInfo);
                        if (!line) break;

                        const dist = getDistanceFromLineSegment(center.x, center.y, line.x1, line.y1, line.x2, line.y2);
                        const error = dist - radius;

                        if (Math.abs(error) > 0.1) {
                            const closestPoint = getClosestPointOnLineSegment(center.x, center.y, line.x1, line.y1, line.x2, line.y2);
                            const vec = { x: center.x - closestPoint.x, y: center.y - closestPoint.y };
                            const len = getDistance({x:0, y:0}, vec);
                            if (len < 0.01) break;
                            const moveVec = { x: (vec.x / len) * error, y: (vec.y / len) * error };
                            
                            moveGeometricPoint(circularElement, -moveVec.x, -moveVec.y);
                        }
                    }
                    break;
                }
                case 'horizontal': {
                    const line = getLineFromElementInfo(el1);
                    if (line) {
                        const dy = line.y1 - line.y2;
                        if (Math.abs(dy) > 0.01) {
                            moveGeometricPointByLinePoint(el1, 'end', 0, dy);
                        }
                    }
                    break;
                }
                case 'vertical': {
                    const line = getLineFromElementInfo(el1);
                    if (line) {
                        const dx = line.x1 - line.x2;
                        if (Math.abs(dx) > 0.01) {
                            moveGeometricPointByLinePoint(el1, 'end', dx, 0);
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
                            moveGeometricPoint(el2, 0, dy);
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
                            moveGeometricPoint(el2, dx, 0);
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
                        const angleDiff = angle1 - angle2;
                        const p2_start = { x: line2.x1, y: line2.y1 };
                        const p2_end = { x: line2.x2, y: line2.y2 };
                        const rotated_p2_end = rotatePoint(p2_end, p2_start, angleDiff);
                        const dx = rotated_p2_end.x - p2_end.x;
                        const dy = rotated_p2_end.y - p2_end.y;
                        moveGeometricPointByLinePoint(el2, 'end', dx, dy);
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
                        const p2_start = { x: line2.x1, y: line2.y1 };
                        const p2_end = { x: line2.x2, y: line2.y2 };
                        const rotated_p2_end = rotatePoint(p2_end, p2_start, angleDiff);
                        const dx = rotated_p2_end.x - p2_end.x;
                        const dy = rotated_p2_end.y - p2_end.y;
                        moveGeometricPointByLinePoint(el2, 'end', dx, dy);
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
                    break;
                }
            }
        });
    }
}

gridButton.addEventListener('click', () => {
    isGridVisible = !isGridVisible;
    gridButton.classList.toggle('active-tool');
    draw();
});

window.addEventListener('click', (e) => {
});

shapeInspectorPanel.addEventListener('keydown', (e) => {
     if (e.key === 'Enter') {
        inspectorOkButton.click();
    } else if (e.key === 'Escape') {
        inspectorCancelButton.click();
    }
});

window.addEventListener('click', (e) => {
    if (!drawToolsButton.contains(e.target)) {
        drawToolsDropdown.style.display = 'none';
    }
    if (!constraintToolsButton.contains(e.target)) {
        constraintToolsDropdown.style.display = 'none';
    }
    if (!modifyToolsButton.contains(e.target)) {
        modifyToolsDropdown.style.display = 'none';
    }
    if (!customContextMenu.contains(e.target)) {
         customContextMenu.style.display = 'none';
    }
});

endLinesMenuItem.addEventListener('click', () => {
    if (currentTool === 'line' && currentPolygonLines && currentPolygonLines.length > 0) {
        // The last segment is the "rubber-band" line, so we remove it.
        currentPolygonLines.pop(); 
        
        if (currentPolygonLines.length > 0) {
            polygons.push({ 
                id: polygonIdCounter++, 
                isClosed: false, 
                type: 'polygon', 
                lines: JSON.parse(JSON.stringify(currentPolygonLines)),
                        color: 'black', lineWidth: 2, lineType: 'solid'
            });
            saveState();
        }
        currentPolygonLines = null;
    } else if (currentTool === 'spline' && currentSplinePoints && currentSplinePoints.length > 1) {
        // The last point is the "rubber-band" point, so we remove it.
        currentSplinePoints.pop();
        
        // If there's still more than one point, create the spline.
        if (currentSplinePoints.length > 1) {
            splines.push({
                id: splineIdCounter++, type: 'spline',
                points: JSON.parse(JSON.stringify(currentSplinePoints)),
                color: 'rgb(34, 197, 94)', lineWidth: 2, lineType: 'solid'
            });
            saveState();
        }
        currentSplinePoints = null;
    }
    
    customContextMenu.style.display = 'none';
    draw();
});

modifierModal.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        okModifierButton.click();
    } else if (e.key === 'Escape') {
        cancelModifierButton.click();
    }
});

deleteMenuItem.addEventListener('click', () => {
    if (lastRightClickedElement) {
        deleteElement(lastRightClickedElement);
        lastRightClickedElement = null;
    }
    customContextMenu.style.display = 'none';
});

borderToolButton.addEventListener('click', () => {
    if (canvas.paperWidth && canvas.paperHeight) {
        borderModal.style.display = 'flex';
        borderOffsetInput.focus();
    } else {
        alert("Please set up the paper first before adding a border.");
    }
});

okBorderButton.addEventListener('click', () => {
    const offset = mmToPixels(parseFloat(borderOffsetInput.value));
    const thickness = parseFloat(borderThicknessInput.value);

    templateBorder = {
        x: offset, y: offset,
        width: canvas.paperWidth - 2 * offset,
        height: canvas.paperHeight - 2 * offset,
        lineWidth: thickness, color: 'black'
    };
    borderModal.style.display = 'none';
    draw();
});

cancelBorderButton.addEventListener('click', () => {
    borderModal.style.display = 'none';
});

function resetTextModal() {
    editingShape = null;
    textContentInput.value = '';
    fontSizeInput.value = '24';
    fontColorInput.value = '#000000';
    fontFamilySelect.value = 'Arial';
    fontBoldButton.classList.remove('active-tool');
    fontItalicButton.classList.remove('active-tool');
    fontUnderlineButton.classList.remove('active-tool');

    const alignmentButtons = [textAlignLeftButton, textAlignCenterButton, textAlignRightButton];
    alignmentButtons.forEach(btn => btn.classList.remove('active-tool'));
    textAlignLeftButton.classList.add('active-tool');
}

okTextButton.addEventListener('click', () => {
    const content = textContentInput.value;
    if (!content) {
        alert("Please enter some text.");
        return;
    }

    const activeAlignButton = document.querySelector('#textToolModal button[data-align].active-tool');
    const align = activeAlignButton ? activeAlignButton.dataset.align : 'left';

    const textProperties = {
        content: content,
        size: parseInt(fontSizeInput.value, 10) || 24,
        color: fontColorInput.value,
        font: fontFamilySelect.value,
        bold: fontBoldButton.classList.contains('active-tool'),
        italic: fontItalicButton.classList.contains('active-tool'),
        underline: fontUnderlineButton.classList.contains('active-tool'),
        align: align,
    };

    if (editingShape && editingShape.type === 'text') {
        // Update existing text object
        Object.assign(editingShape, textProperties);
        editingShape = null;
        saveState();
        draw();
    } else {
        // Prepare for placing a new text object
        tempShape = { type: 'text', ...textProperties };
        currentTool = 'text'; // Set tool to text placement mode
    }

    textToolModal.style.display = 'none';
    resetTextModal();
});

cancelTextButton.addEventListener('click', () => {
    textToolModal.style.display = 'none';
    resetTextModal();
});

fontBoldButton.addEventListener('click', () => fontBoldButton.classList.toggle('active-tool'));
fontItalicButton.addEventListener('click', () => fontItalicButton.classList.toggle('active-tool'));
fontUnderlineButton.addEventListener('click', () => fontUnderlineButton.classList.toggle('active-tool'));

const alignmentButtons = [textAlignLeftButton, textAlignCenterButton, textAlignRightButton];
alignmentButtons.forEach(button => {
    button.addEventListener('click', () => {
        alignmentButtons.forEach(btn => btn.classList.remove('active-tool'));
        button.classList.add('active-tool');
    });
});

okPolygonSidesButton.addEventListener('click', () => {
    const sides = parseInt(polygonSidesInput.value, 10);
    if (sides >= 3 && sides <= 16) {
        const inscribed = inscribedRadio.checked;
        currentTool = 'polygon';
        // We store the settings in a temporary shape object.
        // This will be picked up by the handlePointerDown event.
        tempShape = { 
            type: 'polygon_settings', // A temporary type to hold settings
            sides: sides,
            inscribed: inscribed 
        };
        polygonSidesModal.style.display = 'none';
    } else {
        alert('Please enter a number of sides between 3 and 16.');
    }
});

cancelPolygonSidesButton.addEventListener('click', () => {
    polygonSidesModal.style.display = 'none';
});