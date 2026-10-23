Add-Type -AssemblyName System.Drawing

$logoPath = 'D:\Office_projects\Disshaa\PujaConnect\src\assets\images\logo.png'
$iconPath = 'D:\Office_projects\Disshaa\PujaConnect\playstore_icon.png'
$featurePath = 'D:\Office_projects\Disshaa\PujaConnect\playstore_feature.png'

# Load original logo
$originalImg = [System.Drawing.Image]::FromFile($logoPath)

# 1. Create 512x512 Icon
$iconImg = New-Object System.Drawing.Bitmap(512, 512)
$iconGraphics = [System.Drawing.Graphics]::FromImage($iconImg)
$iconGraphics.Clear([System.Drawing.Color]::White)
$iconGraphics.DrawImage($originalImg, 0, 0, 512, 512)
$iconImg.Save($iconPath, [System.Drawing.Imaging.ImageFormat]::Png)

# 2. Create 1024x500 Feature Graphic
$featureImg = New-Object System.Drawing.Bitmap(1024, 500)
$featureGraphics = [System.Drawing.Graphics]::FromImage($featureImg)
$featureGraphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#FF9933')) # Saffron/Orange background

# Calculate position to center the logo in feature graphic (e.g., 300x300 logo)
$logoSize = 300
$x = (1024 - $logoSize) / 2
$y = (500 - $logoSize) / 2
$featureGraphics.DrawImage($originalImg, $x, $y, $logoSize, $logoSize)
$featureImg.Save($featurePath, [System.Drawing.Imaging.ImageFormat]::Png)

$iconGraphics.Dispose()
$iconImg.Dispose()
$featureGraphics.Dispose()
$featureImg.Dispose()
$originalImg.Dispose()

Write-Output 'Images created successfully!'
