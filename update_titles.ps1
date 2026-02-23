$baseDir = "c:\Users\javic\OneDrive\Desktop\Nueva carpeta (5)\contenedor"

$aisles = @(
    @{num=3;  title='Inventario Pasillo 3'; name='★-PASILLO PANES-★'},
    @{num=4;  title='Inventario Pasillo 4'; name='★-PASILLO GALLETAS-★'},
    @{num=5;  title='Inventario Pasillo 5'; name='★-PASILLO SALSA-★'},
    @{num=6;  title='Inventario Pasillo 6'; name='★-PASILLO JABON-★'},
    @{num=7;  title='Inventario Pasillo 7'; name='★-PASILLO PAPEL-★'},
    @{num=8;  title='Inventario Pasillo 8'; name='★-PASILLO 8-★'},
    @{num=9;  title='Inventario Pasillo 9'; name='★-PASILLO GRANOS-★'},
    @{num=10; title='Inventario Cava Cuarto'; name='★-CAVA CUARTO-★'},
    @{num=11; title='Inventario Arriba 1-3'; name='★-PASILLO ARRIBA 1-3-★'},
    @{num=12; title='Inventario Arriba 4-6'; name='★-PASILLO ARRIBA 4-6-★'},
    @{num=13; title='Inventario Reguera'; name='★-REGUERA-★'},
    @{num=14; title='Inventario Fruteria'; name='★-FRUTERIA-★'},
    @{num=15; title='Inventario Mascota'; name='★-MASCOTA-★'},
    @{num=16; title='Inventario Deposito Abajo'; name='★-DEPOSITO ABAJO-★'},
    @{num=17; title='Inventario Deposito Arriba'; name='★-DEPOSITO ARRIBA-★'}
)

foreach ($aisle in $aisles) {
    $num = $aisle.num
    $filePath = Join-Path $baseDir ("pasillo" + $num + "\pasillo" + $num + ".html")
    
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw
        
        # Replace Page Title (case-insensitive)
        $content = $content -replace "Inventario Pasillo 1 \| Cecosesola", ($aisle.title + " | Cecosesola")
        
        # Replace Header Title (case-insensitive)
        $content = $content -replace "★-PASILLO PASTAS-★", $aisle.name
        
        # Set content with UTF8 encoding
        [System.IO.File]::WriteAllText($filePath, $content, [System.Text.Encoding]::UTF8)
        Write-Host "Updated titles for pasillo$num"
    } else {
        Write-Host "File not found: $filePath"
    }
}
