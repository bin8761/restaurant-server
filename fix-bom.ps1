$services = @("menu-service","order-service","kitchen-service","inventory-service","payment-service","table-service")
foreach ($s in $services) {
    $found = Get-ChildItem "c:\restaurant-server\$s\src" -Recurse -Filter "WebConfig.java" | Select-Object -First 1
    if ($found) {
        $bytes = [System.IO.File]::ReadAllBytes($found.FullName)
        if ($bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
            $newBytes = $bytes[3..($bytes.Length-1)]
            [System.IO.File]::WriteAllBytes($found.FullName, $newBytes)
            Write-Host "Fixed BOM: $($found.FullName)"
        } else {
            Write-Host "No BOM: $($found.FullName)"
        }
    } else {
        Write-Host "Not found in $s"
    }
}
Write-Host "Done."
