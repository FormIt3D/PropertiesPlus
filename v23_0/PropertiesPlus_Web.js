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
PropertiesPlus.nMaxObjectCount = 1000;

// the current selection info object requested from the application
PropertiesPlus.currentSelectionInfo = {};

// post-processed data to determine which HTML elements to display
PropertiesPlus.bIsSingleGroupInstance = false;
PropertiesPlus.bIsOneOrMoreGroupInstances = false;
PropertiesPlus.bIsMultipleGroupInstances = false;

// all possible info cards to display, based on the selection set
// contents or visibility of these will change when the selection or editing history changes
PropertiesPlus.editingContextInfoCard = undefined;
PropertiesPlus.selectionCountInfoCard = undefined;

PropertiesPlus.singleObjectDetailsInfoCard = undefined;

PropertiesPlus.singleGroupHistoryDetailsInfoCard = undefined;
PropertiesPlus.singleGroupInstanceDetailsInfoCard = undefined;
PropertiesPlus.singleGroupInstanceToolsInfoCard = undefined;
PropertiesPlus.singleGroupInstanceAttributesInfoCard = undefined;

PropertiesPlus.multiGroupInstanceDetailsInfoCard = undefined;

// info card sub-elements that need to be updated
PropertiesPlus.singleObjectIDDiv = undefined;

PropertiesPlus.singleGroupHistoryIDDiv = undefined;

PropertiesPlus.singleGroupInstanceIDDiv = undefined;
PropertiesPlus.singleGroupInstanceScaleXInput = undefined;
PropertiesPlus.singleGroupInstanceScaleYInput = undefined;
PropertiesPlus.singleGroupInstanceScaleZInput = undefined;

// ID for the top-level checkbox that controls whether Properties Plus recomputes on selection
const recomputeOnSelectionInputID = 'recomputeOnSelectionInput';

// IDs for containers which may be toggled in certain cases
const disabledStateContainerID = 'disabledStateContainer';
const infoCardsContainerID = 'infoCardsContainer';
const selectionInfoContainerID = 'selectionInfoContainer';

// IDs for inputs whose value will be updated when selection changes
const singleGroupFamilyNameInputID = 'singleGroupFamilyNameInput';
const singleGroupInstanceNameInputID = 'singleGroupInstanceNameInput';
const singleGroupInstancePosXInputID = 'singleGroupInstancePosXInput';
const singleGroupInstancePosYInputID = 'singleGroupInstancePosYInput';
const singleGroupInstancePosZInputID = 'singleGroupInstancePosZInput';
const multiGroupFamilyNameInputID = 'multiGroupFamilyNameInput';
const multiGroupInstanceNameInputID = 'multiGroupInstanceNameInput';

// flag to display work-in-progress features
const displayWIP = false;

// all UI initialization
// must be called from the HTML page
PropertiesPlus.initializeUI = function()
{
    // create an overall container for all objects that comprise the "content" of the plugin
    // everything above the footer
    const contentContainer = document.createElement('div');
    contentContainer.id = 'contentContainer';
    contentContainer.className = 'contentContainer';
    window.document.body.appendChild(contentContainer);

    // create the overall header
    const headerContainer = new FormIt.PluginUI.HeaderModule('Properties Plus', 'View and modify properties of the current editing context and selection.', 'headerContainer');
    contentContainer.appendChild(headerContainer.element);

    // create the context properties subheader
    const contextPropertiesSubheader = new FormIt.PluginUI.SubheaderModule('Context Properties', 'show');
    contentContainer.appendChild(contextPropertiesSubheader.element);

    // ecreate the editing context info card
    PropertiesPlus.editingContextInfoCard = new FormIt.PluginUI.EditingContextInfoCard();
    contentContainer.appendChild(PropertiesPlus.editingContextInfoCard.element);

    // create the selection properties subheader
    const selectionPropertiesSubheader = new FormIt.PluginUI.SubheaderModule('Selection Properties', 'show');
    contentContainer.appendChild(selectionPropertiesSubheader.element);

    //
    // create the on/off checkbox to disable calculations (in case of large selections)
    // 
    const computeOnSelectionCheckboxModule = new FormIt.PluginUI.CheckboxModule('Update on selection change', 'computOnSelectionCheckboxModule', 'multiModuleContainer', recomputeOnSelectionInputID);
    contentContainer.appendChild(computeOnSelectionCheckboxModule.element);
    
    const computeOnSelectionCheckboxInput = document.getElementById(recomputeOnSelectionInputID);
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
    const disabledStateContainerDiv = document.createElement('div');
    disabledStateContainerDiv.id = disabledStateContainerID;
    disabledStateContainerDiv.className = 'hide';

    const disabledStateMessageDiv = document.createElement('div');
    disabledStateMessageDiv.className = 'infoList';
    disabledStateMessageDiv.innerHTML = "Check the box to see updates.";
    disabledStateContainerDiv.appendChild(disabledStateMessageDiv);

    contentContainer.appendChild(disabledStateContainerDiv);

    // 
    // create the selection info cards container
    // stores all info cards in one place for easier toggling
    // 
    const infoCardsContainer = document.createElement('div');
    infoCardsContainer.id = infoCardsContainerID;
    infoCardsContainer.className = 'show';
    contentContainer.appendChild(infoCardsContainer);

    // create the selection count container
    PropertiesPlus.selectionCountInfoCard = new FormIt.PluginUI.SelectionCountInfoCard(PropertiesPlus.nMaxObjectCount);
    infoCardsContainer.appendChild(PropertiesPlus.selectionCountInfoCard.element);
    // append the too many objects div now that it has a parent
    PropertiesPlus.selectionCountInfoCard.appendTooManyObjectsMessage();

    //
    // create the single object details container - starts hidden
    //
    PropertiesPlus.singleObjectDetailsInfoCard = document.createElement('div');
    PropertiesPlus.singleObjectDetailsInfoCard.id = 'singleObjectInfoContainer';
    PropertiesPlus.singleObjectDetailsInfoCard.className = 'hide';

    const singleObjectDetailsHeaderDiv = document.createElement('div');
    singleObjectDetailsHeaderDiv.id = 'objectInfoHeaderDiv';
    singleObjectDetailsHeaderDiv.className = 'infoHeader';
    singleObjectDetailsHeaderDiv.innerHTML = 'Object Details';
    PropertiesPlus.singleObjectDetailsInfoCard.appendChild(singleObjectDetailsHeaderDiv);

    PropertiesPlus.singleObjectIDDiv = document.createElement('div');
    PropertiesPlus.singleObjectIDDiv.className = 'infoList';
    PropertiesPlus.singleObjectIDDiv.id = 'objectIDHeaderDiv';
    PropertiesPlus.singleObjectDetailsInfoCard.appendChild(PropertiesPlus.singleObjectIDDiv);

    infoCardsContainer.appendChild(PropertiesPlus.singleObjectDetailsInfoCard);

    //
    // create the single group family details container - starts hidden
    //
    PropertiesPlus.singleGroupHistoryDetailsInfoCard = document.createElement('div');
    PropertiesPlus.singleGroupHistoryDetailsInfoCard.id = 'singleGroupInfoContainer';
    PropertiesPlus.singleGroupHistoryDetailsInfoCard.className = 'hide';

    const singleGroupFamilyDetailsHeaderDiv = document.createElement('div');
    singleGroupFamilyDetailsHeaderDiv.id = 'groupInfoHeaderDiv';
    singleGroupFamilyDetailsHeaderDiv.className = 'infoHeader';
    singleGroupFamilyDetailsHeaderDiv.innerHTML = 'Group History Details';

    infoCardsContainer.appendChild(PropertiesPlus.singleGroupHistoryDetailsInfoCard);
    PropertiesPlus.singleGroupHistoryDetailsInfoCard.appendChild(singleGroupFamilyDetailsHeaderDiv);

    // ID module
    PropertiesPlus.singleGroupHistoryIDDiv = document.createElement('div');
    PropertiesPlus.singleGroupHistoryIDDiv.id = 'groupHistoryIDDiv';
    PropertiesPlus.singleGroupHistoryIDDiv.className = 'infoList';
    PropertiesPlus.singleGroupHistoryDetailsInfoCard.appendChild(PropertiesPlus.singleGroupHistoryIDDiv);

    // rename module
    const singleGroupNameContainer = new FormIt.PluginUI.TextInputModule('History Name: ', 'singleGroupNameContainer', 'inputModuleContainerBottom', singleGroupFamilyNameInputID, PropertiesPlus.submitGroupFamilyRename);
    PropertiesPlus.singleGroupHistoryDetailsInfoCard.appendChild(singleGroupNameContainer.element);

    //
    // create the multi group family details container - starts hidden
    //
    multiGroupFamilyDetailsContainerDiv = document.createElement('div');
    multiGroupFamilyDetailsContainerDiv.id = 'multiGroupInfoContainer';
    multiGroupFamilyDetailsContainerDiv.className = 'hide';

    const multiGroupFamilyDetailsHeaderDiv = document.createElement('div');
    multiGroupFamilyDetailsHeaderDiv.id = 'groupInfoHeaderDiv';
    multiGroupFamilyDetailsHeaderDiv.className = 'infoHeader';
    multiGroupFamilyDetailsHeaderDiv.innerHTML = 'Multiple Group Histories';

    infoCardsContainer.appendChild(multiGroupFamilyDetailsContainerDiv);
    multiGroupFamilyDetailsContainerDiv.appendChild(multiGroupFamilyDetailsHeaderDiv);

    // rename module
    const multiGroupFamilyNameContainer = new FormIt.PluginUI.TextInputModule('History Name: ', 'multiGroupFamilyNameContainer', 'inputModuleContainerStandalone', multiGroupFamilyNameInputID, PropertiesPlus.submitGroupFamilyRename);
    multiGroupFamilyDetailsContainerDiv.appendChild(multiGroupFamilyNameContainer.element);

    //
    // create the single group instance details container - starts hidden
    //
    PropertiesPlus.singleGroupInstanceDetailsInfoCard = document.createElement('div');
    PropertiesPlus.singleGroupInstanceDetailsInfoCard.id = 'singleGroupInstanceInfoContainer';
    PropertiesPlus.singleGroupInstanceDetailsInfoCard.className = 'hide';

    const singleGroupInstanceDetailsHeaderDiv = document.createElement('div');
    singleGroupInstanceDetailsHeaderDiv.id = 'groupInfoHeaderDiv';
    singleGroupInstanceDetailsHeaderDiv.className = 'infoHeader';
    singleGroupInstanceDetailsHeaderDiv.innerHTML = 'Group Instance Details';

    infoCardsContainer.appendChild(PropertiesPlus.singleGroupInstanceDetailsInfoCard);
    PropertiesPlus.singleGroupInstanceDetailsInfoCard.appendChild(singleGroupInstanceDetailsHeaderDiv);

    // ID module
    PropertiesPlus.singleGroupInstanceIDDiv = document.createElement('div');
    PropertiesPlus.singleGroupInstanceIDDiv.id = 'groupInstanceIDDiv';
    PropertiesPlus.singleGroupInstanceIDDiv.className = 'infoList';
    PropertiesPlus.singleGroupInstanceDetailsInfoCard.appendChild(PropertiesPlus.singleGroupInstanceIDDiv);

    // rename module
    const singleGroupInstanceNameContainer = new FormIt.PluginUI.TextInputModule('Instance Name: ', 'singleGroupInstanceNameContainer', 'inputModuleContainer', singleGroupInstanceNameInputID, PropertiesPlus.submitGroupInstanceRename);
    PropertiesPlus.singleGroupInstanceDetailsInfoCard.appendChild(singleGroupInstanceNameContainer.element);

    // instance scale module - X, Y, Z
    const singleGroupInstanceScalingLabel = document.createElement('div');
    singleGroupInstanceScalingLabel.innerHTML = 'Instance Scaling';
    PropertiesPlus.singleGroupInstanceDetailsInfoCard.appendChild(singleGroupInstanceScalingLabel);

    const singleGroupInstanceScaleMultiModule = new FormIt.PluginUI.MultiModuleContainer();
    PropertiesPlus.singleGroupInstanceDetailsInfoCard.appendChild(singleGroupInstanceScaleMultiModule.element);
    singleGroupInstanceScaleMultiModule.element.style.marginBottom = '0px';

    const singleGroupInstanceScaleModuleX = new FormIt.PluginUI.TextInputModuleV2('Scale X:', PropertiesPlus.submitGroupInstanceScale);
    PropertiesPlus.singleGroupInstanceScaleXInput = singleGroupInstanceScaleModuleX.getInput();
    singleGroupInstanceScaleMultiModule.element.appendChild(singleGroupInstanceScaleModuleX.element);
    singleGroupInstanceScaleModuleX.element.className = 'inputModuleContainerStandalone';
    singleGroupInstanceScaleModuleX.element.style.marginRight = '5px';

    const singleGroupInstanceScaleModuleY = new FormIt.PluginUI.TextInputModuleV2('Scale Y:', PropertiesPlus.submitGroupInstanceScale);
    PropertiesPlus.singleGroupInstanceScaleYInput = singleGroupInstanceScaleModuleY.getInput();
    singleGroupInstanceScaleMultiModule.element.appendChild(singleGroupInstanceScaleModuleY.element);
    singleGroupInstanceScaleModuleY.element.className = 'inputModuleContainerStandalone';
    singleGroupInstanceScaleModuleY.element.style.marginLeft = '5px';
    singleGroupInstanceScaleModuleY.element.style.marginRight = '5px';

    const singleGroupInstanceScaleModuleZ = new FormIt.PluginUI.TextInputModuleV2('Scale Z:', PropertiesPlus.submitGroupInstanceScale);
    PropertiesPlus.singleGroupInstanceScaleZInput = singleGroupInstanceScaleModuleZ.getInput();
    singleGroupInstanceScaleMultiModule.element.appendChild(singleGroupInstanceScaleModuleZ.element);
    singleGroupInstanceScaleModuleZ.element.className = 'inputModuleContainerStandalone';
    singleGroupInstanceScaleModuleZ.element.style.marginLeft = '5px';

    //
    // create the single group instance tools container - starts hidden
    //
    PropertiesPlus.singleGroupInstanceToolsInfoCard = document.createElement('div');
    PropertiesPlus.singleGroupInstanceToolsInfoCard.id = 'singleGroupInstanceToolsContainer';
    PropertiesPlus.singleGroupInstanceToolsInfoCard.className = 'hide';

    const singleGroupInstanceToolsHeaderDiv = document.createElement('div');
    singleGroupInstanceToolsHeaderDiv.id = 'groupInstanceToolsHeaderDiv';
    singleGroupInstanceToolsHeaderDiv.className = 'infoHeader';
    singleGroupInstanceToolsHeaderDiv.innerHTML = 'Group Instance Tools';

    infoCardsContainer.appendChild(PropertiesPlus.singleGroupInstanceToolsInfoCard);
    PropertiesPlus.singleGroupInstanceToolsInfoCard.appendChild(singleGroupInstanceToolsHeaderDiv);

    // make unique button module
    const singleGroupInstanceMakeUniqueButtonModule = new FormIt.PluginUI.ButtonWithInfoToggleModule('Make Unique', 'Make this Group instance unique, including all of its children.', PropertiesPlus.submitGroupInstanceMakeUnique);
    PropertiesPlus.singleGroupInstanceToolsInfoCard.appendChild(singleGroupInstanceMakeUniqueButtonModule.element);

    // make unique (non-recursive) button module
    const singleGroupInstanceMakeUniqueNRButtonModule = new FormIt.PluginUI.ButtonWithInfoToggleModule('Make Unique (non-recursive)', 'Make this Group instance unique, but skip all of its children.', PropertiesPlus.submitGroupInstanceMakeUniqueNR);
    PropertiesPlus.singleGroupInstanceToolsInfoCard.appendChild(singleGroupInstanceMakeUniqueNRButtonModule.element);

    //
    // create the single group instance attributes container - starts hidden
    //

    PropertiesPlus.singleGroupInstanceAttributesInfoCard = new FormIt.PluginUI.StringAttributeListViewOnly('Group Instance Attributes', false, 200);
    infoCardsContainer.appendChild(PropertiesPlus.singleGroupInstanceAttributesInfoCard.element);

    // this is a work in progress
    if (displayWIP)
    {
        // spacer
        const spacerDiv2 = document.createElement('div');
        spacerDiv2.className = 'horizontalSpacer';

        // position modules
        const positionCoordinatesContainerDiv = FormIt.PluginUI.createHorizontalModuleContainer(PropertiesPlus.singleGroupInstanceDetailsInfoCard);

        const positionCoordinatesXModule = new FormIt.PluginUI.TextInputModule('Position X: ', 'positionCoordinatesX', 'inputModuleContainer', singleGroupInstancePosXInputID, PropertiesPlus.submitGroupInstanceRename);
        positionCoordinatesContainerDiv.appendChild(positionCoordinatesXModule.element);

        const positionCoordinatesYModule = new FormIt.PluginUI.TextInputModule('Position Y: ', 'positionCoordinatesY', 'inputModuleContainer', singleGroupInstancePosYInputID, PropertiesPlus.submitGroupInstanceRename);
        positionCoordinatesContainerDiv.appendChild(positionCoordinatesYModule.element);

        const positionCoordinatesZModule = new FormIt.PluginUI.TextInputModule(positionCoordinatesContainerDiv, 'Position Z: ', 'positionCoordinatesZ', 'inputModuleContainer', singleGroupInstancePosZInputID, PropertiesPlus.submitGroupInstanceRename);
        positionCoordinatesContainerDiv.append(positionCoordinatesZModule.element);
    }

    //
    // create the multi group instance details container - starts hidden
    //
    PropertiesPlus.multiGroupInstanceDetailsInfoCard = document.createElement('div');
    PropertiesPlus.multiGroupInstanceDetailsInfoCard.id = 'multiGroupInfoContainer';
    PropertiesPlus.multiGroupInstanceDetailsInfoCard.className = 'hide';

    const multiGroupInstanceDetailsHeaderDiv = document.createElement('div');
    multiGroupInstanceDetailsHeaderDiv.id = 'groupInfoHeaderDiv';
    multiGroupInstanceDetailsHeaderDiv.className = 'infoHeader';
    multiGroupInstanceDetailsHeaderDiv.innerHTML = 'Multiple Group Instances';

    infoCardsContainer.appendChild(PropertiesPlus.multiGroupInstanceDetailsInfoCard);
    PropertiesPlus.multiGroupInstanceDetailsInfoCard.appendChild(multiGroupInstanceDetailsHeaderDiv);

    // rename module
    const multiGroupInstanceNameContainer = new FormIt.PluginUI.TextInputModule('Instance Name: ', 'multiGroupInstanceNameContainer', 'inputModuleContainerStandalone', multiGroupInstanceNameInputID, PropertiesPlus.submitGroupInstanceRename);
    PropertiesPlus.multiGroupInstanceDetailsInfoCard.appendChild(multiGroupInstanceNameContainer.element);

    //
    // create the footer
    //
    const footerModule = new FormIt.PluginUI.FooterModule;
    window.document.body.appendChild(footerModule.element)
}

// update all values with data from the application
PropertiesPlus.updateUI = function()
{
    let args = { "nMaxObjectCount": PropertiesPlus.nMaxObjectCount };
    FormItInterface.CallMethod("PropertiesPlus.getSelectionInfo", args, function(result)
    {
        PropertiesPlus.updateQuantification(result);
    });
}

PropertiesPlus.setUIStateToEnabled = function()
{
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
    // hide the info cards container
    let infoCardsContainer = document.getElementById(infoCardsContainerID);
    infoCardsContainer.className = 'hide';

    // show the dsiabled state container
    let disabledStateContainer = document.getElementById(disabledStateContainerID);
    disabledStateContainer.className = 'infoContainer';
}

// clear all arrays in the selectionInfo object
PropertiesPlus.clearQuantification = function(currentSelectionInfo)
{
    for (let i = 0; i < currentSelectionInfo.length; i++)
    {
        currentSelectionInfo[i] = [];
    }
}

// update the values in the UI based on the current FormIt selection
// TODO: this needs to be broken up
PropertiesPlus.updateQuantification = function(currentSelectionData)
{
    PropertiesPlus.currentSelectionInfo = JSON.parse(currentSelectionData);

    // update all info cards
    PropertiesPlus.editingContextInfoCard.update(PropertiesPlus.currentSelectionInfo);
    PropertiesPlus.selectionCountInfoCard.update(PropertiesPlus.currentSelectionInfo);

    // TODO: simplify the remainder below
    // and move monolithic update code into separate functions

    objectCount = PropertiesPlus.currentSelectionInfo.nSelectedTotalCount;

    // if too many items are selected
    // clear the current selection info so downstream calculations think nothing is selected
    if (objectCount > PropertiesPlus.nMaxObjectCount)
    {
        PropertiesPlus.clearQuantification(PropertiesPlus.currentSelectionInfo);
        objectCount = 0;
    }

    //
    // set flags based on selection
    //

    // if there's just one Group Instance selected, set a flag
    if (PropertiesPlus.currentSelectionInfo.aSelectedGroupInstanceIDs.length == 1)
    {
        //console.log("Only a single instance selected.");
        PropertiesPlus.bIsSingleGroupInstance = true;
    }
    else 
    {
        PropertiesPlus.bIsSingleGroupInstance = false;
    }

    // if one or more Group instances (WSM object #24) are selected, set a flag
    for (let i = 0; i < objectCount; i++)
    {
        if (PropertiesPlus.currentSelectionInfo.aSelectedObjectTypes[i] == 24)
        {
            //console.log("At least one instance is selected.");
            PropertiesPlus.bIsOneOrMoreGroupInstances = true;
            break;
        }
        else
        {
            PropertiesPlus.bIsOneOrMoreGroupInstances = false;
        }
    }

    // if multiple Group instances are selected, set a flag
    if (PropertiesPlus.currentSelectionInfo.nSelectedGroupInstanceCount > 1)
    {
        //console.log("At least one instance is selected.");
        PropertiesPlus.bIsMultipleGroupInstances = true;
    }
    else
    {
        PropertiesPlus.bIsMultipleGroupInstances = false;
    }

    //
    // update counts or hide UI based on flags 
    //

    // if a single non-instance object is selected, enable that info card and update it
    if (objectCount == 1 && !PropertiesPlus.bIsSingleGroupInstance)
    {
        PropertiesPlus.singleObjectDetailsInfoCard.className = 'infoContainer';
        PropertiesPlus.singleObjectIDDiv.innerHTML = 'Object ID: ' + PropertiesPlus.currentSelectionInfo.aSelectedObjectIDs[0];
    }
    else 
    {
        PropertiesPlus.singleObjectDetailsInfoCard.className = 'hide';
    }

    // if a single instance is selected, enable HTML and update it
    if (PropertiesPlus.bIsSingleGroupInstance)
    {
        // enable the group family and instance info containers
        PropertiesPlus.singleGroupHistoryDetailsInfoCard.className = 'infoContainer';
        PropertiesPlus.singleGroupInstanceDetailsInfoCard.className = 'infoContainer';
        PropertiesPlus.singleGroupInstanceToolsInfoCard.className = 'infoContainer';
        PropertiesPlus.singleGroupInstanceAttributesInfoCard.stringAttributeListInfoCard.show();

        // update group history details
        PropertiesPlus.singleGroupHistoryIDDiv.innerHTML = 'History ID: ' + PropertiesPlus.currentSelectionInfo.aSelectedGroupHistoryIDs[0];
        let groupFamilyName = PropertiesPlus.currentSelectionInfo.aSelectedGroupNames[0];
        let singleGroupFamilyNameInput = document.getElementById(singleGroupFamilyNameInputID);
        singleGroupFamilyNameInput.value = groupFamilyName;

        // update group instance details
        PropertiesPlus.singleGroupInstanceIDDiv.innerHTML = 'Instance ID: ' + PropertiesPlus.currentSelectionInfo.aSelectedObjectIDs[0];

        PropertiesPlus.singleGroupInstanceScaleXInput.value = PropertiesPlus.currentSelectionInfo.fSelectedInstanceTransformScaleX;
        PropertiesPlus.singleGroupInstanceScaleYInput.value = PropertiesPlus.currentSelectionInfo.fSelectedInstanceTransformScaleY;
        PropertiesPlus.singleGroupInstanceScaleZInput.value = PropertiesPlus.currentSelectionInfo.fSelectedInstanceTransformScaleZ;

        let groupInstanceName = PropertiesPlus.currentSelectionInfo.aSelectedObjectNames[0];
        let singleGroupInstanceNameInput = document.getElementById(singleGroupInstanceNameInputID);
        singleGroupInstanceNameInput.value = groupInstanceName;

        // update the attributes list
        PropertiesPlus.singleGroupInstanceAttributesInfoCard.update(PropertiesPlus.currentSelectionInfo.aSelectedGroupInstanceAttributeIDs, PropertiesPlus.currentSelectionInfo.aSelectedGroupInstanceAttributes);
    }
    else
    {
        PropertiesPlus.singleGroupHistoryDetailsInfoCard.className = 'hide';
        PropertiesPlus.singleGroupInstanceDetailsInfoCard.className = 'hide';
        PropertiesPlus.singleGroupInstanceToolsInfoCard.className = 'hide';
        PropertiesPlus.singleGroupInstanceAttributesInfoCard.stringAttributeListInfoCard.hide();
    }

    // if multiple group instances are selected, enable HTML and update it
    if (PropertiesPlus.bIsMultipleGroupInstances)
    {
        // if the instances come from the same Group family, display the single Group family container and show the name
        if (PropertiesPlus.currentSelectionInfo.bIsConsistentGroupHistoryIDs)
        {
            // hide the multi Group family container, and display the single Group family details container
            multiGroupFamilyDetailsContainerDiv.className = 'hide';
            PropertiesPlus.singleGroupHistoryDetailsInfoCard.className = 'infoContainer';

            // update the name input with the current name
            let groupFamilyName = PropertiesPlus.currentSelectionInfo.aSelectedGroupNames[0];
            let singleGroupFamilyNameInput = document.getElementById(singleGroupFamilyNameInputID);
            singleGroupFamilyNameInput.value = groupFamilyName;
        }
        // otherwise, these instances come from different families, so display the multi Group family container
        else
        {
            // hide the single Group family container, and display the multi Group family details container
            PropertiesPlus.singleGroupHistoryDetailsInfoCard.className = 'hide';
            multiGroupFamilyDetailsContainerDiv.className = 'infoContainer';

            let multiGroupFamilyNameInput = document.getElementById(multiGroupFamilyNameInputID);

            // if all of the group family names are consistent, display the common name as placeholder text
            if (PropertiesPlus.currentSelectionInfo.bIsConsistentGroupNames === true)
            {
                let groupFamilyName = PropertiesPlus.currentSelectionInfo.aSelectedGroupNames[0];
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

        PropertiesPlus.multiGroupInstanceDetailsInfoCard.className = 'infoContainer';

        // if all of the instance names are consistent, display the common name as placeholder text
        if (PropertiesPlus.currentSelectionInfo.bIsConsistentGroupInstanceNames === true)
        {
            let groupInstanceName = PropertiesPlus.currentSelectionInfo.aSelectedGroupInstanceNames[0];
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
        PropertiesPlus.multiGroupInstanceDetailsInfoCard.className = 'hide'; 
    }
    
    // hide elements that shouldn't display with no selection
    if (objectCount === 0)
    {
        PropertiesPlus.singleObjectDetailsInfoCard.className = 'hide';
        PropertiesPlus.singleGroupInstanceDetailsInfoCard.className = 'hide';
        PropertiesPlus.singleGroupInstanceToolsInfoCard.className = 'hide';
        PropertiesPlus.singleGroupInstanceAttributesInfoCard.stringAttributeListInfoCard.hide();
        PropertiesPlus.multiGroupInstanceDetailsInfoCard.className = 'hide';
    }
    
    // hide elements that shouldn't display with just 1 object in the selection
    if (objectCount == 1)
    {
        PropertiesPlus.multiGroupInstanceDetailsInfoCard.className = 'hide'; 
    }
}

// determine if the user has chosen to update the UI on selection
PropertiesPlus.bRecomputeOnSelection = function()
{
    return document.getElementById(recomputeOnSelectionInputID).checked;
}

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

// update an instance's scale
PropertiesPlus.submitGroupInstanceScale = function()
{
    const args = {
        "nEditingHistoryID" : PropertiesPlus.currentSelectionInfo.nEditingHistoryID,
        "nSingleGroupInstanceID" : PropertiesPlus.currentSelectionInfo.aSelectedObjectIDs[0],
        "singleGroupInstanceTransform" : PropertiesPlus.currentSelectionInfo.selectedInstanceTransform,
        "fSingleGroupInstanceScaleX" : PropertiesPlus.singleGroupInstanceScaleXInput.value,
        "fSingleGroupInstanceScaleY" : PropertiesPlus.singleGroupInstanceScaleYInput.value,
        "fSingleGroupInstanceScaleZ" : PropertiesPlus.singleGroupInstanceScaleZInput.value
    }

    window.FormItInterface.CallMethod("PropertiesPlus.setGroupInstanceScale", args);

    // update the quantification so Properties Plus shows the latest data
    PropertiesPlus.updateUI();
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
