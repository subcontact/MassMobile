Import-AzurePublishSettingsFile –PublishSettingsFile "C:\aidan\aidan.publishsettings"

$serviceName = "bootcamp"

$workingFolder = "C:\test"
$pathToSource = "C:\Code\MassMobileHallucination"

cd $workingFolder

#Create Service Folder
New-AzureServiceProject $serviceName

#Add worker Role folder
Add-AzureNodeWorkerRole

$source = $pathToSource

$dest = $workingFolder + '\' + $serviceName + '\WorkerRole1'

$exclude = @('*.pdb','*.config')
Get-ChildItem $source -Recurse -Exclude $exclude | Copy-Item -Destination {Join-Path $dest $_.FullName.Substring($source.length)}

$fso = New-Object -ComObject scripting.filesystemobject

cd $dest

npm install

#Remove-AzureService
#Remove-AzureStorageAccount -StorageAccountName  $serviceName

Publish-AzureServiceProject –ServiceName $serviceName –Location "West US” -Launch

