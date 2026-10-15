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
Write-Host "[3/3] Dang khoi dong Backend va Frontend tren PostgreSQL local..." -ForegroundColor Green
Write-Host "  * Dang bat Backend Django tai http://127.0.0.1:8000 ..." -ForegroundColor Cyan
Start-Process cmd.exe -ArgumentList "/k", "chcp 65001 >nul & cd /d `"$projectRoot\backend`" & python manage.py runserver 127.0.0.1:8000"

Write-Host "  * Dang bat Frontend React tai http://localhost:5173 ..." -ForegroundColor Cyan
Start-Process cmd.exe -ArgumentList "/k", "chcp 65001 >nul & cd /d `"$projectRoot\frontend`" & pnpm dev"

Write-Host ""
Write-Host "Dang cho cac dich vu khoi dong (khoang 3 giay)..." -ForegroundColor Gray
Start-Sleep -Seconds 3

Start-Process "http://localhost:5173"

Clear-Host
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "       HE THONG QUAN LY VAN BAN VA TAI LIEU - NHOM 2" -ForegroundColor Yellow
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  [TRANG THAI] He thong dang chay truc tiep tren PostgreSQL Windows (Sieu nhe):" -ForegroundColor Green
Write-Host ""
Write-Host "  + Frontend [Giao dien React]:     http://localhost:5173" -ForegroundColor White
Write-Host "  + Backend API [Django REST]:      http://127.0.0.1:8000/" -ForegroundColor White
Write-Host "  + Trang quan tri Django Admin:    http://127.0.0.1:8000/admin/" -ForegroundColor White
Write-Host "  + Co so du lieu:                  PostgreSQL Windows (Database: qlvb_dev)" -ForegroundColor White
Write-Host ""
Write-Host "  -----------------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  [TAI KHOAN DANG NHAP THU NGHIEM (NHOM 7)]:" -ForegroundColor Yellow
Write-Host "  + Quan tri vien [Admin]:          admin             /  Admin@123" -ForegroundColor White
Write-Host "  + Truong Phong CNTT:              truongphong_cntt  /  Admin@123" -ForegroundColor White
Write-Host "  + Van Thu Luu Tru:                vanthu_cntt       /  Admin@123" -ForegroundColor White
Write-Host "  + Chuyen Vien CNTT:               chuyenvien_cntt   /  Admin@123" -ForegroundColor White
Write-Host "  -----------------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  [UU DIEM]:" -ForegroundColor Cyan
Write-Host "  - Khong can mo Docker Desktop (tiet kiem 100% RAM va CPU cho may)." -ForegroundColor Gray
Write-Host "  - De dung he thong, chay file DUNG_DU_AN.bat" -ForegroundColor Gray
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""
Pause
