Add-Type -AssemblyName System.Drawing

$logoPath = 'D:\Office_projects\Disshaa\PujaConnect\src\assets\images\logo.png'
$screenshot1Path = 'D:\Office_projects\Disshaa\PujaConnect\playstore_screenshot1.png'
$screenshot2Path = 'D:\Office_projects\Disshaa\PujaConnect\playstore_screenshot2.png'

$originalImg = [System.Drawing.Image]::FromFile($logoPath)

# Common font and brush
$font = New-Object System.Drawing.Font('Arial', 70, [System.Drawing.FontStyle]::Bold)
$brushWhite = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$brushOrange = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#FF9933'))

# --- Screenshot 1 (1080x1920) ---
$img1 = New-Object System.Drawing.Bitmap(1080, 1920)
$g1 = [System.Drawing.Graphics]::FromImage($img1)
$g1.Clear([System.Drawing.ColorTranslator]::FromHtml('#FF9933')) # Orange background

# Draw text
$text1 = 'Book Custom Pujas'
$g1.DrawString($text1, $font, $brushWhite, 150, 300)

# Draw Logo
$logoSize = 500
$x = (1080 - $logoSize) / 2
$y = (1920 - $logoSize) / 2
$g1.DrawImage($originalImg, $x, $y, $logoSize, $logoSize)
$img1.Save($screenshot1Path, [System.Drawing.Imaging.ImageFormat]::Png)

# --- Screenshot 2 (1080x1920) ---
$img2 = New-Object System.Drawing.Bitmap(1080, 1920)
$g2 = [System.Drawing.Graphics]::FromImage($img2)
$g2.Clear([System.Drawing.Color]::White) # White background

# Draw text
$text2 = 'Verified Pandits'
$g2.DrawString($text2, $font, $brushOrange, 220, 300)

# Draw Logo
$g2.DrawImage($originalImg, $x, $y, $logoSize, $logoSize)
$img2.Save($screenshot2Path, [System.Drawing.Imaging.ImageFormat]::Png)

# Cleanup
$g1.Dispose()
$g2.Dispose()
$img1.Dispose()
$img2.Dispose()
$font.Dispose()
$brushWhite.Dispose()
$brushOrange.Dispose()
$originalImg.Dispose()

Write-Output 'Screenshots created successfully!'
