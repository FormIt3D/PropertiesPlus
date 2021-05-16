if (typeof PropertiesPlus == 'undefined')
{
    PropertiesPlus = {};
}

// the current selection
var currentSelection;

// this is the history we're operating in
var nHistoryID;
var historyDepth = 0;
var editingHistoryName;
var editingHistoryInstances;

// instantiate arrays
var selectedObjectsIDArray;
var selectedObjectsTypeArray;
var selectedObjectsNameArray;
var selectedObjectsLevelsBoolArray;
var selectedObjectsGroupFamilyIDArray;
var selectedObjectsGroupFamilyHistoryIDArray;
var selectedObjectsGroupFamilyNameArray;
var selectedObjectsGroupInstanceIDArray;
var selectedObjectsGroupInstanceNameArray;

// instantiate counts
var vertexCount;
var edgeCount;
var faceCount;
var bodyCount;
var groupFamilyCount;
var groupInstanceCount;
var identicalGroupInstanceCount;
var meshCount;

// instantiate booleans
var isConsistentGroupFamilyHistoryIDs;
var isConsistentGroupFamilyNames;
var isConsistentGroupInstanceNames;

// updates variables and arrays about the items in the selection set
PropertiesPlus.GetSelectionInfo = function(args)
{    
    console.clear();
    console.log("Properties Plus Plugin\n");

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
        editingHistoryInstances = 1;
    } 
    else 
    {
        editingHistoryInstances = WSM.APIGetAllAggregateTransf3dsReadOnly(nHistoryID, 0).paths.length;
    }

    
    console.log("Currently editing: " + editingHistoryName + " (" + editingHistoryInstances + " in model)\n");

    // get current selection
    currentSelection = FormIt.Selection.GetSelections();
    //console.log("Current selection: " + JSON.stringify(currentSelection));
    console.log("Number of objects selected: " + currentSelection.length);

    // for each object in the selection, get info
    for (var i = 0; i < currentSelection.length; i++)
    {
        // if you're not in the Main History, calculate the depth to extract the correct history data
        historyDepth = (currentSelection[i]["ids"].length) - 1;

        // get objectID of the current selection, then push the results into an array
        var nObjectID = currentSelection[i]["ids"][historyDepth]["Object"];
        //console.log("Selection ID: " + nObjectID);
        selectedObjectsIDArray.push(nObjectID);

        // if too many items are selected, skip the rest of the info-gathering below
        if (currentSelection.length > args.maxObjectCount)
        {
            continue;
        }

        // get object type of the current selection, then push the results into an array
        var nType = WSM.APIGetObjectTypeReadOnly(nHistoryID, nObjectID);
        //console.log("Object type: " + nType);
        selectedObjectsTypeArray.push(nType);
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
        if (selectedObjectsTypeArray[i] == WSM.nInstanceType)
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
    for (var i = 0; i < selectedObjectsTypeArray.length; i ++)
    {
        if (selectedObjectsTypeArray[i] === WSM.nVertexType)
        {
            vertexCount ++;
        }

        if (selectedObjectsTypeArray[i] === WSM.nEdgeType)
        {
            edgeCount ++;
        }

        if (selectedObjectsTypeArray[i] === WSM.nFaceType)
        {
            faceCount ++;
        }

        if (selectedObjectsTypeArray[i] === WSM.nBodyType)
        {
            bodyCount ++;
        }

        if (selectedObjectsTypeArray[i] === WSM.nMeshType || 
            selectedObjectsTypeArray[i] === WSM.nLineMeshType ||
            selectedObjectsTypeArray[i] === WSM.nPointMeshType)
        {
            meshCount ++;
        }

        if (selectedObjectsTypeArray[i] === WSM.nInstanceType)
        {
            groupInstanceCount ++;
        }
        
    }

    // return everything we need in a JSON object for use in the web script
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
        "groupInstanceCount" : groupInstanceCount,
        "isConsistentGroupFamilyHistoryIDs" : isConsistentGroupFamilyHistoryIDs,
        "isConsistentGroupFamilyNames" : isConsistentGroupFamilyNames,
        "isConsistentGroupInstanceNames" : isConsistentGroupInstanceNames,
        "identicalGroupInstanceCount" : identicalGroupInstanceCount
    };
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
    for (var j = 0; j < selectedObjectsIDArray.length; j++)
    {
        // calculate the volume of the selection
        var selectedVolume = WSM.APIComputeVolumeReadOnly(nHistoryID, selectedObjectsIDArray[j]);
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
        newSelectionPath["ids"][historyDepth]["Object"] = Number(newUniqueInstanceID);
        
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
        var changedData = WSM.APIGetCreatedChangedAndDeletedInActiveDeltaReadOnly(nHistoryID, WSM.nInstanceType);

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
        newSelectionPath["ids"][historyDepth]["Object"] = Number(newGroupInstanceID);
        
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
            newSelectionPath["ids"][historyDepth]["Object"] = Number(newUniqueInstanceIDArray[i]);
            
            // add the newly-changed objects to the selection
            FormIt.Selection.SetSelections(newSelectionPath);
        }
    
        var message = " is now unique from " + originalGroupName + ".";
        FormIt.UI.ShowNotification(message, FormIt.NotificationType.Success, 0);
    }
}
