Write-Output '---PID 11592 (port 3000)---'
Get-CimInstance Win32_Process -Filter "ProcessId=11592" | ForEach-Object {
  Write-Output ("Name: " + $_.Name)
  Write-Output ("Path: " + $_.ExecutablePath)
  Write-Output ("Cmd:  " + $_.CommandLine)
}
Write-Output '---geraiakun on 3001?---'
try { (Invoke-WebRequest http://localhost:3001 -UseBasicParsing -TimeoutSec 8).Content.Substring(0,400) } catch { "ERR: $($_.Exception.Message)" }
Write-Output ''
Write-Output '---port 3000 title?---'
try {
  $h = (Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 8).Content
  if ($h -match '<title[^>]*>([^<]+)</title>') { Write-Output ("title: " + $matches[1]) }
  $h.Substring(0,300)
} catch { "ERR: $($_.Exception.Message)" }
