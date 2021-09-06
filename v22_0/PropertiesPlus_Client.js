if (typeof PropertiesPlus == 'undefined')
{
    PropertiesPlus = {};
}

// the current selection
let currentSelection;

// this is the history we're operating in
let nHistoryID;
let historyDepth = 0;
let editingHistoryName;
let editingHistoryInstances;

// instantiate arrays
let selectedObjectsIDArray;
let selectedObjectsTypeArray;
let selectedObjectsNameArray;
let selectedObjectsLevelsBoolArray;
let selectedObjectsGroupFamilyIDArray;
let selectedObjectsGroupFamilyHistoryIDArray;
let selectedObjectsGroupFamilyNameArray;
let selectedObjectsGroupInstanceIDArray;
let selectedObjectsGroupInstanceNameArray;

// instantiate counts
let vertexCount;
let edgeCount;
let faceCount;
let bodyCount;
let groupFamilyCount;
let groupInstanceCount;
let identicalGroupInstanceCount;
let meshCount;
let lineMeshCount;
let pointMeshCount;

// instantiate booleans
let isConsistentGroupFamilyHistoryIDs;
let isConsistentGroupFamilyNames;
let isConsistentGroupInstanceNames;

// updates variables and arrays about the items in the selection set
PropertiesPlus.getSelectionData = async function(maxSelectionCount)
{    
    console.clear();
    await FormIt.ConsoleLog("Properties Plus Plugin\n");

    // clear arrays
    selectedObjectsIDArray = [];
    selectedObjectsTypeArray = [];
    selectedObjectsNameArray = [];
    selectedObjectsLevelsBoolArray = [];
    selectedObjectsGroupFamilyIDArray = [];
    selectedObjectsGroupFamilyHistoryIDArray = [];
    selectedObjectsGroupFamilyNameArray = [];
    selectedObjectsGroupInstanceIDArray = [];
    selectedObjectsGroupInstanceNameArray = [];

    // clear counts
    vertexCount = 0;
    edgeCount = 0;
    faceCount = 0;
    bodyCount = 0;
    groupFamilyCount = 0;
    groupInstanceCount = 0;
    identicalGroupInstanceCount = 0;
    meshCount = 0;
    lineMeshCount = 0;
    pointMeshCount = 0;

    // clear booleans
    isConsistentGroupFamilyHistoryIDs = false;
    isConsistentGroupFamilyNames = false;
    isConsistentGroupInstanceNames = false;

    // get current history
    nHistoryID = await FormIt.GroupEdit.GetEditingHistoryID();
    //await FormIt.ConsoleLog("Current history: " + JSON.stringify(nHistoryID));

    // get the editing history name
    if (nHistoryID === 0)
    {
        editingHistoryName = "Main Sketch";
    } 
    else 
    {
        // get the Group family name
        editingHistoryName = await PropertiesPlus.getGroupFamilyName(nHistoryID);
    }

    // determine how many instances will be edited in the current editing history
    if (nHistoryID === 0)
    {
        editingHistoryInstances = 1;
    } 
    else 
    {
        editingHistoryInstances = WSM.APIGetAllAggregateTransf3dsReadOnly(nHistoryID, 0).paths.length;
    }

    
    await FormIt.ConsoleLog("Currently editing: " + editingHistoryName + " (" + editingHistoryInstances + " in model)\n");

    // get current selection
    currentSelection = await FormIt.Selection.GetSelections();
    //await FormIt.ConsoleLog("Current selection: " + JSON.stringify(currentSelection));
    await FormIt.ConsoleLog("Number of objects selected: " + currentSelection.length);

    // for each object in the selection, get info
    for (let i = 0; i < currentSelection.length; i++)
    {
        // if you're not in the Main History, calculate the depth to extract the correct history data
        historyDepth = (currentSelection[i]["ids"].length) - 1;

        // get objectID of the current selection, then push the results into an array
        let nObjectID = currentSelection[i]["ids"][historyDepth]["Object"];
        //await FormIt.ConsoleLog("Selection ID: " + nObjectID);
        selectedObjectsIDArray.push(nObjectID);

        // if too many items are selected, skip the rest of the info-gathering below
        if (currentSelection.length > maxSelectionCount)
        {
            continue;
        }

        // get object type of the current selection, then push the results into an array
        let nType = await WSM.APIGetObjectTypeReadOnly(nHistoryID, nObjectID);
        //await FormIt.ConsoleLog("Object type: " + nType);
        selectedObjectsTypeArray.push(nType);
        //await FormIt.ConsoleLog("Object type array: " + selectedObjectsTypeArray);

        // get the properties of this object
        let objectProperties = await WSM.APIGetObjectPropertiesReadOnly(nHistoryID, nObjectID);
        //await FormIt.ConsoleLog("Object properties: " + JSON.stringify(objectProperties));

        // get the name of this object, then push the results into an array
        let objectName = objectProperties.sObjectName;
        selectedObjectsNameArray.push(objectName);
        //await FormIt.ConsoleLog("Object name array: " + JSON.stringify(selectedObjectsNameArray));

        // get the Levels setting for this object, then push the results into an array
        let bUseLevels = objectProperties.bReportAreaByLevel;
        selectedObjectsLevelsBoolArray.push(bUseLevels);

        //let bUsesLevels = objectProperties.b

        // get group instance info, if there are any selected, and push the results into arrays
        if (selectedObjectsTypeArray[i] == WSM.nObjectType.nInstanceType)
        {
            // get the Group family ID
            let groupFamilyID = await WSM.APIGetObjectsByTypeReadOnly(nHistoryID, nObjectID, WSM.nGroupType, true)[0];
            selectedObjectsGroupFamilyIDArray.push(groupFamilyID);

            // get the Group family History ID
            let groupFamilyHistoryID = await WSM.APIGetGroupReferencedHistoryReadOnly(nHistoryID, groupFamilyID);
            selectedObjectsGroupFamilyHistoryIDArray.push(groupFamilyHistoryID);

            // get the Group family name
            let groupFamilyName = await PropertiesPlus.getGroupFamilyName(groupFamilyHistoryID);
            selectedObjectsGroupFamilyNameArray.push(groupFamilyName);

            // push the Group instance name and ID into arrays
            selectedObjectsGroupInstanceNameArray.push(objectName);
            selectedObjectsGroupInstanceIDArray.push(nObjectID);
        }
    }

    // do this only if there is a single Group instance selected
    if (selectedObjectsGroupInstanceIDArray.length == 1)
    {
        let referenceHistoryID = await WSM.APIGetGroupReferencedHistoryReadOnly(nHistoryID, selectedObjectsGroupInstanceIDArray[0]);
        //await FormIt.ConsoleLog("Reference history for this Group: " + referenceHistoryID);

        // determine how many total instances of this Group are in the model
        identicalGroupInstanceCount += await WSM.APIGetAllAggregateTransf3dsReadOnly(referenceHistoryID, 0).paths.length;
        await FormIt.ConsoleLog("Number of instances in model: " + identicalGroupInstanceCount);
    }

    // determine if the instances come from the same group family
    let groupFamilyHistoryIDComparisonResultsArray = testForIdentical(selectedObjectsGroupFamilyHistoryIDArray);
    isConsistentGroupFamilyHistoryIDs = booleanReduce(groupFamilyHistoryIDComparisonResultsArray)

    // determine if the group families are all of the same name
    let groupFamilyNameComparisonResultsArray = testForIdentical(selectedObjectsGroupFamilyNameArray);
    isConsistentGroupFamilyNames = booleanReduce(groupFamilyNameComparisonResultsArray);

    // determine if the group instances are all of the same name
    let groupInstanceNameComparisonResultsArray = testForIdentical(selectedObjectsGroupInstanceNameArray);
    isConsistentGroupInstanceNames = booleanReduce(groupInstanceNameComparisonResultsArray);
    //await FormIt.ConsoleLog("Are group instance names consistent? " + isConsistentGroupInstanceNames);

    // fill out arrays for object types in the selection
    for (let i = 0; i < selectedObjectsTypeArray.length; i ++)
    {
        if (selectedObjectsTypeArray[i] === WSM.nObjectType.nVertexType)
        {
            vertexCount ++;
        }

        if (selectedObjectsTypeArray[i] === WSM.nObjectType.nEdgeType)
        {
            edgeCount ++;
        }

        if (selectedObjectsTypeArray[i] === WSM.nObjectType.nFaceType)
        {
            faceCount ++;
        }

        if (selectedObjectsTypeArray[i] === WSM.nObjectType.nBodyType)
        {
            bodyCount ++;
        }

        if (selectedObjectsTypeArray[i] === WSM.nObjectType.nMeshType)
        {
            meshCount ++;
        }
        if (selectedObjectsTypeArray[i] === WSM.nObjectType.nLineMeshType)
        {
            lineMeshCount ++;
        }
        if (selectedObjectsTypeArray[i] === WSM.nObjectType.nPointMeshType)
        {
            pointMeshCount ++;
        }

        if (selectedObjectsTypeArray[i] === WSM.nObjectType.nObjectType.nInstanceType)
        {
            groupInstanceCount ++;
        }
        
    }

    // return all selection data in a JSON object
    return {
        "nHistoryID": nHistoryID, // editingHistoryID
        "editingHistoryName" : editingHistoryName,
        "editingHistoryInstances" : editingHistoryInstances,
        "currentSelectionInfo" : currentSelection,
        "selectedObjectsIDArray" : selectedObjectsIDArray,
        "selectedObjectsTypeArray" : selectedObjectsTypeArray,
        "selectedObjectsNameArray" : selectedObjectsNameArray,
        "selectedObjectsGroupFamilyHistoryIDArray" : selectedObjectsGroupFamilyHistoryIDArray,
        "selectedObjectsGroupFamilyIDArray" : selectedObjectsGroupFamilyIDArray,
        "selectedObjectsGroupFamilyNameArray" : selectedObjectsGroupFamilyNameArray,
        "selectedObjectsGroupInstanceIDArray" : selectedObjectsGroupInstanceIDArray,
        "selectedObjectsGroupInstanceNameArray" : selectedObjectsGroupInstanceNameArray,
        "vertexCount" : vertexCount,
        "edgeCount" : edgeCount,
        "faceCount" : faceCount,
        "bodyCount" : bodyCount,
        "meshCount" : meshCount,
        "lineMeshCount" : lineMeshCount,
        "pointMeshCount" : pointMeshCount,
        "groupInstanceCount" : groupInstanceCount,
        "isConsistentGroupFamilyHistoryIDs" : isConsistentGroupFamilyHistoryIDs,
        "isConsistentGroupFamilyNames" : isConsistentGroupFamilyNames,
        "isConsistentGroupInstanceNames" : isConsistentGroupInstanceNames,
        "identicalGroupInstanceCount" : identicalGroupInstanceCount
    };
}

PropertiesPlus.deselectObjectsByType = async function(args)
{
    // define a new selection
    let newSelection = [];

    // loop through the original selection, 
    // check whether each object matches the objectType
    // if not, add it to the new selection
    for (let i = 0; i < selectedObjectsTypeArray.length; i++)
    {
        if (selectedObjectsTypeArray[i] != args.objectTypeToDeselect)
        {
            newSelection.push(currentSelection[i]);
        }
    }

    // clear the selection
    await FormIt.Selection.ClearSelections();

    // set the new selection
    await FormIt.Selection.SetSelections(newSelection);
}

PropertiesPlus.getGroupFamilyName = async function(groupHistoryID)
{
    let revitFamilyInformation = await WSM.APIGetRevitFamilyInformationReadOnly(groupHistoryID);
    let groupName = revitFamilyInformation.familyReference;

    // if the Group name is empty, that means it hasn't been set
    // so use the default Group naming convention: "History " + "historyID"
    if (groupName == '')
    {
        groupName = "History " + groupHistoryID;;
    }

    return groupName;
}

PropertiesPlus.calculateVolume = async function()
{
    let totalVolume = [];

    // for each object selected, get the ObjectID and calculate the volume
    for (let j = 0; j < selectedObjectsIDArray.length; j++)
    {
        // calculate the volume of the selection
        let selectedVolume = await WSM.APIComputeVolumeReadOnly(nHistoryID, selectedObjectsIDArray[j]);
        await FormIt.ConsoleLog("Selected volume: " + JSON.stringify(selectedVolume));

        // add multiple volumes up
        totalVolume.push(selectedVolume);
        await FormIt.ConsoleLog("Accumulated volume array: " + JSON.stringify(totalVolume));
    }
}

PropertiesPlus.renameGroupFamilies = async function(args)
{
    if (selectedObjectsGroupFamilyHistoryIDArray.length === 1 || eliminateDuplicatesInArray(selectedObjectsGroupFamilyHistoryIDArray).length === 1)
    {
        await WSM.APISetRevitFamilyInformation(selectedObjectsGroupFamilyHistoryIDArray[0], false, false, "", args.singleGroupFamilyRename, "", "");
    }
    else
    {
        for (let i = 0; i < selectedObjectsGroupFamilyIDArray.length; i++)
        {
            // TODO: restore Group category on rename
            await WSM.APISetRevitFamilyInformation(selectedObjectsGroupFamilyHistoryIDArray[i], false, false, "", args.multiGroupFamilyRename, "", "");
        }
    }
}

PropertiesPlus.renameGroupInstances = async function(args)
{
    if (selectedObjectsGroupInstanceIDArray.length == 1)
    {
        await WSM.APISetObjectProperties(nHistoryID, selectedObjectsGroupInstanceIDArray[0], args.singleGroupInstanceRename, selectedObjectsLevelsBoolArray[0]);
    }
    else
    {
        for (let i = 0; i < selectedObjectsGroupInstanceIDArray.length; i++)
        {
            await WSM.APISetObjectProperties(nHistoryID, selectedObjectsGroupInstanceIDArray[i], args.multiGroupInstanceRename, selectedObjectsLevelsBoolArray[i]);
        }
    }
}

PropertiesPlus.makeSingleGroupInstanceUnique = async function(args)
{
    // if only one instance exists in the model, this instance is already unique
    if (identicalGroupInstanceCount == 1)
    {
        let message = selectedObjectsGroupFamilyNameArray[0] + " is already unique."
        await FormIt.UI.ShowNotification(message, FormIt.NotificationType.Information, 0);
    }
    else 
    {
        // capture some data about the current selection before it's cleared
        let originalSelection = currentSelection;
        let originalGroupName = selectedObjectsGroupFamilyNameArray[0];

        // make unique
        let newGroupID = await WSM.APICreateSeparateHistoriesForInstances(nHistoryID, selectedObjectsGroupInstanceIDArray[0], false);
    
        // get the data changed in this history
        let changedData = await WSM.APIGetCreatedChangedAndDeletedInActiveDeltaReadOnly(nHistoryID, WSM.nObjectType.nInstanceType);

        // get the new unique instance ID for selection
        let newUniqueInstanceID = changedData["changed"];
    
        //await FormIt.ConsoleLog("Unique instance ID: " + JSON.stringify(newUniqueInstanceID));
    
        // clear the selection
        await FormIt.Selection.ClearSelections();

        // get the new group history ID
        let newGroupHistoryID = await WSM.APIGetGroupReferencedHistoryReadOnly(nHistoryID, Number(newGroupID));

        // get the new group name
        let newGroupName = await PropertiesPlus.getGroupFamilyName(newGroupHistoryID);
    
        // determine the new selection path
        let newSelectionPath = originalSelection[0];
        // redefine the object ID for the selection path
        newSelectionPath["ids"][historyDepth]["Object"] = Number(newUniqueInstanceID);
        
        // add the newly-changed objects to the selection
        await FormIt.Selection.SetSelections(newSelectionPath);
    
        let message = newGroupName + " is now unique from " + originalGroupName + ".";
        await FormIt.UI.ShowNotification(message, FormIt.NotificationType.Success, 0);
    }
}

// the non-recursive version of Make Unique
PropertiesPlus.makeSingleGroupInstanceUniqueNR = async function(args)
{
    // if only one instance exists in the model, this instance is already unique
    if (identicalGroupInstanceCount == 1)
    {
        let message = selectedObjectsGroupFamilyNameArray[0] + " is already unique."
        await FormIt.UI.ShowNotification(message, FormIt.NotificationType.Information, 0);
    }
    else 
    {
        // capture some data about the current selection before it's cleared
        let originalSelection = currentSelection;
        let originalGroupName = selectedObjectsGroupFamilyNameArray[0];

        // ungroup the instance
        await WSM.APIFlattenGroupsOrInstances(nHistoryID, selectedObjectsGroupInstanceIDArray[0], false, false);
    
        // get the data changed in this history
        let changedData = await WSM.APIGetCreatedChangedAndDeletedInActiveDeltaReadOnly(nHistoryID, WSM.nObjectType.nUnSpecifiedType);

        // get objects that were ungrouped
        let ungroupedObjectIDs = changedData["created"];
    
        //await FormIt.ConsoleLog("Unique instance ID: " + JSON.stringify(newUniqueInstanceID));
    
        // clear the selection
        //FormIt.Selection.ClearSelections();

        // get the new group ID
        let newGroupID = await WSM.APICreateGroup(nHistoryID, ungroupedObjectIDs);

        // get the new group history ID
        let newGroupHistoryID = await WSM.APIGetGroupReferencedHistoryReadOnly(nHistoryID, Number(newGroupID));

        // get thew new group instance ID
        let newGroupInstanceChangedData = await WSM.APIGetCreatedChangedAndDeletedInActiveDeltaReadOnly(nHistoryID, WSM.nObjectType.nInstanceType);
        let newGroupInstanceID = newGroupInstanceChangedData["created"];

        // get the new group name
        let newGroupName = PropertiesPlus.getGroupFamilyName(newGroupHistoryID);
    
        // determine the new selection path
        let newSelectionPath = originalSelection[0];
        // redefine the object ID for the selection path
        newSelectionPath["ids"][historyDepth]["Object"] = Number(newGroupInstanceID);
        
        // add the newly-changed objects to the selection
        FormIt.Selection.SetSelections(newSelectionPath);
    
        let message = newGroupName + " is now non-recursively unique from " + originalGroupName + ".";
        FormIt.UI.ShowNotification(message, FormIt.NotificationType.Success, 0);
    }
}


// not used yet
PropertiesPlus.makeMultipleGroupInstancesUnique = function(args)
{
    // if only one instance exists in the model, this instance is already unique
    if (identicalGroupInstanceCount == 1)
    {
        let message = selectedObjectsGroupFamilyNameArray[0] + " was already unique."
        FormIt.UI.ShowNotification(message, FormIt.NotificationType.Information, 0);
    }
    else 
    {
        // capture some data about the current selection before it's cleared
        let originalSelection = currentSelection;
        let originalGroupName = selectedObjectsGroupFamilyNameArray[0];

        // create a new array to capture the now-unique instances
        let newUniqueInstanceIDArray = [];
    
        for (let i = 0; i < selectedObjectsGroupInstanceIDArray.length; i++)
        {
            WSM.APICreateSeparateHistoriesForInstances(nHistoryID, selectedObjectsGroupInstanceIDArray[i], false);
        
            // get the data changed in this history
            let changedData = WSM.APIGetCreatedChangedAndDeletedInActiveDeltaReadOnly(nHistoryID, WSM.nObjectType.nInstanceType);
    
            // add the changed instance ID to the array
            let newUniqueInstanceID = changedData["changed"];
            newUniqueInstanceIDArray.push(newUniqueInstanceID);
        
            //await FormIt.ConsoleLog("Unique instance ID: " + JSON.stringify(newUniqueInstanceID));
        }
    
        // clear the selection
        FormIt.Selection.ClearSelections();
    
        // add the newly-unique objects back into selection
        for (let i = 0; i < originalSelection.length; i++)
        {
            // determine the new selection path
            let newSelectionPath = originalSelection[i];
            // redefine the object ID for the selection path
            newSelectionPath["ids"][historyDepth]["Object"] = Number(newUniqueInstanceIDArray[i]);
            
            // add the newly-changed objects to the selection
            FormIt.Selection.SetSelections(newSelectionPath);
        }
    
        let message = " is now unique from " + originalGroupName + ".";
        FormIt.UI.ShowNotification(message, FormIt.NotificationType.Success, 0);
    }
}
