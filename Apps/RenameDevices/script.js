var PreapprovedList = [];

//when the page loads disable button and do not show loader
$(document).ready(function(){		
    $("#uploadFile").addClass("disabled"); 
    $(".loaderCover").hide();
    $(".loader").hide();       		
});

/** when the file is dropped get file content.**/
function preventDefaultForFile(evt) {
    if (evt.preventDefault) {
        evt.preventDefault();
    }
    if (evt.stopPropagation) {
        evt.stopPropagation();
    }
}

function readFiles(evt) {
    if (evt.preventDefault) {
        evt.preventDefault();
    }
    if (evt.stopPropagation) {
        evt.stopPropagation();
    }

    var files = evt.target.files || evt.dataTransfer.files;
    validateFile(files);
}
/** End the file drop functions **/

/** Validate file contents **/
function validateFile(ele) 
{
    PreapprovedList = [];
    /* If the file size is more than 100MB do not upload it */
    if(ele[0].size >= 104857600){
        alert("File size should be less han 100MB");        
        $("#uploadFile").addClass("disabled");
        return false;
    }
    /* If the file is not a csv file then don not upload it */
    if(!(ele[0].name).endsWith(".csv")){
        alert("Only csv files are allowed!");			
        $("#uploadFile").addClass("disabled");
        return false;			
    }
    /* If the showProgress has something make it empty */
    $("#showProgress").remove();
    $("section.container-fluid").append('<div id="showProgress"></div>');

    $("#fileName").append(ele[0].name);//Show the file name.
    $("#uploadFile").removeClass("disabled");//Enable to upload button.

    var file = ele[0];//Get file details.
    var fileReader = new FileReader();
    fileReader.onload = function (e) {
        var list = e.target.result.split('\n');//Store each line in an array.
        $("#name").val(file.name);
        for (var i = 0 ; i < list.length-1; i++) {
            var data = list[i].split(',');
            if (data.length == 2) {
                var currentName = data[0];
                var newName = data[1];
                var device = {
                    "newName": data[1],
                    "currentName": data[0],
                    }
                    PreapprovedList.push(device);//If a line is valid store it in an array. 
                $("#showProgress").append('<p style="color:green">'+data+'is valid</p>')
            }
            else
            {
                //If not valid then do not upload the line. 
                $("#showProgress").append('<p style="color:red">'+data+'is Invalid</p>')
            }
                
        }
    }
    var text = fileReader.readAsText(file);
}

/** When the Upload button is clicked **/
function uploadFile(){
    $("#fileName").remove();
    $("#dropZone").append('<div id="fileName"></div>');
    $("#uploadFile").addClass("disabled");
    $("#showProgress").remove();
    $("section.container-fluid").append('<div id="showProgress"></div>');
    if(PreapprovedList.length > 0){
        renameDevice(PreapprovedList,0);
    }else{
        alert("No valid data found to update.");
    }
}

/** Function to rename device **/
function renameDevice(PreapprovedList,i) {
    $(".loader").show();
    $(".loaderCover").show();
    var newName = PreapprovedList[i].newName;//new name for device
    var currentName = PreapprovedList[i].currentName;//current name of the device
    i++;
    var searchJson = '{"Columns":["DeviceName","DeviceModelName","PlatformType","ConnectionStatus","LastTimeStamp","AgentVersion","Battery","PhoneSignal","Operator","DeviceIPAddress","DeviceTimeStamp","PhoneRoaming","SureLockVersion","SureVideoVersion","SureFoxVersion","RootStatus","KnoxStatus","ReleaseVersion","IMEI","IMEI2","DeviceRegistered","DataUsage","CpuUsage","GpuUsage","Temperature","IsSupervised","Isenrolled","Notes","NixPollingType","NetworkType","SerialNumber","PhoneNumber","DeviceUserName","GPSEnabled","BluetoothEnabled","USBPluggedIn","BSSID","SimSerialNumber","SureLockSettingsVersionCode","OsBuildNumber","MemoryStorageAvailable","PhysicalMemoryAvailable","RealDeviceName","SecurityPatchDate","AfwProfile","DeviceGroupPath","MTPSystemScanTimeStamp","MTPSystemScanThreatCount","IsMobileHotSpotEnabled","IsEncryptionEnabled","CtsProfileMatch","BasicIntegrity","VerifyAppEnable","ADBEnable","AllowUnknownSource","DeviceTimeZone","DeviceLocalIPAddress","WifiSSID","AndroidID"],"SearchValue":"' + currentName + '","Offset":0,"Limit":1000,"SortColumn":"DeviceName","SortOrder":"desc","IsSearch":true,"IsTag":false,"SearchColumns":["DeviceName","DeviceModelName","PlatformType","Operator","IMEI","Notes","DeviceUserName"],"ID":null,"AdanceSearch":false,"AdvSearchValue":[],"IsIncludedBlackListed":false,"AdvSearchJobID":"","EnableDeviceGlobalSearch":false}'
    //Get the device details of the current device
    $.ajax({
        url: '../api/devicegrid',
        type: "POST",
        data: searchJson,
        contentType: 'application/json',
        async: true,
        success: function (data) {
            let found = false;
            if (data) {
                if (data.rows && data.rows.length > 0) {
                    for (var j = 0; j < data.rows.length; j++) {
                        found = false;
                        if (currentName.trim() == data.rows[j].DeviceName.trim()) {                            
                            found = true; 
                            var jsonObject = {
                                DeviceID: data.rows[j].DeviceID,
                                JobType: "SET_DEVICENAME",
                                PayLoad: newName
                            }
                            //Change the Name of the device if found.
                            $.ajax({
                                url: '../api/dynamicjob',
                                type: 'POST',
                                data: JSON.stringify(jsonObject),
                                contentType: 'application/json; charset-utf-8',
                                async: true,
                                success: function (data) {                                            
                                    $("#showProgress").append('<p style="color:green">'+currentName +' updated to '+ newName+' successfully </p>');
                                }
                            });                                                                        
                            break;
                        }
                    }                            
                }else{
                    $("#showProgress").append('<p style="color:red">Not able to find '+currentName +'</p>')
                }
            }

        },
        complete: function (data) {

        },
    });
    //If all the device names are changed then stop the loader
    if(i >= PreapprovedList.length){
        $(".loaderCover").hide();
        $(".loader").hide();
        return false;
    }
    //Give one second gap between each device to update the name
    setTimeout(function () { renameDevice(PreapprovedList, i) },1000);    
}