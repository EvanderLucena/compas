[CmdletBinding()]
param(
    [switch]$Web,
    [switch]$Plain
)
$nodeArgs = @("--no-warnings", "$PSScriptRoot\scripts\compas-dashboard.cjs")
if ($Web) { $nodeArgs += "--web" }
elseif ($Plain) { $nodeArgs += "--plain" }
& node $nodeArgs
