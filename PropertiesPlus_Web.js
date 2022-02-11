if (typeof PropertiesPlus == 'undefined')
{
    PropertiesPlus = {};
}

// since this process isn't running in FormIt, 
// we need to use integers for object types, so here's a reference list:
"WSM.nUnSpecifiedType = 0;"
"WSM.nBodyType = 1;"
"WSM.nLumpType = 2;"
"WSM.nShellType = 3;"
"WSM.nFaceType = 4;"
"WSM.nLoopType = 5;"
"WSM.nCoedgeType = 6;"
"WSM.nEdgeType = 7;"
"WSM.nVertexType = 8;"
"WSM.nMaterialAttributeType = 9;"
"WSM.nMaterialType = 10;"
"WSM.nCircleAttributeType = 11;"
"WSM.nObjectPropertiesAttributeType = 12;"
"WSM.nTextureType = 13;"
"WSM.nLevelAttributeType = 14;"
"WSM.nLevelType = 15;"
"WSM.nSketchPropertiesType = 16;"
"WSM.nSplineCurveAttributeType = 17;"
"WSM.nCylinderSurfaceAttributeType = 18;"
"WSM.nSphereSurfaceAttributeType = 19;"
"WSM.nExtrudeSurfaceAttributeType = 20;"
"WSM.nImageType = 21;"
"WSM.nSatelliteDataAttributeType = 22;"
"WSM.nGroupType = 23;"
"WSM.nInstanceType = 24;"
"WSM.nLayerAttributeType = 25;"
"WSM.nLayerType = 26;"
"WSM.nGeneratedGeometryInformationType = 27;"
"WSM.nFaceUVDataAttributeType = 28;"
"WSM.nEdgeStyleAttributeType = 29;"
"WSM.nBlendAttributeType = 30;"
"WSM.nStringAttributeType = 31;"
"WSM.nMeshType = 32;"
"WSM.nLineMeshType = 33;"
"WSM.nPointMeshType = 34;"
"WSM.nNumObjectTypes = 35;"

// the maximum number of items to allow
// higher than this, and FormIt could hang while processing the selection set
let maxObjectCount = 1000;

// the current selection
let currentSelectionInfo;

// data that will be updated when the selection or editing history changes
let editingHistory = 0;
let editingGroupName = '';
let editingHistoryInstances = 0;

let objectCount = 0;

let vertexCount = 0;
let edgeCount = 0;
let faceCount = 0;
let bodyCount = 0;
let groupFamilyCount = 0;
let groupInstanceCount = 0;
let identicalGroupInstanceCount = 0;
let meshCount = 0;

let isAnythingSelected = false;
let isOneOrMoreVertices = false;
let isOneOrMoreEdges = false;
let isOneOrMoreFaces = false;
let isOneOrMoreBodies = false;
let isOneOrMoreMeshes = false;
let isOneOrMoreLineMeshes = false;
let isOneOrMorePointMeshes = false;
let isSingleGroupInstance = false;
let isOneOrMoreGroupInstances = false;
let isMultipleGroupInstances = false;

// elements that will be updated (contents or visibility) when the selection or editing history changes
let editingHistoryNameDiv;
let editingHistoryInstancesDiv;

// all object counts
let objectCountDiv;
let objectCountLabel; 
let objectCountHorizontalRule;
// vertices
let vertexCountModule;
let vertexCountModuleID = 'vertexCountModule';
let vertexCountLabelID = 'vertexCountLabel';
let vertexCountLabelPrefix = "Vertices: ";
// edges
let edgeCountModule;
let edgeCountModuleID = 'edgeCountModule';
let edgeCountLabelID = 'edgeCountLabel';
let edgeCountLabelPrefix = "Edges: ";
// faces
let faceCountModule;
let faceCountModuleID = 'faceCountModule';
let faceCountLabelID = 'faceCountLabel';
let faceCountLabelPrefix = "Faces: ";
// bodies
let bodyCountModule;
let bodyCountModuleID = 'bodyCountModule';
let bodyCountLabelID = 'bodyCountLabel';
let bodyCountLabelPrefix = "Bodies: ";
// meshes
let meshCountModule;
let meshCountModuleID = 'meshCountModule';
let meshCountLabelID = 'meshCountLabel';
let meshCountLabelPrefix = "Meshes: ";
// linemeshes
let lineMeshCountModule;
let lineMeshCountModuleID = 'lineMeshCountModule';
let lineMeshCountLabelID = 'lineMeshCountLabel';
let lineMeshCountLabelPrefix = "LineMeshes: ";
// pointmeshes
let pointMeshCountModule;
let pointMeshCountModuleID = 'pointMeshCountModule';
let pointMeshCountLabelID = 'pointMeshCountLabel';
let pointMeshCountLabelPrefix = "PointMeshes: ";
// group instances
let groupInstanceCountModule;
let groupInstanceCountModuleID = 'groupInstanceCountModule';
let groupInstanceCountLabelID = 'groupInstanceCountLabel';
let groupInstanceCountLabelPrefix = "Groups: ";


let singleGroupFamilyDetailsContainerDiv;
let singleGroupInstanceDetailsContainerDiv;
let singleGroupInstaceToolsContainerDiv;

let multiGroupInstanceDetailsContainerDiv;

// ID for the top-level checkbox that controls whether Properties Plus recomputes on selection
let recomputeOnSelectionInputID = 'recomputeOnSelectionInput';

// IDs for containers which may be toggled in certain cases
let disabledStateContainerID = 'disabledStateContainer';
let infoCardsContainerID = 'infoCardsContainer';
let selectionInfoContainerID = 'selectionInfoContainer';

// IDs for inputs whose value will be updated when selection changes
let singleGroupFamilyNameInputID = 'singleGroupFamilyNameInput';
let singleGroupInstanceNameInputID = 'singleGroupInstanceNameInput';
let singleGroupInstancePosXInputID = 'singleGroupInstancePosXInput';
let singleGroupInstancePosYInputID = 'singleGroupInstancePosYInput';
let singleGroupInstancePosZInputID = 'singleGroupInstancePosZInput';
let multiGroupFamilyNameInputID = 'multiGroupFamilyNameInput';
let multiGroupInstanceNameInputID = 'multiGroupInstanceNameInput';

// flag to display work-in-progress features
let displayWIP = false;

// deselect objects by specified type
PropertiesPlus.submitDeselectObjectsByType = function(deselectObjectType)
{
    let args = {
        "objectTypeToDeselect" : deselectObjectType
    }

    window.FormItInterface.CallMethod("PropertiesPlus.deselectObjectsByType", args);
}

// rename a Group family
PropertiesPlus.submitGroupFamilyRename = function()
{
    let args = {
    "singleGroupFamilyRename": singleGroupFamilyNameInput.value,
    "multiGroupFamilyRename": multiGroupFamilyNameInput.value
    }

    window.FormItInterface.CallMethod("PropertiesPlus.renameGroupFamilies", args);
}

// rename a single selected Group instance, or multiple instances
PropertiesPlus.submitGroupInstanceRename = function()
{
    let args = {
    "singleGroupInstanceRename": singleGroupInstanceNameInput.value,
    "multiGroupInstanceRename": multiGroupInstanceNameInput.value
    }

    window.FormItInterface.CallMethod("PropertiesPlus.renameGroupInstances", args);
}

// make a single selected Group instance unique
PropertiesPlus.submitGroupInstanceMakeUnique = function()
{
    let args = {
        
    }

    window.FormItInterface.CallMethod("PropertiesPlus.makeSingleGroupInstanceUnique", args);
}

// make a single selected Group instance unique (non-recursive)
PropertiesPlus.submitGroupInstanceMakeUniqueNR = function()
{
    let args = {
        
    }

    window.FormItInterface.CallMethod("PropertiesPlus.makeSingleGroupInstanceUniqueNR", args);
}

// all UI initialization
// must be called from the HTML page
PropertiesPlus.initializeUI = function()
{
    // create an overall container for all objects that comprise the "content" of the plugin
    // everything above the footer
    let contentContainer = document.createElement('div');
    contentContainer.id = 'contentContainer';
    contentContainer.className = 'contentContainer';
    window.document.body.appendChild(contentContainer);

    // create the overall header
    let headerContainer = new FormIt.PluginUI.HeaderModule('Properties Plus', 'View and modify properties of the current editing context and selection.', 'headerContainer');
    contentContainer.appendChild(headerContainer.element);

    // create the context properties subheader
    let contextPropertiesSubheader = new FormIt.PluginUI.SubheaderModule('Context Properties', 'show');
    contentContainer.appendChild(contextPropertiesSubheader.element);

    //
    // create the context properties card container
    //
    let contextCardsContainer = document.createElement('div');
    contextCardsContainer.id = 'editingContextCardsContainer';
    contextCardsContainer.className = 'show';

    //
    // create the context properties info container
    //
    let contextPropertiesContainerDiv = document.createElement('div');
    contextPropertiesContainerDiv.id = 'contextPropertiesContainer';
    contextPropertiesContainerDiv.className = 'infoContainer';
    contentContainer.appendChild(contextCardsContainer);

    let contextPropertiesHeaderDiv = document.createElement('div');
    contextPropertiesHeaderDiv.id = 'selectionInfoHeaderDiv';
    contextPropertiesHeaderDiv.className = 'infoHeader';
    contextPropertiesHeaderDiv.innerHTML = 'Currently Editing';

    editingHistoryName = document.createElement('div');
    editingHistoryName.className = 'infoList';
    editingHistoryName.innerHTML = "";

    editingHistoryInstancesDiv = document.createElement('div');
    editingHistoryInstancesDiv.className = 'infoList';
    editingHistoryInstancesDiv.innerHTML = "";

    contextCardsContainer.appendChild(contextPropertiesContainerDiv);
    contextPropertiesContainerDiv.appendChild(contextPropertiesHeaderDiv);
    contextPropertiesContainerDiv.appendChild(editingHistoryName);
    contextPropertiesContainerDiv.appendChild(editingHistoryInstancesDiv);

    // create the selection properties subheader
    let selectionPropertiesSubheader = new FormIt.PluginUI.SubheaderModule('Selection Properties', 'show');
    contentContainer.appendChild(selectionPropertiesSubheader.element);

    //
    // create the on/off checkbox to disable calculations (in case of large selections)
    // 
    let computeOnSelectionCheckboxModule = new FormIt.PluginUI.CheckboxModule('Update on Selection Change', 'computOnSelectionCheckboxModule', 'multiModuleContainer', recomputeOnSelectionInputID);
    contentContainer.appendChild(computeOnSelectionCheckboxModule.element);
    
    let computeOnSelectionCheckboxInput = document.getElementById(recomputeOnSelectionInputID);
    computeOnSelectionCheckboxInput.checked = true;
    
    // when the user checks or unchecks, update the UI as required
    computeOnSelectionCheckboxInput.onclick = function()
    {
        if (this.checked)
        {
            PropertiesPlus.setUIStateToEnabled();
        }
        else
        {
            PropertiesPlus.setUIStateToDisabled();
        }
    }

    //
    // create the "disabled state" container, which tells the user to check the box to re-enable updates
    //
    let disabledStateContainerDiv = document.createElement('div');
    disabledStateContainerDiv.id = disabledStateContainerID;
    disabledStateContainerDiv.className = 'hide';

    let disabledStateMessageDiv = document.createElement('div');
    disabledStateMessageDiv.className = 'infoList';
    disabledStateMessageDiv.innerHTML = "Check the box to see updates.";
    disabledStateContainerDiv.appendChild(disabledStateMessageDiv);

    contentContainer.appendChild(disabledStateContainerDiv);

    // 
    // create the info cards container
    // stores all info cards in one place for easier toggling
    // 
    let infoCardsContainer = document.createElement('div');
    infoCardsContainer.id = infoCardsContainerID;
    infoCardsContainer.className = 'show';

    contentContainer.appendChild(infoCardsContainer);

    //
    // create the selection count container
    //
    let selectionInfoContainerDiv = document.createElement('div');
    selectionInfoContainerDiv.id = selectionInfoContainerID;
    selectionInfoContainerDiv.className = 'infoContainer';

    let selectionInfoHeaderDiv = document.createElement('div');
    selectionInfoHeaderDiv.id = 'selectionInfoHeaderDiv';
    selectionInfoHeaderDiv.className = 'infoHeader';
    selectionInfoHeaderDiv.innerHTML = 'Selection Count';

    objectCountDiv = document.createElement('div');
    objectCountDiv.className = 'infoList';
    objectCountLabel = "Total objects: ";
    objectCountDiv.innerHTML = objectCountLabel + objectCount;

    objectCountHorizontalRule = document.createElement('hr'); // horizontal line
    objectCountHorizontalRule.className = 'hide';

    infoCardsContainer.appendChild(selectionInfoContainerDiv);
    selectionInfoContainerDiv.appendChild(selectionInfoHeaderDiv);
    selectionInfoContainerDiv.appendChild(objectCountDiv);

    //
    // create the "too many items" message
    //
    tooManyItemsContainerDiv = document.createElement('div');
    tooManyItemsContainerDiv.id = selectionInfoContainerID;
    tooManyItemsContainerDiv.className = 'hide';

    tooManyItemsDiv = document.createElement('div');
    tooManyItemsDiv.className = 'infoList';
    tooManyItemsDiv.innerHTML = "Select fewer than " + maxObjectCount + " objects to see more information."

    infoCardsContainer.appendChild(tooManyItemsContainerDiv);
    tooManyItemsContainerDiv.appendChild(tooManyItemsDiv);
    
    // create the specific object counts list - these are hidden until the selection contains them
    selectionInfoContainerDiv.appendChild(objectCountHorizontalRule);

    // vertices
    vertexCountModule = new FormIt.PluginUI.DeselectButtonModule(PropertiesPlus.submitDeselectObjectsByType, WSM.nObjectType.nVertexType, vertexCountLabelPrefix, vertexCountModuleID, vertexCountLabelID);
    selectionInfoContainerDiv.appendChild(vertexCountModule.element);
    PropertiesPlus.hideObjectCountModule(vertexCountModule.element);

    // edges
    edgeCountModule = new FormIt.PluginUI.DeselectButtonModule(PropertiesPlus.submitDeselectObjectsByType, WSM.nObjectType.nEdgeType, edgeCountLabelPrefix, edgeCountModuleID, edgeCountLabelID);
    selectionInfoContainerDiv.appendChild(edgeCountModule.element);
    PropertiesPlus.hideObjectCountModule(edgeCountModule.element);

    // faces
    faceCountModule = new FormIt.PluginUI.DeselectButtonModule(PropertiesPlus.submitDeselectObjectsByType, WSM.nObjectType.nFaceType, faceCountLabelPrefix, faceCountModuleID, faceCountLabelID);
    selectionInfoContainerDiv.appendChild(faceCountModule.element);
    PropertiesPlus.hideObjectCountModule(faceCountModule.element);

    // bodies
    bodyCountModule = new FormIt.PluginUI.DeselectButtonModule(PropertiesPlus.submitDeselectObjectsByType, WSM.nObjectType.nBodyType, bodyCountLabelPrefix, bodyCountModuleID, bodyCountLabelID);
    selectionInfoContainerDiv.appendChild(bodyCountModule.element);
    PropertiesPlus.hideObjectCountModule(bodyCountModule.element);

    // meshes
    meshCountModule = new FormIt.PluginUI.DeselectButtonModule(PropertiesPlus.submitDeselectObjectsByType, WSM.nObjectType.nMeshType, meshCountLabelPrefix, meshCountModuleID, meshCountLabelID);
    selectionInfoContainerDiv.appendChild(meshCountModule.element);
    PropertiesPlus.hideObjectCountModule(meshCountModule.element);

    // linemeshes
    lineMeshCountModule = new FormIt.PluginUI.DeselectButtonModule(PropertiesPlus.submitDeselectObjectsByType, WSM.nObjectType.nLineMeshType, lineMeshCountLabelPrefix, lineMeshCountModuleID, lineMeshCountLabelID);
    selectionInfoContainerDiv.appendChild(lineMeshCountModule.element);
    PropertiesPlus.hideObjectCountModule(lineMeshCountModule.element);

    // pointmeshes
    pointMeshCountModule = new FormIt.PluginUI.DeselectButtonModule(PropertiesPlus.submitDeselectObjectsByType, WSM.nObjectType.nPointMeshType, pointMeshCountLabelPrefix, pointMeshCountModuleID, pointMeshCountLabelID);
    selectionInfoContainerDiv.appendChild(pointMeshCountModule.element);
    PropertiesPlus.hideObjectCountModule(pointMeshCountModule.element);

    // group instances
    groupInstanceCountModule = new FormIt.PluginUI.DeselectButtonModule(PropertiesPlus.submitDeselectObjectsByType, WSM.nObjectType.nInstanceType, groupInstanceCountLabelPrefix, groupInstanceCountModuleID, groupInstanceCountLabelID);
    selectionInfoContainerDiv.appendChild(groupInstanceCountModule.element);
    PropertiesPlus.hideObjectCountModule(groupInstanceCountModule.element);

    //
    // create the single group family details container - starts hidden
    //
    singleGroupFamilyDetailsContainerDiv = document.createElement('div');
    singleGroupFamilyDetailsContainerDiv.id = 'singleGroupInfoContainer';
    singleGroupFamilyDetailsContainerDiv.className = 'hide';

    let singleGroupFamilyDetailsHeaderDiv = document.createElement('div');
    singleGroupFamilyDetailsHeaderDiv.id = 'groupInfoHeaderDiv';
    singleGroupFamilyDetailsHeaderDiv.className = 'infoHeader';
    singleGroupFamilyDetailsHeaderDiv.innerHTML = 'Group History';

    infoCardsContainer.appendChild(singleGroupFamilyDetailsContainerDiv);
    singleGroupFamilyDetailsContainerDiv.appendChild(singleGroupFamilyDetailsHeaderDiv);

    // rename module
    let singleGroupNameContainer = new FormIt.PluginUI.TextInputModule('Name: ', 'singleGroupNameContainer', 'inputModuleContainerStandalone', singleGroupFamilyNameInputID, PropertiesPlus.submitGroupFamilyRename);
    singleGroupFamilyDetailsContainerDiv.appendChild(singleGroupNameContainer.element);

    //
    // create the multi group family details container - starts hidden
    //
    multiGroupFamilyDetailsContainerDiv = document.createElement('div');
    multiGroupFamilyDetailsContainerDiv.id = 'multiGroupInfoContainer';
    multiGroupFamilyDetailsContainerDiv.className = 'hide';

    let multiGroupFamilyDetailsHeaderDiv = document.createElement('div');
    multiGroupFamilyDetailsHeaderDiv.id = 'groupInfoHeaderDiv';
    multiGroupFamilyDetailsHeaderDiv.className = 'infoHeader';
    multiGroupFamilyDetailsHeaderDiv.innerHTML = 'Multiple Group Histories';

    infoCardsContainer.appendChild(multiGroupFamilyDetailsContainerDiv);
    multiGroupFamilyDetailsContainerDiv.appendChild(multiGroupFamilyDetailsHeaderDiv);

    // rename module
    let multiGroupFamilyNameContainer = new FormIt.PluginUI.TextInputModule('Name: ', 'multiGroupFamilyNameContainer', 'inputModuleContainerStandalone', multiGroupFamilyNameInputID, PropertiesPlus.submitGroupFamilyRename);
    multiGroupFamilyDetailsContainerDiv.appendChild(multiGroupFamilyNameContainer.element);

    //
    // create the single group instance details container - starts hidden
    //
    singleGroupInstanceDetailsContainerDiv = document.createElement('div');
    singleGroupInstanceDetailsContainerDiv.id = 'singleGroupInstanceInfoContainer';
    singleGroupInstanceDetailsContainerDiv.className = 'hide';

    let singleGroupInstanceDetailsHeaderDiv = document.createElement('div');
    singleGroupInstanceDetailsHeaderDiv.id = 'groupInfoHeaderDiv';
    singleGroupInstanceDetailsHeaderDiv.className = 'infoHeader';
    singleGroupInstanceDetailsHeaderDiv.innerHTML = 'Group Instance';

    infoCardsContainer.appendChild(singleGroupInstanceDetailsContainerDiv);
    singleGroupInstanceDetailsContainerDiv.appendChild(singleGroupInstanceDetailsHeaderDiv);

    // rename module
    let singleGroupInstanceNameContainer = new FormIt.PluginUI.TextInputModule('Name: ', 'singleGroupInstanceNameContainer', 'inputModuleContainerStandalone', singleGroupInstanceNameInputID, PropertiesPlus.submitGroupInstanceRename);
    singleGroupInstanceDetailsContainerDiv.appendChild(singleGroupInstanceNameContainer.element);

    //
    // create the single group instance tools container - starts hidden
    //
    singleGroupInstaceToolsContainerDiv = document.createElement('div');
    singleGroupInstaceToolsContainerDiv.id = 'singleGroupInstanceToolsContainer';
    singleGroupInstaceToolsContainerDiv.className = 'hide';

    let singleGroupInstanceToolsHeaderDiv = document.createElement('div');
    singleGroupInstanceToolsHeaderDiv.id = 'groupInstanceToolsHeaderDiv';
    singleGroupInstanceToolsHeaderDiv.className = 'infoHeader';
    singleGroupInstanceToolsHeaderDiv.innerHTML = 'Group Instance Tools';

    infoCardsContainer.appendChild(singleGroupInstaceToolsContainerDiv);
    singleGroupInstaceToolsContainerDiv.appendChild(singleGroupInstanceToolsHeaderDiv);

    // make unique button module
    let singleGroupInstanceMakeUniqueButtonModule = new FormIt.PluginUI.ButtonWithInfoToggleModule('Make Unique', 'Make this Group instance unique, including all of its children.', PropertiesPlus.submitGroupInstanceMakeUnique);
    singleGroupInstaceToolsContainerDiv.appendChild(singleGroupInstanceMakeUniqueButtonModule.element);

    // make unique (non-recursive) button module
    let singleGroupInstanceMakeUniqueNRButtonModule = new FormIt.PluginUI.ButtonWithInfoToggleModule('Make Unique (non-recursive)', 'Make this Group instance unique, but skip all of its children.', PropertiesPlus.submitGroupInstanceMakeUniqueNR);
    singleGroupInstaceToolsContainerDiv.appendChild(singleGroupInstanceMakeUniqueNRButtonModule.element);

    // this is a work in progress
    if (displayWIP)
    {
        // spacer
        let spacerDiv2 = document.createElement('div');
        spacerDiv2.className = 'horizontalSpacer';

        // position modules
        let positionCoordinatesContainerDiv = FormIt.PluginUI.createHorizontalModuleContainer(singleGroupInstanceDetailsContainerDiv);

        let positionCoordinatesXModule = new FormIt.PluginUI.TextInputModule('Position X: ', 'positionCoordinatesX', 'inputModuleContainer', singleGroupInstancePosXInputID, PropertiesPlus.submitGroupInstanceRename);
        positionCoordinatesContainerDiv.appendChild(positionCoordinatesXModule.element);

        let positionCoordinatesYModule = new FormIt.PluginUI.TextInputModule('Position Y: ', 'positionCoordinatesY', 'inputModuleContainer', singleGroupInstancePosYInputID, PropertiesPlus.submitGroupInstanceRename);
        positionCoordinatesContainerDiv.appendChild(positionCoordinatesYModule.element);

        let positionCoordinatesZModule = new FormIt.PluginUI.TextInputModule(positionCoordinatesContainerDiv, 'Position Z: ', 'positionCoordinatesZ', 'inputModuleContainer', singleGroupInstancePosZInputID, PropertiesPlus.submitGroupInstanceRename);
        positionCoordinatesContainerDiv.append(positionCoordinatesZModule.element);
    }

    //
    // create the multi group instance details container - starts hidden
    //
    multiGroupInstanceDetailsContainerDiv = document.createElement('div');
    multiGroupInstanceDetailsContainerDiv.id = 'multiGroupInfoContainer';
    multiGroupInstanceDetailsContainerDiv.className = 'hide';

    let multiGroupInstanceDetailsHeaderDiv = document.createElement('div');
    multiGroupInstanceDetailsHeaderDiv.id = 'groupInfoHeaderDiv';
    multiGroupInstanceDetailsHeaderDiv.className = 'infoHeader';
    multiGroupInstanceDetailsHeaderDiv.innerHTML = 'Multiple Group Instances';

    infoCardsContainer.appendChild(multiGroupInstanceDetailsContainerDiv);
    multiGroupInstanceDetailsContainerDiv.appendChild(multiGroupInstanceDetailsHeaderDiv);

    // rename module
    let multiGroupInstanceNameContainer = new FormIt.PluginUI.TextInputModule('Name: ', 'multiGroupInstanceNameContainer', 'inputModuleContainerStandalone', multiGroupInstanceNameInputID, PropertiesPlus.submitGroupInstanceRename);
    multiGroupInstanceDetailsContainerDiv.appendChild(multiGroupInstanceNameContainer.element);

    //
    // create the footer
    //
    let footerModule = new FormIt.PluginUI.FooterModule;
    window.document.body.appendChild(footerModule.element)
}

// clear all arrays in the selectionInfo object
PropertiesPlus.clearQuantification = function(currentSelectionInfo)
{
    for (let i = 0; i < currentSelectionInfo.length; i++)
    {
        currentSelectionInfo[i] = [];
    }
}

// display and update an object count module
PropertiesPlus.showAndUpdateObjectCountModule = function(objectCountModule, labelDiv, labelPrefix, objectCount)
{
    objectCountModule.style.display = 'block';
    
    if (isSingleGroupInstance && labelPrefix.includes("Group"))
    {
        labelDiv.innerHTML = labelPrefix + objectCount + " Instance (" + currentSelectionInfo.identicalGroupInstanceCount + " in model)";
    } 
    else if (isMultipleGroupInstances && labelPrefix.includes("Group"))
    {
        // update the group instance count to also show how many unique families the instances belong to
        let uniqueGroupFamilyCount = eliminateDuplicatesInArray(currentSelectionInfo.selectedObjectsGroupFamilyHistoryIDArray).length;
        // change the wording slightly if there is more than one family
        let familyString;
        if (uniqueGroupFamilyCount == 1)
        {
            familyString = " Group)";
        }
        else
        {
            familyString = " Groups)";
        }
        
        labelDiv.innerHTML = labelPrefix + objectCount + " Instances (" + uniqueGroupFamilyCount + familyString;
    }
    else
    {
        labelDiv.innerHTML = labelPrefix + objectCount;
    }
}

// hide an object count module
PropertiesPlus.hideObjectCountModule = function(objectCountModule)
{
    objectCountModule.style.display = 'none';
}

// update the values in the UI based on the current FormIt selection
PropertiesPlus.updateQuantification = function(currentSelectionData)
{
    currentSelectionInfo = JSON.parse(currentSelectionData);

    // update the current editing history name
    editingHistoryName.innerHTML = currentSelectionInfo.editingHistoryName;

    // update the number of instances the current history affects
    if (currentSelectionInfo.editingHistoryName == "Main Sketch")
    {
        editingHistoryInstancesDiv.innerHTML = "";
    } 
    else 
    {
        editingHistoryInstancesDiv.innerHTML = "(" + currentSelectionInfo.editingHistoryInstances + " in model)";
    }

    // update object count and HTML
    objectCount = currentSelectionInfo.totalCount;
    objectCountDiv.innerHTML = objectCountLabel + objectCount;

    // if too many items are selected, show a message
    if (objectCount > maxObjectCount)
    {
        // show the container for the message that too many items are selected
        tooManyItemsContainerDiv.className = 'infoContainer';

        // clear the current selection info so downstream calculations think nothing is selected
        PropertiesPlus.clearQuantification(currentSelectionInfo);
        objectCount = 0;
    }
    else
    {
        tooManyItemsContainerDiv.className = 'hide';
    }

    //
    // set flags based on selection
    //

    // if multiple objects are selected, set a flag
    if (objectCount > 0)
    {
        isAnythingSelected = true;
    }
    else
    {
        isAnythingSelected = false;
    }

    // if one or more vertices (WSM object #8) are selected, set a flag
    for (let i = 0; i < objectCount; i++)
    {
        if (currentSelectionInfo.selectedObjectsTypeArray[i] == 8)
        {
            //console.log("At least one vertex is selected.");
            isOneOrMoreVertices = true;
            break;
        }
        else
        {
            isOneOrMoreVertices = false;
        }
    }

    // if one or more edges (WSM object #7) are selected, set a flag
    for (let i = 0; i < objectCount; i++)
    {
        if (currentSelectionInfo.selectedObjectsTypeArray[i] == 7)
        {
            //console.log("At least one edge is selected.");
            isOneOrMoreEdges = true;
            break;
        }
        else
        {
            isOneOrMoreEdges = false;
        }
    }

    // if one or more faces (WSM object #4) are selected, set a flag
    for (let i = 0; i < objectCount; i++)
    {
        if (currentSelectionInfo.selectedObjectsTypeArray[i] == 4)
        {
            //console.log("At least one face is selected.");
            isOneOrMoreFaces = true;
            break;
        }
        else
        {
            isOneOrMoreFaces = false;
        }
    }

    // if one or more bodies (WSM object #1) are selected, set a flag
    for (let i = 0; i < objectCount; i++)
    {
        if (currentSelectionInfo.selectedObjectsTypeArray[i] == 1)
        {
            //console.log("At least one body is selected.");
            isOneOrMoreBodies = true;
            break;
        }
        else
        {
            isOneOrMoreBodies = false;
        }
    }

    // if one or more meshes (WSM object #32) are selected, set a flag
    for (let i = 0; i < objectCount; i++)
    {
        if (currentSelectionInfo.selectedObjectsTypeArray[i] == 32)
        {
            //console.log("At least one mesh is selected.");
            isOneOrMoreMeshes = true;
            break;
        }
        else
        {
            isOneOrMoreMeshes = false;
        }
    }
    // if one or more lineMeshes (WSM object #33) are selected, set a flag
    for (let i = 0; i < objectCount; i++)
    {
        if (currentSelectionInfo.selectedObjectsTypeArray[i] == 33)
        {
            //console.log("At least one linemesh is selected.");
            isOneOrMoreLineMeshes = true;
            break;
        }
        else
        {
            isOneOrMoreLineMeshes = false;
        }
    }
    // if one or more pointMeshes (WSM object #34) are selected, set a flag
    for (let i = 0; i < objectCount; i++)
    {
        if (currentSelectionInfo.selectedObjectsTypeArray[i] == 34)
        {
            //console.log("At least one pointmesh is selected.");
            isOneOrMorePointMeshes = true;
            break;
        }
        else
        {
            isOneOrMorePointMeshes = false;
        }
    }

    // if there's just one Group Instance selected, set a flag
    if (currentSelectionInfo.selectedObjectsGroupInstanceIDArray.length == 1)
    {
        //console.log("Only a single instance selected.");
        isSingleGroupInstance = true;
    }
    else 
    {
        isSingleGroupInstance = false;
    }

    // if one or more Group instances (WSM object #24) are selected, set a flag
    for (let i = 0; i < objectCount; i++)
    {
        if (currentSelectionInfo.selectedObjectsTypeArray[i] == 24)
        {
            //console.log("At least one instance is selected.");
            isOneOrMoreGroupInstances = true;
            break;
        }
        else
        {
            isOneOrMoreGroupInstances = false;
        }
    }

    // if multiple Group instances are selected, set a flag
    if (currentSelectionInfo.groupInstanceCount > 1)
    {
        //console.log("At least one instance is selected.");
        isMultipleGroupInstances = true;
    }
    else
    {
        isMultipleGroupInstances = false;
    }

    //
    // update counts or hide UI based on flags 
    //

    // if multiple items, enable HTML
    if (isAnythingSelected)
    {
        objectCountHorizontalRule.className = 'show';
    }

    // if any vertices are selected, enable HTML and update it
    if (isOneOrMoreVertices)
    {
        PropertiesPlus.showAndUpdateObjectCountModule(vertexCountModule.element, vertexCountLabel, vertexCountLabelPrefix, currentSelectionInfo.vertexCount);
    }
    else 
    {
        PropertiesPlus.hideObjectCountModule(vertexCountModule.element);
    }

    // if any edges are selected, enable HTML and update it
    if (isOneOrMoreEdges)
    {
        PropertiesPlus.showAndUpdateObjectCountModule(edgeCountModule.element, edgeCountLabel, edgeCountLabelPrefix, currentSelectionInfo.edgeCount);
    }
    else
    {
        PropertiesPlus.hideObjectCountModule(edgeCountModule.element);
    }

    // if any faces are selected, enable HTML and update it
    if (isOneOrMoreFaces)
    {
        PropertiesPlus.showAndUpdateObjectCountModule(faceCountModule.element, faceCountLabel, faceCountLabelPrefix, currentSelectionInfo.faceCount);
    }
    else
    {
        PropertiesPlus.hideObjectCountModule(faceCountModule.element);
    }

    // if any bodies are selected, enable HTML and update it
    if (isOneOrMoreBodies)
    {
        PropertiesPlus.showAndUpdateObjectCountModule(bodyCountModule.element, bodyCountLabel, bodyCountLabelPrefix, currentSelectionInfo.bodyCount);
    }
    else
    {
        PropertiesPlus.hideObjectCountModule(bodyCountModule.element);
    }

    // if any meshes are selected, enable HTML and update it
    if (isOneOrMoreMeshes)
    {
        PropertiesPlus.showAndUpdateObjectCountModule(meshCountModule.element, meshCountLabel, meshCountLabelPrefix, currentSelectionInfo.meshCount);
    }
    else
    {
        PropertiesPlus.hideObjectCountModule(meshCountModule.element);
    }
    // if any linemeshes are selected, enable HTML and update it
    if (isOneOrMoreLineMeshes)
    {
        PropertiesPlus.showAndUpdateObjectCountModule(lineMeshCountModule.element, lineMeshCountLabel, lineMeshCountLabelPrefix, currentSelectionInfo.lineMeshCount);
    }
    else
    {
        PropertiesPlus.hideObjectCountModule(lineMeshCountModule.element);
    }
    // if any pointmeshes are selected, enable HTML and update it
    if (isOneOrMorePointMeshes)
    {
        PropertiesPlus.showAndUpdateObjectCountModule(pointMeshCountModule.element, pointMeshCountLabel, pointMeshCountLabelPrefix, currentSelectionInfo.pointMeshCount);
    }
    else
    {
        PropertiesPlus.hideObjectCountModule(pointMeshCountModule.element);
    }

    // if any instances are selected, enable HTML and update it
    if (isOneOrMoreGroupInstances)
    {
        PropertiesPlus.showAndUpdateObjectCountModule(groupInstanceCountModule.element, groupInstanceCountLabel, groupInstanceCountLabelPrefix, currentSelectionInfo.groupInstanceCount);
    }
    else
    {
        PropertiesPlus.hideObjectCountModule(groupInstanceCountModule.element);
    }

    // if a single instance is selected, enable HTML and update it
    if (isSingleGroupInstance)
    {
        // enable the group family and instance info containers
        singleGroupFamilyDetailsContainerDiv.className = 'infoContainer';
        singleGroupInstanceDetailsContainerDiv.className = 'infoContainer';
        singleGroupInstaceToolsContainerDiv.className = 'infoContainer';

        let groupInstanceName = currentSelectionInfo.selectedObjectsNameArray[0];
        let singleGroupInstanceNameInput = document.getElementById(singleGroupInstanceNameInputID);
        singleGroupInstanceNameInput.value = groupInstanceName;

        let groupFamilyName = currentSelectionInfo.selectedObjectsGroupFamilyNameArray[0];
        let singleGroupFamilyNameInput = document.getElementById(singleGroupFamilyNameInputID);
        singleGroupFamilyNameInput.value = groupFamilyName;
    }
    else
    {
        singleGroupFamilyDetailsContainerDiv.className = 'hide';
        singleGroupInstanceDetailsContainerDiv.className = 'hide';
        singleGroupInstaceToolsContainerDiv.className = 'hide';
    }

    // if multiple group instances are selected, enable HTML and update it
    if (isMultipleGroupInstances)
    {
        // if the instances come from the same Group family, display the single Group family container and show the name
        if (currentSelectionInfo.isConsistentGroupFamilyHistoryIDs)
        {
            // hide the multi Group family container, and display the single Group family details container
            multiGroupFamilyDetailsContainerDiv.className = 'hide';
            singleGroupFamilyDetailsContainerDiv.className = 'infoContainer';

            // update the name input with the current name
            let groupFamilyName = currentSelectionInfo.selectedObjectsGroupFamilyNameArray[0];
            let singleGroupFamilyNameInput = document.getElementById(singleGroupFamilyNameInputID);
            singleGroupFamilyNameInput.value = groupFamilyName;
        }
        // otherwise, these instances come from different families, so display the multi Group family container
        else
        {
            // hide the single Group family container, and display the multi Group family details container
            singleGroupFamilyDetailsContainerDiv.className = 'hide';
            multiGroupFamilyDetailsContainerDiv.className = 'infoContainer';

            let multiGroupFamilyNameInput = document.getElementById(multiGroupFamilyNameInputID);

            // if all of the group family names are consistent, display the common name as placeholder text
            if (currentSelectionInfo.isConsistentGroupFamilyNames === true)
            {
                let groupFamilyName = currentSelectionInfo.selectedObjectsGroupFamilyNameArray[0];
                multiGroupFamilyNameInput.value = groupFamilyName;
                multiGroupFamilyNameInput.setAttribute("placeholder", '');
            }
            // otherwise indicate that the names vary
            else 
            {
                let groupFamilyName = "*varies*";
                multiGroupFamilyNameInput.setAttribute("placeholder", groupFamilyName);
                multiGroupFamilyNameInput.value = '';
            }
        }

        multiGroupInstanceDetailsContainerDiv.className = 'infoContainer';

        // if all of the instance names are consistent, display the common name as placeholder text
        if (currentSelectionInfo.isConsistentGroupInstanceNames === true)
        {
            let groupInstanceName = currentSelectionInfo.selectedObjectsGroupInstanceNameArray[0];
            multiGroupInstanceNameInput.value = groupInstanceName;
            multiGroupInstanceNameInput.setAttribute("placeholder", '');
        }
        // otherwise indicate that the names vary
        else 
        {
            let groupInstanceName = "*varies*";
            multiGroupInstanceNameInput.setAttribute("placeholder", groupInstanceName);
            multiGroupInstanceNameInput.value = '';
        }
    }
    else
    {       
        // hide the multi details containers
        multiGroupFamilyDetailsContainerDiv.className = 'hide';
        multiGroupInstanceDetailsContainerDiv.className = 'hide'; 
    }
    
    // hide elements that shouldn't display with no selection
    if (objectCount === 0)
    {
        objectCountHorizontalRule.className = 'hide';
        PropertiesPlus.hideObjectCountModule(vertexCountModule.element);
        PropertiesPlus.hideObjectCountModule(edgeCountModule.element);
        PropertiesPlus.hideObjectCountModule(faceCountModule.element);
        PropertiesPlus.hideObjectCountModule(bodyCountModule.element);
        PropertiesPlus.hideObjectCountModule(meshCountModule.element);
        PropertiesPlus.hideObjectCountModule(lineMeshCountModule.element);
        PropertiesPlus.hideObjectCountModule(pointMeshCountModule.element);
        PropertiesPlus.hideObjectCountModule(groupInstanceCountModule.element);
        singleGroupInstanceDetailsContainerDiv.className = 'hide';
        singleGroupInstaceToolsContainerDiv.className = 'hide';
        multiGroupInstanceDetailsContainerDiv.className = 'hide';
    }
    
    // hide elements that shouldn't display with just 1 object in the selection
    if (objectCount == 1)
    {
        multiGroupInstanceDetailsContainerDiv.className = 'hide'; 
    }
}

// determine if the user has chosen to update the UI on selection
PropertiesPlus.doRecomputeOnSelection = function()
{
    return document.getElementById(recomputeOnSelectionInputID).checked;
}

// UpdateUI runs from the HTML page.  This script gets loaded up in both FormIt's
// JS engine and also in the embedded web JS engine inside the panel.
PropertiesPlus.updateUI = function()
{
    let args = {
        "maxObjectCount": maxObjectCount
    }

    //console.log("PropertiesPlus.UpdateUI");
    //console.log("args");
    // NOTE: window.FormItInterface.CallMethod will call the function
    // defined above with the given args. This is needed to communicate
    // between the web JS engine process and the FormIt process.
    FormItInterface.CallMethod("PropertiesPlus.GetSelectionInfo", args, function(result)
    {
        //FormItInterface.ConsoleLog("Result " + result);
        PropertiesPlus.updateQuantification(result);
    });
}

PropertiesPlus.setUIStateToEnabled = function()
{
    // show the selection info container
    let selectionInfoContainer = document.getElementById(selectionInfoContainerID);
    selectionInfoContainer.className = 'infoContainer';

    // show the info cards container
    let infoCardsContainer = document.getElementById(infoCardsContainerID);
    infoCardsContainer.className = 'show';

    // hide the disabled state container
    let disabledStateContainer = document.getElementById(disabledStateContainerID);
    disabledStateContainer.className = 'hide';

    PropertiesPlus.updateUI();
}

// update the UI to a dsiabled state, when the user has disabled updates
PropertiesPlus.setUIStateToDisabled = function()
{
    // hide the selection info container
    let selectionInfoContainer = document.getElementById(selectionInfoContainerID);
    selectionInfoContainer.className = 'hide';

    // hide the info cards container
    let infoCardsContainer = document.getElementById(infoCardsContainerID);
    infoCardsContainer.className = 'hide';

    // show the dsiabled state container
    let disabledStateContainer = document.getElementById(disabledStateContainerID);
    disabledStateContainer.className = 'infoContainer';
}
