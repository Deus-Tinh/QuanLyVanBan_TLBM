# ===============================================================================
#        HE THONG QUAN LY VAN BAN VA TAI LIEU MAT - NHOM 2
# ===============================================================================

$projectRoot = $PSScriptRoot

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "       HE THONG QUAN LY VAN BAN VA TAI LIEU MAT - NHOM 2" -ForegroundColor Yellow
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Kiem tra Python
Write-Host "[1/3] Kiem tra Python..." -ForegroundColor Gray
$pythonCheck = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCheck) {
    Write-Host "[LOI] Khong tim thay Python trong bien moi truong PATH!" -ForegroundColor Red
    Pause
    exit 1
}

# 2. Kiem tra npm
Write-Host "[2/3] Kiem tra Node / npm..." -ForegroundColor Gray
$npmCheck = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmCheck) {
    Write-Host "[LOI] Khong tim thay npm trong bien moi truong PATH!" -ForegroundColor Red
    Pause
    exit 1
}

# 3. Khoi dong Backend va Frontend
Write-Host "[3/3] Dang khoi dong Backend va Frontend..." -ForegroundColor Green
Write-Host "  * Dang bat Backend Django tai http://127.0.0.1:8000 ..." -ForegroundColor Cyan
Start-Process cmd.exe -ArgumentList "/k", "chcp 65001 >nul & cd /d `"$projectRoot\backend`" & python manage.py runserver 127.0.0.1:8000"

Write-Host "  * Dang bat Frontend React tai http://localhost:5173 ..." -ForegroundColor Cyan
Start-Process cmd.exe -ArgumentList "/k", "chcp 65001 >nul & cd /d `"$projectRoot\frontend`" & npm run dev"

Write-Host ""
Write-Host "Dang cho cac dich vu khoi dong (khoang 3 giay)..." -ForegroundColor Gray
Start-Sleep -Seconds 3

Start-Process "http://localhost:5173"

Clear-Host
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "       HE THONG QUAN LY VAN BAN VA TAI LIEU MAT - NHOM 2" -ForegroundColor Yellow
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  [TRANG THAI] Backend va Frontend dang chay trong 2 cua so rieng biet:" -ForegroundColor Green
Write-Host ""
Write-Host "  + Frontend [Giao dien React]:     http://localhost:5173" -ForegroundColor White
Write-Host "  + Backend API [Django REST]:      http://127.0.0.1:8000/" -ForegroundColor White
Write-Host "  + Trang quan tri Django Admin:    http://127.0.0.1:8000/admin/" -ForegroundColor White
Write-Host ""
Write-Host "  -----------------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  [TAI KHOAN DANG NHAP THU NGHIEM]:" -ForegroundColor Yellow
Write-Host "  + Quan tri vien [Admin]:    admin    /  Admin@123   - Toan quyen quan tri" -ForegroundColor White
Write-Host "  + Can bo xu ly [Staff]:     canbo    /  Canbo@123   - Quan ly van ban" -ForegroundColor White
Write-Host "  -----------------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  [HUONG DAN]:" -ForegroundColor Cyan
Write-Host "  - Giu 2 cua so CMD Backend va Frontend mo trong suot qua trinh test." -ForegroundColor Gray
Write-Host "  - De dung he thong, chay file DUNG_DU_AN.bat hoac dong 2 cua so CMD do." -ForegroundColor Gray
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""
Pause
