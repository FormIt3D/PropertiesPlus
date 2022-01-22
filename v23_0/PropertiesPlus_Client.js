if (typeof PropertiesPlus == 'undefined')
{
    PropertiesPlus = {};
}

// the current selection
var aCurrentSelection = undefined;

// this is the history we're operating in
var nHistoryID = 0;
var nHistoryDepth = 0;
var sEditingHistoryName = undefined;
var nEditingHistoryInstances = 0;

// instantiate arrays
var aSelectedObjectIDs = [];
var aSelectedObjectTypes = [];
var aSelectedObjectNames = [];
var aSelectionDoesUseLevelsBools = [];
var aSelectedGroupIDs = [];
var aSelectedGroupHistoryIDs = [];
var aSelectedGroupNames = [];
var aSelectedGroupInstanceIDs = [];
var aSelectedGroupInstanceNames = [];

// instantiate counts
var nSelectedVertexCount = 0;
var nSelectedEdgeCount = 0;
var nSelectedFaceCount = 0;
var nSelectedBodyCount = 0;
var nGroupCount = 0;
var nSelectedGroupInstanceCount = 0;
var nIdenticalGroupInstanceCount = 0;
var nSelectedMeshCount = 0;
var nSelectedLineMeshCount = 0;
var nSelectedPointMeshCount = 0;

// instantiate booleans
var bIsConsistentGroupHistoryIDs = false;
var bIsConsistentGroupNames = false;
var bIsConsistentGroupInstanceNames = false;

// package up everything we need in a JSON object for use in the web script
PropertiesPlus.buildSelectionInfoObject = function()
{
    var selectionInfoObject = {
        "nEditingHistoryID": nEditingHistoryID,
        "sEditingHistoryName" : sEditingHistoryName,
        "nEditingHistoryInstances" : nEditingHistoryInstances,
        "aSelectedObjectIDs" : aSelectedObjectIDs,
        "aSelectedObjectTypes" : aSelectedObjectTypes,
        "aSelectedObjectNames" : aSelectedObjectNames,
        "aSelectedGroupHistoryIDs" : aSelectedGroupHistoryIDs,
        "aSelectedGroupIDs" : aSelectedGroupIDs,
        "aSelectedGroupNames" : aSelectedGroupNames,
        "aSelectedGroupInstanceIDs" : aSelectedGroupInstanceIDs,
        "aSelectedGroupInstanceNames" : aSelectedGroupInstanceNames,
        "aSelectedGroupInstanceAttributes" : aSelectedGroupInstanceAttributes,
        "nSelectedTotalCount" : nSelectedTotalCount,
        "nSelectedVertexCount" : nSelectedVertexCount,
        "nSelectedEdgeCount" : nSelectedEdgeCount,
        "nSelectedFaceCount" : nSelectedFaceCount,
        "nSelectedBodyCount" : nSelectedBodyCount,
        "nSelectedMeshCount" : nSelectedMeshCount,
        "nSelectedLineMeshCount" : nSelectedLineMeshCount,
        "nSelectedPointMeshCount" : nSelectedPointMeshCount,
        "nSelectedGroupInstanceCount" : nSelectedGroupInstanceCount,
        "bIsConsistentGroupHistoryIDs" : bIsConsistentGroupHistoryIDs,
        "isConsistentGroupFamilyNames" : bIsConsistentGroupNames,
        "bIsConsistentGroupInstanceNames" : bIsConsistentGroupInstanceNames,
        "nIdenticalGroupInstanceCount" : nIdenticalGroupInstanceCount
    };
    return selectionInfoObject;
}

// updates variables and arrays about the items in the selection set
PropertiesPlus.GetSelectionInfo = function(args)
{    
    console.clear();
    console.log("Properties Plus Plugin\n");

    // clear arrays
    aSelectedObjectIDs = [];
    aSelectedObjectTypes = [];
    aSelectedObjectNames = [];
    aSelectionDoesUseLevelsBools = [];
    aSelectedGroupIDs = [];
    aSelectedGroupHistoryIDs = [];
    aSelectedGroupNames = [];
    aSelectedGroupInstanceIDs = [];
    aSelectedGroupInstanceNames = [];
    aSelectedGroupInstanceAttributes = [];

    // clear counts
    nSelectedTotalCount = 0;
    nSelectedVertexCount = 0;
    nSelectedEdgeCount = 0;
    nSelectedFaceCount = 0;
    nSelectedBodyCount = 0;
    nGroupCount = 0;
    nSelectedGroupInstanceCount = 0;
    nIdenticalGroupInstanceCount = 0;
    nSelectedMeshCount = 0;
    nSelectedLineMeshCount = 0;
    nSelectedPointMeshCount = 0;

    // clear booleans
    bIsConsistentGroupHistoryIDs = false;
    bIsConsistentGroupNames = false;
    bIsConsistentGroupInstanceNames = false;

    // get current history
    nEditingHistoryID = FormIt.GroupEdit.GetEditingHistoryID();
    //console.log("Current history: " + JSON.stringify(nHistoryID));

    // get the editing history name
    if (nEditingHistoryID === 0)
    {
        sEditingHistoryName = "Main Sketch";
    } 
    else 
    {
        // get the Group family name
        sEditingHistoryName = PropertiesPlus.getGroupFamilyName(nEditingHistoryID);
    }

    // determine how many instances will be edited in the current editing history
    if (nEditingHistoryID === 0)
    {
        nEditingHistoryInstances = 1;
    } 
    else 
    {
        nEditingHistoryInstances = WSM.APIGetAllAggregateTransf3dsReadOnly(nEditingHistoryID, 0).paths.length;
    }

    console.log("Currently editing: " + sEditingHistoryName + " (" + nEditingHistoryInstances + " in model)\n");

    // get current selection
    aCurrentSelection = FormIt.Selection.GetSelections();
    nSelectedTotalCount = aCurrentSelection.length;
    //console.log("Current selection: " + JSON.stringify(currentSelection));
    console.log("Number of objects selected: " + nSelectedTotalCount);

    // if too many items are selected, skip the rest of the info-gathering below
    if (nSelectedTotalCount > args.maxObjectCount)
    {
        return PropertiesPlus.buildSelectionInfoObject();
    }

    // for each object in the selection, get info
    for (var i = 0; i < nSelectedTotalCount; i++)
    {
        // if you're not in the Main History, calculate the depth to extract the correct history data
        nHistoryDepth = (aCurrentSelection[i]["ids"].length) - 1;

        // get objectID of the current selection, then push the results into an array
        var nObjectID = aCurrentSelection[i]["ids"][nHistoryDepth]["Object"];
        //console.log("Selection ID: " + nObjectID);
        aSelectedObjectIDs.push(nObjectID);

        // get object type of the current selection, then push the results into an array
        var nType = WSM.APIGetObjectTypeReadOnly(nEditingHistoryID, nObjectID);
        //console.log("Object type: " + nType);
        aSelectedObjectTypes.push(nType);
        //console.log("Object type array: " + selectedObjectsTypeArray);

        // get the properties of this object
        var objectProperties = WSM.APIGetObjectPropertiesReadOnly(nEditingHistoryID, nObjectID);
        //console.log("Object properties: " + JSON.stringify(objectProperties));

        // get the name of this object, then push the results into an array
        var objectName = objectProperties.sObjectName;
        aSelectedObjectNames.push(objectName);
        //console.log("Object name array: " + JSON.stringify(selectedObjectsNameArray));

        // get the Levels setting for this object, then push the results into an array
        var bUseLevels = objectProperties.bReportAreaByLevel;
        aSelectionDoesUseLevelsBools.push(bUseLevels);

        //var bUsesLevels = objectProperties.b

        // get group instance info, if there are any selected, and push the results into arrays
        if (aSelectedObjectTypes[i] == WSM.nInstanceType)
        {
            // get the Group family ID
            var groupFamilyID = WSM.APIGetObjectsByTypeReadOnly(nEditingHistoryID, nObjectID, WSM.nGroupType, true)[0];
            aSelectedGroupIDs.push(groupFamilyID);

            // get the Group family History ID
            var groupFamilyHistoryID = WSM.APIGetGroupReferencedHistoryReadOnly(nEditingHistoryID, groupFamilyID);
            aSelectedGroupHistoryIDs.push(groupFamilyHistoryID);

            // get the Group family name
            var groupFamilyName = PropertiesPlus.getGroupFamilyName(groupFamilyHistoryID);
            aSelectedGroupNames.push(groupFamilyName);

            // get the group instance attributes if there are any
            var aGroupInstanceAttributeIDs = WSM.APIGetObjectsByTypeReadOnly(nEditingHistoryID, nObjectID, WSM.nStringAttributeType);

            // for each ID, get the string attribute key and value
            // and add it to the array
            for (var i = 0; i < aGroupInstanceAttributeIDs.length; i++)
            {
                // string attribute object
                var stringAttributeObject = WSM.APIGetStringAttributeKeyValueReadOnly(nEditingHistoryID, aGroupInstanceAttributeIDs[i]);

                // push the attribute into the array
                aSelectedGroupInstanceAttributes.push(stringAttributeObject);
            }

            // push the Group instance name and ID into arrays
            aSelectedGroupInstanceNames.push(objectName);
            aSelectedGroupInstanceIDs.push(nObjectID);
        }
    }

    // do this only if there is a single Group instance selected
    if (aSelectedGroupInstanceIDs.length == 1)
    {
        var referenceHistoryID = WSM.APIGetGroupReferencedHistoryReadOnly(nEditingHistoryID, aSelectedGroupInstanceIDs[0]);
        //console.log("Reference history for this Group: " + referenceHistoryID);

        // determine how many total instances of this Group are in the model
        nIdenticalGroupInstanceCount += WSM.APIGetAllAggregateTransf3dsReadOnly(referenceHistoryID, 0).paths.length;
        console.log("Number of instances in model: " + nIdenticalGroupInstanceCount);
    }

    // determine if the instances come from the same group family
    var groupFamilyHistoryIDComparisonResultsArray = testForIdentical(aSelectedGroupHistoryIDs);
    bIsConsistentGroupHistoryIDs = booleanReduce(groupFamilyHistoryIDComparisonResultsArray)

    // determine if the group families are all of the same name
    var groupFamilyNameComparisonResultsArray = testForIdentical(aSelectedGroupNames);
    bIsConsistentGroupNames = booleanReduce(groupFamilyNameComparisonResultsArray);

    // determine if the group instances are all of the same name
    var groupInstanceNameComparisonResultsArray = testForIdentical(aSelectedGroupInstanceNames);
    bIsConsistentGroupInstanceNames = booleanReduce(groupInstanceNameComparisonResultsArray);
    //console.log("Are group instance names consistent? " + isConsistentGroupInstanceNames);

    // fill out arrays for object types in the selection
    for (var i = 0; i < aSelectedObjectTypes.length; i ++)
    {
        if (aSelectedObjectTypes[i] === WSM.nVertexType)
        {
            nSelectedVertexCount ++;
        }

        if (aSelectedObjectTypes[i] === WSM.nEdgeType)
        {
            nSelectedEdgeCount ++;
        }

        if (aSelectedObjectTypes[i] === WSM.nFaceType)
        {
            nSelectedFaceCount ++;
        }

        if (aSelectedObjectTypes[i] === WSM.nBodyType)
        {
            nSelectedBodyCount ++;
        }

        if (aSelectedObjectTypes[i] === WSM.nMeshType)
        {
            nSelectedMeshCount ++;
        }
        if (aSelectedObjectTypes[i] === WSM.nLineMeshType)
        {
            nSelectedLineMeshCount ++;
        }
        if (aSelectedObjectTypes[i] === WSM.nPointMeshType)
        {
            nSelectedPointMeshCount ++;
        }

        if (aSelectedObjectTypes[i] === WSM.nInstanceType)
        {
            nSelectedGroupInstanceCount ++;
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
    for (var i = 0; i < aSelectedObjectTypes.length; i++)
    {
        if (aSelectedObjectTypes[i] != args.objectTypeToDeselect)
        {
            newSelection.push(aCurrentSelection[i]);
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
    for (var j = 0; j < aSelectedObjectIDs.length; j++)
    {
        // calculate the volume of the selection
        var selectedVolume = WSM.APIComputeVolumeReadOnly(nEditingHistoryID, aSelectedObjectIDs[j]);
        console.log("Selected volume: " + JSON.stringify(selectedVolume));

        // add multiple volumes up
        totalVolume.push(selectedVolume);
        console.log("Accumulated volume array: " + JSON.stringify(totalVolume));
    }
}

PropertiesPlus.renameGroupFamilies = function(args)
{
    if (aSelectedGroupHistoryIDs.length === 1 || eliminateDuplicatesInArray(aSelectedGroupHistoryIDs).length === 1)
    {
        WSM.APISetRevitFamilyInformation(aSelectedGroupHistoryIDs[0], false, false, "", args.singleGroupFamilyRename, "", "");
    }
    else
    {
        for (var i = 0; i < aSelectedGroupIDs.length; i++)
        {
            // TODO: restore Group category on rename
            WSM.APISetRevitFamilyInformation(aSelectedGroupHistoryIDs[i], false, false, "", args.multiGroupFamilyRename, "", "");
        }
    }
}

PropertiesPlus.renameGroupInstances = function(args)
{
    if (aSelectedGroupInstanceIDs.length == 1)
    {
        WSM.APISetObjectProperties(nEditingHistoryID, aSelectedGroupInstanceIDs[0], args.singleGroupInstanceRename, aSelectionDoesUseLevelsBools[0]);
    }
    else
    {
        for (var i = 0; i < aSelectedGroupInstanceIDs.length; i++)
        {
            WSM.APISetObjectProperties(nEditingHistoryID, aSelectedGroupInstanceIDs[i], args.multiGroupInstanceRename, aSelectionDoesUseLevelsBools[i]);
        }
    }
}

PropertiesPlus.makeSingleGroupInstanceUnique = function(args)
{
    // if only one instance exists in the model, this instance is already unique
    if (nIdenticalGroupInstanceCount == 1)
    {
        var message = aSelectedGroupNames[0] + " is already unique."
        FormIt.UI.ShowNotification(message, FormIt.NotificationType.Information, 0);
    }
    else 
    {
        // capture some data about the current selection before it's cleared
        var originalSelection = aCurrentSelection;
        var originalGroupName = aSelectedGroupNames[0];

        // make unique
        var newGroupID = WSM.APICreateSeparateHistoriesForInstances(nEditingHistoryID, aSelectedGroupInstanceIDs[0], false);
    
        // get the data changed in this history
        var changedData = WSM.APIGetCreatedChangedAndDeletedInActiveDeltaReadOnly(nEditingHistoryID, WSM.nInstanceType);

        // get the new unique instance ID for selection
        var newUniqueInstanceID = changedData["changed"];
    
        //console.log("Unique instance ID: " + JSON.stringify(newUniqueInstanceID));
    
        // clear the selection
        FormIt.Selection.ClearSelections();

        // get the new group history ID
        var newGroupHistoryID = WSM.APIGetGroupReferencedHistoryReadOnly(nEditingHistoryID, Number(newGroupID));

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
    if (nIdenticalGroupInstanceCount == 1)
    {
        var message = aSelectedGroupNames[0] + " is already unique."
        FormIt.UI.ShowNotification(message, FormIt.NotificationType.Information, 0);
    }
    else 
    {
        // capture some data about the current selection before it's cleared
        var originalSelection = aCurrentSelection;
        var originalGroupName = aSelectedGroupNames[0];

        // ungroup the instance
        WSM.APIFlattenGroupsOrInstances(nEditingHistoryID, aSelectedGroupInstanceIDs[0], false, false);
    
        // get the data changed in this history
        var changedData = WSM.APIGetCreatedChangedAndDeletedInActiveDeltaReadOnly(nEditingHistoryID, WSM.nUnSpecifiedType);

        // get objects that were ungrouped
        var ungroupedObjectIDs = changedData["created"];
    
        //console.log("Unique instance ID: " + JSON.stringify(newUniqueInstanceID));
    
        // clear the selection
        //FormIt.Selection.ClearSelections();

        // get the new group ID
        var newGroupID = WSM.APICreateGroup(nEditingHistoryID, ungroupedObjectIDs);

        // get the new group history ID
        var newGroupHistoryID = WSM.APIGetGroupReferencedHistoryReadOnly(nEditingHistoryID, Number(newGroupID));

        // get thew new group instance ID
        var newGroupInstanceChangedData = WSM.APIGetCreatedChangedAndDeletedInActiveDeltaReadOnly(nEditingHistoryID, WSM.nInstanceType);
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
    if (nIdenticalGroupInstanceCount == 1)
    {
        var message = aSelectedGroupNames[0] + " was already unique."
        FormIt.UI.ShowNotification(message, FormIt.NotificationType.Information, 0);
    }
    else 
    {
        // capture some data about the current selection before it's cleared
        var originalSelection = aCurrentSelection;
        var originalGroupName = aSelectedGroupNames[0];

        // create a new array to capture the now-unique instances
        var newUniqueInstanceIDArray = [];
    
        for (var i = 0; i < aSelectedGroupInstanceIDs.length; i++)
        {
            WSM.APICreateSeparateHistoriesForInstances(nEditingHistoryID, aSelectedGroupInstanceIDs[i], false);
        
            // get the data changed in this history
            var changedData = WSM.APIGetCreatedChangedAndDeletedInActiveDeltaReadOnly(nEditingHistoryID, WSM.nInstanceType);
    
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
