if (typeof PropertiesPlus == 'undefined')
{
    PropertiesPlus = {};
}

// the current selection
var currentSelection = undefined;

// this is the history we're operating in
var nHistoryID = 0;
var nHistoryDepth = 0;
var editingHistoryName = undefined;
var nEditingHistoryInstances = 0;

// instantiate arrays
var aSelectedObjectsIDArray = [];
var aSelectedObjectsTypeArray = [];
var selectedObjectsNameArray = [];
var selectedObjectsLevelsBoolArray = [];
var selectedObjectsGroupFamilyIDArray = [];
var selectedObjectsGroupFamilyHistoryIDArray = [];
var selectedObjectsGroupFamilyNameArray = [];
var selectedObjectsGroupInstanceIDArray = [];
var selectedObjectsGroupInstanceNameArray = [];

// instantiate counts
var vertexCount = 0;
var edgeCount = 0;
var faceCount = 0;
var bodyCount = 0;
var groupFamilyCount = 0;
var groupInstanceCount = 0;
var identicalGroupInstanceCount = 0;
var meshCount = 0;
var lineMeshCount = 0;
var pointMeshCount = 0;

// instantiate booleans
var isConsistentGroupFamilyHistoryIDs = false;
var isConsistentGroupFamilyNames = false;
var isConsistentGroupInstanceNames = false;

// package up everything we need in a JSON object for use in the web script
PropertiesPlus.buildSelectionInfoObject = function()
{
    var selectionInfoObject = {
        "nHistoryID": nHistoryID, // editingHistoryID
        "editingHistoryName" : editingHistoryName,
        "nEditingHistoryInstances" : nEditingHistoryInstances,
        "aSelectedObjectsIDArray" : aSelectedObjectsIDArray,
        "aSelectedObjectsTypeArray" : aSelectedObjectsTypeArray,
        "selectedObjectsNameArray" : selectedObjectsNameArray,
        "selectedObjectsGroupFamilyHistoryIDArray" : selectedObjectsGroupFamilyHistoryIDArray,
        "selectedObjectsGroupFamilyIDArray" : selectedObjectsGroupFamilyIDArray,
        "selectedObjectsGroupFamilyNameArray" : selectedObjectsGroupFamilyNameArray,
        "selectedObjectsGroupInstanceIDArray" : selectedObjectsGroupInstanceIDArray,
        "selectedObjectsGroupInstanceNameArray" : selectedObjectsGroupInstanceNameArray,
        "totalCount" : totalCount,
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
    return selectionInfoObject;
}

// updates variables and arrays about the items in the selection set
PropertiesPlus.GetSelectionInfo = function(args)
{    
    console.clear();
    console.log("Properties Plus Plugin\n");

    // clear arrays
    aSelectedObjectsIDArray = [];
    aSelectedObjectsTypeArray = [];
    selectedObjectsNameArray = [];
    selectedObjectsLevelsBoolArray = [];
    selectedObjectsGroupFamilyIDArray = [];
    selectedObjectsGroupFamilyHistoryIDArray = [];
    selectedObjectsGroupFamilyNameArray = [];
    selectedObjectsGroupInstanceIDArray = [];
    selectedObjectsGroupInstanceNameArray = [];

    // clear counts
    totalCount = 0;
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
    nHistoryID = FormIt.GroupEdit.GetEditingHistoryID();
    //console.log("Current history: " + JSON.stringify(nHistoryID));

    // get the editing history name
    if (nHistoryID === 0)
    {
        editingHistoryName = "Main Sketch";
    } 
    else 
    {
        // get the Group family name
        editingHistoryName = PropertiesPlus.getGroupFamilyName(nHistoryID);
    }

    // determine how many instances will be edited in the current editing history
    if (nHistoryID === 0)
    {
        nEditingHistoryInstances = 1;
    } 
    else 
    {
        nEditingHistoryInstances = WSM.APIGetAllAggregateTransf3dsReadOnly(nHistoryID, 0).paths.length;
    }

    console.log("Currently editing: " + editingHistoryName + " (" + nEditingHistoryInstances + " in model)\n");

    // get current selection
    currentSelection = FormIt.Selection.GetSelections();
    totalCount = currentSelection.length;
    //console.log("Current selection: " + JSON.stringify(currentSelection));
    console.log("Number of objects selected: " + totalCount);

    // if too many items are selected, skip the rest of the info-gathering below
    if (totalCount > args.maxObjectCount)
    {
        return PropertiesPlus.buildSelectionInfoObject();
    }

    // for each object in the selection, get info
    for (var i = 0; i < totalCount; i++)
    {
        // if you're not in the Main History, calculate the depth to extract the correct history data
        nHistoryDepth = (currentSelection[i]["ids"].length) - 1;

        // get objectID of the current selection, then push the results into an array
        var nObjectID = currentSelection[i]["ids"][nHistoryDepth]["Object"];
        //console.log("Selection ID: " + nObjectID);
        aSelectedObjectsIDArray.push(nObjectID);

        // get object type of the current selection, then push the results into an array
        var nType = WSM.APIGetObjectTypeReadOnly(nHistoryID, nObjectID);
        //console.log("Object type: " + nType);
        aSelectedObjectsTypeArray.push(nType);
        //console.log("Object type array: " + selectedObjectsTypeArray);

        // get the properties of this object
        var objectProperties = WSM.APIGetObjectPropertiesReadOnly(nHistoryID, nObjectID);
        //console.log("Object properties: " + JSON.stringify(objectProperties));

        // get the name of this object, then push the results into an array
        var objectName = objectProperties.sObjectName;
        selectedObjectsNameArray.push(objectName);
        //console.log("Object name array: " + JSON.stringify(selectedObjectsNameArray));

        // get the Levels setting for this object, then push the results into an array
        var bUseLevels = objectProperties.bReportAreaByLevel;
        selectedObjectsLevelsBoolArray.push(bUseLevels);

        //var bUsesLevels = objectProperties.b

        // get group instance info, if there are any selected, and push the results into arrays
        if (aSelectedObjectsTypeArray[i] == WSM.nInstanceType)
        {
            // get the Group family ID
            var groupFamilyID = WSM.APIGetObjectsByTypeReadOnly(nHistoryID, nObjectID, WSM.nGroupType, true)[0];
            selectedObjectsGroupFamilyIDArray.push(groupFamilyID);

            // get the Group family History ID
            var groupFamilyHistoryID = WSM.APIGetGroupReferencedHistoryReadOnly(nHistoryID, groupFamilyID);
            selectedObjectsGroupFamilyHistoryIDArray.push(groupFamilyHistoryID);

            // get the Group family name
            var groupFamilyName = PropertiesPlus.getGroupFamilyName(groupFamilyHistoryID);
            selectedObjectsGroupFamilyNameArray.push(groupFamilyName);

            // push the Group instance name and ID into arrays
            selectedObjectsGroupInstanceNameArray.push(objectName);
            selectedObjectsGroupInstanceIDArray.push(nObjectID);
        }
    }

    // do this only if there is a single Group instance selected
    if (selectedObjectsGroupInstanceIDArray.length == 1)
    {
        var referenceHistoryID = WSM.APIGetGroupReferencedHistoryReadOnly(nHistoryID, selectedObjectsGroupInstanceIDArray[0]);
        //console.log("Reference history for this Group: " + referenceHistoryID);

        // determine how many total instances of this Group are in the model
        identicalGroupInstanceCount += WSM.APIGetAllAggregateTransf3dsReadOnly(referenceHistoryID, 0).paths.length;
        console.log("Number of instances in model: " + identicalGroupInstanceCount);
    }

    // determine if the instances come from the same group family
    var groupFamilyHistoryIDComparisonResultsArray = testForIdentical(selectedObjectsGroupFamilyHistoryIDArray);
    isConsistentGroupFamilyHistoryIDs = booleanReduce(groupFamilyHistoryIDComparisonResultsArray)

    // determine if the group families are all of the same name
    var groupFamilyNameComparisonResultsArray = testForIdentical(selectedObjectsGroupFamilyNameArray);
    isConsistentGroupFamilyNames = booleanReduce(groupFamilyNameComparisonResultsArray);

    // determine if the group instances are all of the same name
    var groupInstanceNameComparisonResultsArray = testForIdentical(selectedObjectsGroupInstanceNameArray);
    isConsistentGroupInstanceNames = booleanReduce(groupInstanceNameComparisonResultsArray);
    //console.log("Are group instance names consistent? " + isConsistentGroupInstanceNames);

    // fill out arrays for object types in the selection
    for (var i = 0; i < aSelectedObjectsTypeArray.length; i ++)
    {
        if (aSelectedObjectsTypeArray[i] === WSM.nVertexType)
        {
            vertexCount ++;
        }

        if (aSelectedObjectsTypeArray[i] === WSM.nEdgeType)
        {
            edgeCount ++;
        }

        if (aSelectedObjectsTypeArray[i] === WSM.nFaceType)
        {
            faceCount ++;
        }

        if (aSelectedObjectsTypeArray[i] === WSM.nBodyType)
        {
            bodyCount ++;
        }

        if (aSelectedObjectsTypeArray[i] === WSM.nMeshType)
        {
            meshCount ++;
        }
        if (aSelectedObjectsTypeArray[i] === WSM.nLineMeshType)
        {
            lineMeshCount ++;
        }
        if (aSelectedObjectsTypeArray[i] === WSM.nPointMeshType)
        {
            pointMeshCount ++;
        }

        if (aSelectedObjectsTypeArray[i] === WSM.nInstanceType)
        {
            groupInstanceCount ++;
        }
        
    }

    return PropertiesPlus.buildSelectionInfoObject();
}

PropertiesPlus.deselectObjectsByType = function(args)
{
    // define a new selection
    var newSelection = [];

    // loop through the original selection, 
    // check whether each object matches the objectType
    // if not, add it to the new selection
    for (var i = 0; i < aSelectedObjectsTypeArray.length; i++)
    {
        if (aSelectedObjectsTypeArray[i] != args.objectTypeToDeselect)
        {
            newSelection.push(currentSelection[i]);
        }
    }

    // clear the selection
    FormIt.Selection.ClearSelections();

    // set the new selection
    FormIt.Selection.SetSelections(newSelection);
}

PropertiesPlus.getGroupFamilyName = function(groupHistoryID)
{
    var groupName = WSM.APIGetRevitFamilyInformationReadOnly(groupHistoryID).familyReference;

    // if the Group name is empty, that means it hasn't been set
    // so use the default Group naming convention: "Group " + "historyID"
    if (groupName == '')
    {
        groupName = "Group " + groupHistoryID;;
    }

    return groupName;
}

PropertiesPlus.calculateVolume = function()
{
    var totalVolume = [];

    // for each object selected, get the ObjectID and calculate the volume
    for (var j = 0; j < aSelectedObjectsIDArray.length; j++)
    {
        // calculate the volume of the selection
        var selectedVolume = WSM.APIComputeVolumeReadOnly(nHistoryID, aSelectedObjectsIDArray[j]);
        console.log("Selected volume: " + JSON.stringify(selectedVolume));

        // add multiple volumes up
        totalVolume.push(selectedVolume);
        console.log("Accumulated volume array: " + JSON.stringify(totalVolume));
    }
}

PropertiesPlus.renameGroupFamilies = function(args)
{
    if (selectedObjectsGroupFamilyHistoryIDArray.length === 1 || eliminateDuplicatesInArray(selectedObjectsGroupFamilyHistoryIDArray).length === 1)
    {
        WSM.APISetRevitFamilyInformation(selectedObjectsGroupFamilyHistoryIDArray[0], false, false, "", args.singleGroupFamilyRename, "", "");
    }
    else
    {
        for (var i = 0; i < selectedObjectsGroupFamilyIDArray.length; i++)
        {
            // TODO: restore Group category on rename
            WSM.APISetRevitFamilyInformation(selectedObjectsGroupFamilyHistoryIDArray[i], false, false, "", args.multiGroupFamilyRename, "", "");
        }
    }
}

PropertiesPlus.renameGroupInstances = function(args)
{
    if (selectedObjectsGroupInstanceIDArray.length == 1)
    {
        WSM.APISetObjectProperties(nHistoryID, selectedObjectsGroupInstanceIDArray[0], args.singleGroupInstanceRename, selectedObjectsLevelsBoolArray[0]);
    }
    else
    {
        for (var i = 0; i < selectedObjectsGroupInstanceIDArray.length; i++)
        {
            WSM.APISetObjectProperties(nHistoryID, selectedObjectsGroupInstanceIDArray[i], args.multiGroupInstanceRename, selectedObjectsLevelsBoolArray[i]);
        }
    }
}

PropertiesPlus.makeSingleGroupInstanceUnique = function(args)
{
    // if only one instance exists in the model, this instance is already unique
    if (identicalGroupInstanceCount == 1)
    {
        var message = selectedObjectsGroupFamilyNameArray[0] + " is already unique."
        FormIt.UI.ShowNotification(message, FormIt.NotificationType.Information, 0);
    }
    else 
    {
        // capture some data about the current selection before it's cleared
        var originalSelection = currentSelection;
        var originalGroupName = selectedObjectsGroupFamilyNameArray[0];

        // make unique
        var newGroupID = WSM.APICreateSeparateHistoriesForInstances(nHistoryID, selectedObjectsGroupInstanceIDArray[0], false);
    
        // get the data changed in this history
        var changedData = WSM.APIGetCreatedChangedAndDeletedInActiveDeltaReadOnly(nHistoryID, WSM.nInstanceType);

        // get the new unique instance ID for selection
        var newUniqueInstanceID = changedData["changed"];
    
        //console.log("Unique instance ID: " + JSON.stringify(newUniqueInstanceID));
    
        // clear the selection
        FormIt.Selection.ClearSelections();

        // get the new group history ID
        var newGroupHistoryID = WSM.APIGetGroupReferencedHistoryReadOnly(nHistoryID, Number(newGroupID));

        // get the new group name
        var newGroupName = PropertiesPlus.getGroupFamilyName(newGroupHistoryID);
    
        // determine the new selection path
        var newSelectionPath = originalSelection[0];
        // redefine the object ID for the selection path
        newSelectionPath["ids"][nHistoryDepth]["Object"] = Number(newUniqueInstanceID);
        
        // add the newly-changed objects to the selection
        FormIt.Selection.SetSelections(newSelectionPath);
    
        var message = newGroupName + " is now unique from " + originalGroupName + ".";
        FormIt.UI.ShowNotification(message, FormIt.NotificationType.Success, 0);
    }
}

// the non-recursive version of Make Unique
PropertiesPlus.makeSingleGroupInstanceUniqueNR = function(args)
{
    // if only one instance exists in the model, this instance is already unique
    if (identicalGroupInstanceCount == 1)
    {
        var message = selectedObjectsGroupFamilyNameArray[0] + " is already unique."
        FormIt.UI.ShowNotification(message, FormIt.NotificationType.Information, 0);
    }
    else 
    {
        // capture some data about the current selection before it's cleared
        var originalSelection = currentSelection;
        var originalGroupName = selectedObjectsGroupFamilyNameArray[0];

        // ungroup the instance
        WSM.APIFlattenGroupsOrInstances(nHistoryID, selectedObjectsGroupInstanceIDArray[0], false, false);
    
        // get the data changed in this history
        var changedData = WSM.APIGetCreatedChangedAndDeletedInActiveDeltaReadOnly(nHistoryID, WSM.nUnSpecifiedType);

        // get objects that were ungrouped
        var ungroupedObjectIDs = changedData["created"];
    
        //console.log("Unique instance ID: " + JSON.stringify(newUniqueInstanceID));
    
        // clear the selection
        //FormIt.Selection.ClearSelections();

        // get the new group ID
        var newGroupID = WSM.APICreateGroup(nHistoryID, ungroupedObjectIDs);

        // get the new group history ID
        var newGroupHistoryID = WSM.APIGetGroupReferencedHistoryReadOnly(nHistoryID, Number(newGroupID));

        // get thew new group instance ID
        var newGroupInstanceChangedData = WSM.APIGetCreatedChangedAndDeletedInActiveDeltaReadOnly(nHistoryID, WSM.nInstanceType);
        var newGroupInstanceID = newGroupInstanceChangedData["created"];

        // get the new group name
        var newGroupName = PropertiesPlus.getGroupFamilyName(newGroupHistoryID);
    
        // determine the new selection path
        var newSelectionPath = originalSelection[0];
        // redefine the object ID for the selection path
        newSelectionPath["ids"][nHistoryDepth]["Object"] = Number(newGroupInstanceID);
        
        // add the newly-changed objects to the selection
        FormIt.Selection.SetSelections(newSelectionPath);
    
        var message = newGroupName + " is now non-recursively unique from " + originalGroupName + ".";
        FormIt.UI.ShowNotification(message, FormIt.NotificationType.Success, 0);
    }
}


// not used yet
PropertiesPlus.makeMultipleGroupInstancesUnique = function(args)
{
    // if only one instance exists in the model, this instance is already unique
    if (identicalGroupInstanceCount == 1)
    {
        var message = selectedObjectsGroupFamilyNameArray[0] + " was already unique."
        FormIt.UI.ShowNotification(message, FormIt.NotificationType.Information, 0);
    }
    else 
    {
        // capture some data about the current selection before it's cleared
        var originalSelection = currentSelection;
        var originalGroupName = selectedObjectsGroupFamilyNameArray[0];

        // create a new array to capture the now-unique instances
        var newUniqueInstanceIDArray = [];
    
        for (var i = 0; i < selectedObjectsGroupInstanceIDArray.length; i++)
        {
            WSM.APICreateSeparateHistoriesForInstances(nHistoryID, selectedObjectsGroupInstanceIDArray[i], false);
        
            // get the data changed in this history
            var changedData = WSM.APIGetCreatedChangedAndDeletedInActiveDeltaReadOnly(nHistoryID, WSM.nInstanceType);
    
            // add the changed instance ID to the array
            var newUniqueInstanceID = changedData["changed"];
            newUniqueInstanceIDArray.push(newUniqueInstanceID);
        
            //console.log("Unique instance ID: " + JSON.stringify(newUniqueInstanceID));
        }
    
        // clear the selection
        FormIt.Selection.ClearSelections();
    
        // add the newly-unique objects back into selection
        for (var i = 0; i < originalSelection.length; i++)
        {
            // determine the new selection path
            var newSelectionPath = originalSelection[i];
            // redefine the object ID for the selection path
            newSelectionPath["ids"][nHistoryDepth]["Object"] = Number(newUniqueInstanceIDArray[i]);
            
            // add the newly-changed objects to the selection
            FormIt.Selection.SetSelections(newSelectionPath);
        }
    
        var message = " is now unique from " + originalGroupName + ".";
        FormIt.UI.ShowNotification(message, FormIt.NotificationType.Success, 0);
    }
}
