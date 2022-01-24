if (typeof PropertiesPlus == 'undefined')
{
    PropertiesPlus = {};
}

// the current selection array from FormIt
PropertiesPlus.aCurrentSelection = undefined;
// the current selection info object from Properties Plus
PropertiesPlus.currentSelectionInfo = undefined;

// all selection data packaged up as a JSON object for the web-side to consume
PropertiesPlus.initializeSelectionInfoObject = function()
{
    var selectionInfoObject = {
        "nEditingHistoryID" : 0,
        "nEditingHistoryDepth" : 0,
        "sEditingHistoryName" : '',
        "nEditingHistoryInstances" : 0,
        "aSelectedObjectIDs" : [],
        "aSelectedObjectTypes" : [],
        "aSelectedObjectNames" : [],
        "aSelectedGroupHistoryIDs" : [],
        "aSelectedGroupIDs" : [],
        "aSelectedGroupNames" : [],
        "aSelectedGroupInstanceIDs" : [],
        "aSelectedGroupInstanceNames" : [],
        "aSelectedGroupInstanceAttributes" : [],
        "aSelectedDoesUseLevelsBools" : [],
        "nSelectedTotalCount" : 0,
        "nSelectedVertexCount" : 0,
        "nSelectedEdgeCount" : 0,
        "nSelectedFaceCount" : 0,
        "nSelectedBodyCount" : 0,
        "nSelectedMeshCount" : 0,
        "nSelectedLineMeshCount" : 0,
        "nSelectedPointMeshCount" : 0,
        "nSelectedGroupInstanceCount" : 0,
        "nSelectedIdenticalGroupInstanceCount" : 0,
        "nSelectedUniqueGroupHistoryCount" : 0,
        "bIsConsistentGroupHistoryIDs" : false,
        "isConsistentGroupFamilyNames" : false,
        "bIsConsistentGroupInstanceNames" : false
    };
    return selectionInfoObject;
}

// updates variables and arrays about the items in the selection set
PropertiesPlus.getSelectionInfo = function(args)
{    
    console.clear();
    console.log("Properties Plus Plugin\n");

    // initialize an empty selection info object to be populated
    var selectionInfoObject = PropertiesPlus.initializeSelectionInfoObject();

    // get current history
    selectionInfoObject.nEditingHistoryID = FormIt.GroupEdit.GetEditingHistoryID();
    //console.log("Current history: " + JSON.stringify(nHistoryID));

    // get the editing history name
    if (selectionInfoObject.nEditingHistoryID === 0)
    {
        selectionInfoObject.sEditingHistoryName = "Main Sketch";
    } 
    else 
    {
        // get the Group family name
        selectionInfoObject.sEditingHistoryName = PropertiesPlus.getGroupFamilyName(selectionInfoObject.nEditingHistoryID);
    }

    // determine how many instances will be edited in the current editing history
    if (selectionInfoObject.nEditingHistoryID === 0)
    {
        selectionInfoObject.nEditingHistoryInstances = 1;
    } 
    else 
    {
        selectionInfoObject.nEditingHistoryInstances = WSM.APIGetAllAggregateTransf3dsReadOnly(selectionInfoObject.nEditingHistoryID, 0).paths.length;
    }

    console.log("Currently editing: " + selectionInfoObject.sEditingHistoryName + " (" + selectionInfoObject.nEditingHistoryInstances + " in model)\n");

    // get current selection
    PropertiesPlus.aCurrentSelection = FormIt.Selection.GetSelections();
    selectionInfoObject.nSelectedTotalCount = PropertiesPlus.aCurrentSelection.length;
    //console.log("Current selection: " + JSON.stringify(currentSelection));
    console.log("Number of objects selected: " + selectionInfoObject.nSelectedTotalCount);

    // if too many items are selected, skip the rest of the info-gathering below
    if (selectionInfoObject.nSelectedTotalCount > args.nMaxObjectCount)
    {
        return selectionInfoObject;
    }

    // for each object in the selection, get info
    for (var i = 0; i < selectionInfoObject.nSelectedTotalCount; i++)
    {
        // if you're not in the Main History, calculate the depth to extract the correct history data
        selectionInfoObject.nEditingHistoryDepth = (PropertiesPlus.aCurrentSelection[i]["ids"].length) - 1;

        // get objectID of the current selection, then push the results into an array
        var nObjectID = PropertiesPlus.aCurrentSelection[i]["ids"][selectionInfoObject.nEditingHistoryDepth]["Object"];
        //console.log("Selection ID: " + nObjectID);
        selectionInfoObject.aSelectedObjectIDs.push(nObjectID);

        // get object type of the current selection, then push the results into an array
        var nType = WSM.APIGetObjectTypeReadOnly(selectionInfoObject.nEditingHistoryID, nObjectID);
        //console.log("Object type: " + nType);
        selectionInfoObject.aSelectedObjectTypes.push(nType);
        //console.log("Object type array: " + selectedObjectsTypeArray);

        // get the properties of this object
        var objectProperties = WSM.APIGetObjectPropertiesReadOnly(selectionInfoObject.nEditingHistoryID, nObjectID);
        //console.log("Object properties: " + JSON.stringify(objectProperties));

        // get the name of this object, then push the results into an array
        var objectName = objectProperties.sObjectName;
        selectionInfoObject.aSelectedObjectNames.push(objectName);
        //console.log("Object name array: " + JSON.stringify(selectedObjectsNameArray));

        // get the Levels setting for this object, then push the results into an array
        var bUseLevels = objectProperties.bReportAreaByLevel;
        selectionInfoObject.aSelectedDoesUseLevelsBools.push(bUseLevels);

        //var bUsesLevels = objectProperties.b

        // get group instance info, if there are any selected, and push the results into arrays
        if (selectionInfoObject.aSelectedObjectTypes[i] == WSM.nInstanceType)
        {
            // get the Group family ID
            var groupFamilyID = WSM.APIGetObjectsByTypeReadOnly(selectionInfoObject.nEditingHistoryID, nObjectID, WSM.nGroupType, true)[0];
            selectionInfoObject.aSelectedGroupIDs.push(groupFamilyID);

            // get the Group family History ID
            var groupFamilyHistoryID = WSM.APIGetGroupReferencedHistoryReadOnly(selectionInfoObject.nEditingHistoryID, groupFamilyID);
            selectionInfoObject.aSelectedGroupHistoryIDs.push(groupFamilyHistoryID);

            // get the Group family name
            var groupFamilyName = PropertiesPlus.getGroupFamilyName(groupFamilyHistoryID);
            selectionInfoObject.aSelectedGroupNames.push(groupFamilyName);

            // get the group instance attributes if there are any
            var aGroupInstanceAttributeIDs = WSM.APIGetObjectsByTypeReadOnly(selectionInfoObject.nEditingHistoryID, nObjectID, WSM.nStringAttributeType);

            // for each ID, get the string attribute key and value
            // and add it to the array
            for (var j = 0; j < aGroupInstanceAttributeIDs.length; j++)
            {
                // string attribute object
                var stringAttributeObject = WSM.APIGetStringAttributeKeyValueReadOnly(selectionInfoObject.nEditingHistoryID, aGroupInstanceAttributeIDs[j]);

                // push the attribute into the array
                selectionInfoObject.aSelectedGroupInstanceAttributes.push(stringAttributeObject);
            }

            // push the Group instance name and ID into arrays
            selectionInfoObject.aSelectedGroupInstanceNames.push(objectName);
            selectionInfoObject.aSelectedGroupInstanceIDs.push(nObjectID);
        }
    }

    // do this only if there is a single Group instance selected
    if (selectionInfoObject.aSelectedGroupInstanceIDs.length == 1)
    {
        var referenceHistoryID = WSM.APIGetGroupReferencedHistoryReadOnly(selectionInfoObject.nEditingHistoryID, selectionInfoObject.aSelectedGroupInstanceIDs[0]);
        //console.log("Reference history for this Group: " + referenceHistoryID);

        // determine how many total instances of this Group are in the model
        selectionInfoObject.nSelectedIdenticalGroupInstanceCount += WSM.APIGetAllAggregateTransf3dsReadOnly(referenceHistoryID, 0).paths.length;
        console.log("Number of instances in model: " + selectionInfoObject.nSelectedIdenticalGroupInstanceCount);
    }

    // determine if the instances come from the same group family
    var groupFamilyHistoryIDComparisonResultsArray = testForIdentical(selectionInfoObject.aSelectedGroupHistoryIDs);
    selectionInfoObject.bIsConsistentGroupHistoryIDs = booleanReduce(groupFamilyHistoryIDComparisonResultsArray);

    // determine unique group history IDs
    var aUniqueGroupHistoryIDs = eliminateDuplicatesInArray(selectionInfoObject.aSelectedGroupHistoryIDs);
    selectionInfoObject.nSelectedUniqueGroupHistoryCount = aUniqueGroupHistoryIDs.length;

    // determine if the group families are all of the same name
    var groupFamilyNameComparisonResultsArray = testForIdentical(selectionInfoObject.aSelectedGroupNames);
    selectionInfoObject.bIsConsistentGroupNames = booleanReduce(groupFamilyNameComparisonResultsArray);

    // determine if the group instances are all of the same name
    var groupInstanceNameComparisonResultsArray = testForIdentical(selectionInfoObject.aSelectedGroupInstanceNames);
    selectionInfoObject.bIsConsistentGroupInstanceNames = booleanReduce(groupInstanceNameComparisonResultsArray);
    //console.log("Are group instance names consistent? " + isConsistentGroupInstanceNames);

    // fill out arrays for object types in the selection
    for (var i = 0; i < selectionInfoObject.aSelectedObjectTypes.length; i++)
    {
        if (selectionInfoObject.aSelectedObjectTypes[i] === WSM.nVertexType)
        {
            selectionInfoObject.nSelectedVertexCount ++;
        }

        if (selectionInfoObject.aSelectedObjectTypes[i] === WSM.nEdgeType)
        {
            selectionInfoObject.nSelectedEdgeCount ++;
        }

        if (selectionInfoObject.aSelectedObjectTypes[i] === WSM.nFaceType)
        {
            selectionInfoObject.nSelectedFaceCount ++;
        }

        if (selectionInfoObject.aSelectedObjectTypes[i] === WSM.nBodyType)
        {
            selectionInfoObject.nSelectedBodyCount ++;
        }

        if (selectionInfoObject.aSelectedObjectTypes[i] === WSM.nMeshType)
        {
            selectionInfoObject.nSelectedMeshCount ++;
        }
        if (selectionInfoObject.aSelectedObjectTypes[i] === WSM.nLineMeshType)
        {
            selectionInfoObject.nSelectedLineMeshCount ++;
        }
        if (selectionInfoObject.aSelectedObjectTypes[i] === WSM.nPointMeshType)
        {
            selectionInfoObject.nSelectedPointMeshCount ++;
        }

        if (selectionInfoObject.aSelectedObjectTypes[i] === WSM.nInstanceType)
        {
            selectionInfoObject.nSelectedGroupInstanceCount ++;
        }
        
    }

    PropertiesPlus.currentSelectionInfo = selectionInfoObject;
    return selectionInfoObject;
}

PropertiesPlus.deselectObjectsByType = function(args)
{
    // define a new selection
    var newSelection = [];

    // loop through the original selection, 
    // check whether each object matches the objectType
    // if not, add it to the new selection
    for (var i = 0; i < PropertiesPlus.currentSelectionInfo.aSelectedObjectTypes.length; i++)
    {
        if (PropertiesPlus.currentSelectionInfo.aSelectedObjectTypes[i] != args.objectTypeToDeselect)
        {
            newSelection.push(PropertiesPlus.aCurrentSelection[i]);
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
    // so use the default Group naming convention
    if (groupName == '')
    {
        groupName = "History " + groupHistoryID;;
    }

    return groupName;
}

PropertiesPlus.calculateVolume = function()
{
    var totalVolume = [];

    // for each object selected, get the ObjectID and calculate the volume
    for (var j = 0; j < PropertiesPlus.currentSelectionInfo.aSelectedObjectIDs.length; j++)
    {
        // calculate the volume of the selection
        var selectedVolume = WSM.APIComputeVolumeReadOnly(PropertiesPlus.currentSelectionInfo.nEditingHistoryID, PropertiesPlus.currentSelectionInfo.aSelectedObjectIDs[j]);
        console.log("Selected volume: " + JSON.stringify(selectedVolume));

        // add multiple volumes up
        totalVolume.push(selectedVolume);
        console.log("Accumulated volume array: " + JSON.stringify(totalVolume));
    }
}

PropertiesPlus.renameGroupFamilies = function(args)
{
    if (PropertiesPlus.currentSelectionInfo.aSelectedGroupHistoryIDs.length === 1 || eliminateDuplicatesInArray(PropertiesPlus.currentSelectionInfo.aSelectedGroupHistoryIDs).length === 1)
    {
        WSM.APISetRevitFamilyInformation(PropertiesPlus.currentSelectionInfo.aSelectedGroupHistoryIDs[0], false, false, "", args.singleGroupFamilyRename, "", "");
    }
    else
    {
        for (var i = 0; i < PropertiesPlus.currentSelectionInfo.aSelectedGroupIDs.length; i++)
        {
            // TODO: restore Group category on rename
            WSM.APISetRevitFamilyInformation(PropertiesPlus.currentSelectionInfo.aSelectedGroupHistoryIDs[i], false, false, "", args.multiGroupFamilyRename, "", "");
        }
    }
}

PropertiesPlus.renameGroupInstances = function(args)
{
    if (PropertiesPlus.currentSelectionInfo.aSelectedGroupInstanceIDs.length == 1)
    {
        WSM.APISetObjectProperties(PropertiesPlus.currentSelectionInfo.nEditingHistoryID, PropertiesPlus.currentSelectionInfo.aSelectedGroupInstanceIDs[0], args.singleGroupInstanceRename, PropertiesPlus.currentSelectionInfo.aSelectedDoesUseLevelsBools[0]);
    }
    else
    {
        for (var i = 0; i < PropertiesPlus.currentSelectionInfo.aSelectedGroupInstanceIDs.length; i++)
        {
            WSM.APISetObjectProperties(PropertiesPlus.currentSelectionInfo.nEditingHistoryID, PropertiesPlus.currentSelectionInfo.aSelectedGroupInstanceIDs[i], args.multiGroupInstanceRename, PropertiesPlus.currentSelectionInfo.aSelectedDoesUseLevelsBools[i]);
        }
    }
}

PropertiesPlus.makeSingleGroupInstanceUnique = function(args)
{
    // if only one instance exists in the model, this instance is already unique
    if (PropertiesPlus.currentSelectionInfo.nSelectedIdenticalGroupInstanceCount == 1)
    {
        var message = PropertiesPlus.currentSelectionInfo.aSelectedGroupNames[0] + " is already unique."
        FormIt.UI.ShowNotification(message, FormIt.NotificationType.Information, 0);
    }
    else 
    {
        // capture some data about the current selection before it's cleared
        var originalSelection = PropertiesPlus.aCurrentSelection;
        var originalGroupName = PropertiesPlus.currentSelectionInfo.aSelectedGroupNames[0];

        // make unique
        var newGroupID = WSM.APICreateSeparateHistoriesForInstances(PropertiesPlus.currentSelectionInfo.nEditingHistoryID, PropertiesPlus.currentSelectionInfo.aSelectedGroupInstanceIDs[0], false);
    
        // get the data changed in this history
        var changedData = WSM.APIGetCreatedChangedAndDeletedInActiveDeltaReadOnly(PropertiesPlus.currentSelectionInfo.nEditingHistoryID, WSM.nInstanceType);

        // get the new unique instance ID for selection
        var newUniqueInstanceID = changedData["changed"];
    
        //console.log("Unique instance ID: " + JSON.stringify(newUniqueInstanceID));
    
        // clear the selection
        FormIt.Selection.ClearSelections();

        // get the new group history ID
        var newGroupHistoryID = WSM.APIGetGroupReferencedHistoryReadOnly(PropertiesPlus.currentSelectionInfo.nEditingHistoryID, Number(newGroupID));

        // get the new group name
        var newGroupName = PropertiesPlus.getGroupFamilyName(newGroupHistoryID);
    
        // determine the new selection path
        var newSelectionPath = originalSelection[0];
        // redefine the object ID for the selection path
        newSelectionPath["ids"][PropertiesPlus.currentSelectionInfo.nEditingHistoryDepth]["Object"] = Number(newUniqueInstanceID);
        
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
    if (PropertiesPlus.currentSelectionInfo.nSelectedIdenticalGroupInstanceCount == 1)
    {
        var message = PropertiesPlus.currentSelectionInfo.aSelectedGroupNames[0] + " is already unique."
        FormIt.UI.ShowNotification(message, FormIt.NotificationType.Information, 0);
    }
    else 
    {
        // capture some data about the current selection before it's cleared
        var originalSelection = PropertiesPlus.aCurrentSelection;
        var originalGroupName = PropertiesPlus.currentSelectionInfo.aSelectedGroupNames[0];

        // ungroup the instance
        WSM.APIFlattenGroupsOrInstances(PropertiesPlus.currentSelectionInfo.nEditingHistoryID, PropertiesPlus.currentSelectionInfo.aSelectedGroupInstanceIDs[0], false, false);
    
        // get the data changed in this history
        var changedData = WSM.APIGetCreatedChangedAndDeletedInActiveDeltaReadOnly(PropertiesPlus.currentSelectionInfo.nEditingHistoryID, WSM.nUnSpecifiedType);

        // get objects that were ungrouped
        var ungroupedObjectIDs = changedData["created"];
    
        //console.log("Unique instance ID: " + JSON.stringify(newUniqueInstanceID));
    
        // clear the selection
        //FormIt.Selection.ClearSelections();

        // get the new group ID
        var newGroupID = WSM.APICreateGroup(PropertiesPlus.currentSelectionInfo.nEditingHistoryID, ungroupedObjectIDs);

        // get the new group history ID
        var newGroupHistoryID = WSM.APIGetGroupReferencedHistoryReadOnly(PropertiesPlus.currentSelectionInfo.nEditingHistoryID, Number(newGroupID));

        // get thew new group instance ID
        var newGroupInstanceChangedData = WSM.APIGetCreatedChangedAndDeletedInActiveDeltaReadOnly(PropertiesPlus.currentSelectionInfo.nEditingHistoryID, WSM.nInstanceType);
        var newGroupInstanceID = newGroupInstanceChangedData["created"];

        // get the new group name
        var newGroupName = PropertiesPlus.getGroupFamilyName(newGroupHistoryID);
    
        // determine the new selection path
        var newSelectionPath = originalSelection[0];
        // redefine the object ID for the selection path
        newSelectionPath["ids"][PropertiesPlus.currentSelectionInfo.nEditingHistoryDepth]["Object"] = Number(newGroupInstanceID);
        
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
    if (PropertiesPlus.currentSelectionInfo.nSelectedIdenticalGroupInstanceCount == 1)
    {
        var message = PropertiesPlus.currentSelectionInfo.aSelectedGroupNames[0] + " was already unique."
        FormIt.UI.ShowNotification(message, FormIt.NotificationType.Information, 0);
    }
    else 
    {
        // capture some data about the current selection before it's cleared
        var originalSelection = PropertiesPlus.aCurrentSelection;
        var originalGroupName = PropertiesPlus.currentSelectionInfo.aSelectedGroupNames[0];

        // create a new array to capture the now-unique instances
        var newUniqueInstanceIDArray = [];
    
        for (var i = 0; i < PropertiesPlus.currentSelectionInfo.aSelectedGroupInstanceIDs.length; i++)
        {
            WSM.APICreateSeparateHistoriesForInstances(PropertiesPlus.currentSelectionInfo.nEditingHistoryID, PropertiesPlus.currentSelectionInfo.aSelectedGroupInstanceIDs[i], false);
        
            // get the data changed in this history
            var changedData = WSM.APIGetCreatedChangedAndDeletedInActiveDeltaReadOnly(PropertiesPlus.currentSelectionInfo.nEditingHistoryID, WSM.nInstanceType);
    
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
            newSelectionPath["ids"][PropertiesPlus.currentSelectionInfo.nEditingHistoryDepth]["Object"] = Number(newUniqueInstanceIDArray[i]);
            
            // add the newly-changed objects to the selection
            FormIt.Selection.SetSelections(newSelectionPath);
        }
    
        var message = " is now unique from " + originalGroupName + ".";
        FormIt.UI.ShowNotification(message, FormIt.NotificationType.Success, 0);
    }
}
