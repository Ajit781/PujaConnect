Add-Type -AssemblyName System.Drawing

$iconPath = 'D:\Office_projects\Disshaa\PujaConnect\playstore_icon.png'
$originalImg = [System.Drawing.Image]::FromFile($iconPath)

$resolutions = @{
    'mdpi' = 48
    'hdpi' = 72
    'xhdpi' = 96
    'xxhdpi' = 144
    'xxxhdpi' = 192
}

foreach ($res in $resolutions.GetEnumerator()) {
    $folder = "D:\Office_projects\Disshaa\PujaConnect\android\app\src\main\res\mipmap-$($res.Name)"
    if (!(Test-Path $folder)) { New-Item -ItemType Directory -Path $folder | Out-Null }
    
    $size = $res.Value
    $newImg = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($newImg)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($originalImg, 0, 0, $size, $size)
    
    $launcherPath = Join-Path $folder "ic_launcher.png"
    $launcherRoundPath = Join-Path $folder "ic_launcher_round.png"
    
    $newImg.Save($launcherPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $newImg.Save($launcherRoundPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $graphics.Dispose()
    $newImg.Dispose()
    
    Write-Output "Generated icons for $($res.Name)"
}

$originalImg.Dispose()
