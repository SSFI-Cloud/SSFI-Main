# ============================================================
# SSFI Migration - Step 1: Import Old Tables from SQL Dump
# Run this BEFORE running migrate.ts
# ============================================================

$MYSQL    = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
$DUMP     = "H:\SSFI-New-Back\ssfi_db.sql"
$DB_USER  = "root"
$DB_PASS  = "root"
$DB_NAME  = "ssfi_db"
$OUTFILE  = "H:\SSFI-New-Back\old_tables_import.sql"

Write-Host "==============================="
Write-Host " SSFI Old Tables Import Script"
Write-Host "==============================="
Write-Host ""

# Tables to CREATE + INSERT (not yet in live DB)
$CREATE_TABLES = @("tbl_clubs","tbl_districts","tbl_events","tbl_event_registration","tbl_skaters","tbl_states")

# Tables already in live DB but EMPTY (INSERT data only)
$INSERT_ONLY   = @("tbl_user","tbl_category_type","tbl_eligible_event_level","tbl_event_level_type","tbl_session","tbl_session_renewal")

Write-Host "Reading SQL dump file..."
$allLines = Get-Content $DUMP

Write-Host "Extracting SQL blocks..."

$output = [System.Collections.Generic.List[string]]::new()
$output.Add("-- SSFI Old Tables Import (auto-generated)")
$output.Add("SET FOREIGN_KEY_CHECKS = 0;")
$output.Add("SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';")
$output.Add("")

# --- Extract CREATE TABLE blocks ---
foreach ($tbl in $CREATE_TABLES) {
    Write-Host "  Extracting CREATE for: $tbl"
    $output.Add("-- ====== $tbl ======")

    $inBlock   = $false
    $inInsert  = $false
    $foundCreate = $false

    foreach ($line in $allLines) {
        # Start CREATE block
        if ($line -match "^CREATE TABLE ``$tbl``") {
            $inBlock = $true
            $foundCreate = $true
        }

        if ($inBlock) {
            $output.Add($line)
            # End of CREATE TABLE block (ends with ENGINE=... line)
            if ($line -match "ENGINE=") {
                $inBlock = $false
                $output.Add("")
            }
        }

        # Collect INSERT INTO lines for this table
        if ($line -match "^INSERT INTO ``$tbl``") {
            $output.Add($line)
            $inInsert = $true
            continue
        }

        # Multi-line INSERT continuation
        if ($inInsert) {
            if ($line.StartsWith("(") -or $line.StartsWith(",") ) {
                # These are value rows - they're already inside the INSERT statement
                continue
            }
            if ($line -match "^(--|CREATE|ALTER|LOCK|UNLOCK|DROP|SET)") {
                $inInsert = $false
            }
        }
    }
    $output.Add("")
}

# --- Extract INSERT-ONLY blocks ---
foreach ($tbl in $INSERT_ONLY) {
    Write-Host "  Extracting INSERT data for: $tbl"
    $output.Add("-- ====== $tbl (data only) ======")
    $output.Add("SET FOREIGN_KEY_CHECKS = 0;")

    foreach ($line in $allLines) {
        if ($line -match "^INSERT INTO ``$tbl``") {
            $output.Add($line)
        }
    }
    $output.Add("")
}

$output.Add("SET FOREIGN_KEY_CHECKS = 1;")
$output.Add("-- Import complete")

Write-Host "Writing to output file: $OUTFILE"
$output | Out-File -FilePath $OUTFILE -Encoding UTF8

Write-Host ""
Write-Host "Executing import against MySQL..."
$proc = Start-Process -FilePath $MYSQL `
    -ArgumentList "-u $DB_USER -p$DB_PASS $DB_NAME" `
    -RedirectStandardInput $OUTFILE `
    -RedirectStandardOutput "C:\temp\import_out.txt" `
    -RedirectStandardError  "C:\temp\import_err.txt" `
    -Wait -NoNewWindow -PassThru

$exitCode = $proc.ExitCode
$stderr   = Get-Content "C:\temp\import_err.txt" -ErrorAction SilentlyContinue

if ($exitCode -eq 0) {
    Write-Host "✓ Import completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Import finished with exit code: $exitCode" -ForegroundColor Yellow
    if ($stderr) {
        Write-Host "Warnings/Errors:" -ForegroundColor Yellow
        $stderr | Where-Object { $_ -notmatch "Warning.*password" } | Select-Object -First 20 | ForEach-Object { Write-Host "  $_" }
    }
}

# Verify row counts
Write-Host ""
Write-Host "Verifying imported data..."
$verifySQL = @"
SELECT 'tbl_user' as tbl, COUNT(*) as cnt FROM tbl_user
UNION ALL SELECT 'tbl_category_type', COUNT(*) FROM tbl_category_type
UNION ALL SELECT 'tbl_eligible_event_level', COUNT(*) FROM tbl_eligible_event_level
UNION ALL SELECT 'tbl_event_level_type', COUNT(*) FROM tbl_event_level_type
UNION ALL SELECT 'tbl_session', COUNT(*) FROM tbl_session
UNION ALL SELECT 'tbl_session_renewal', COUNT(*) FROM tbl_session_renewal
UNION ALL SELECT 'tbl_clubs', COUNT(*) FROM tbl_clubs
UNION ALL SELECT 'tbl_districts', COUNT(*) FROM tbl_districts
UNION ALL SELECT 'tbl_skaters', COUNT(*) FROM tbl_skaters
UNION ALL SELECT 'tbl_states', COUNT(*) FROM tbl_states
UNION ALL SELECT 'tbl_events', COUNT(*) FROM tbl_events
UNION ALL SELECT 'tbl_event_registration', COUNT(*) FROM tbl_event_registration;
"@
$verifySQL | Out-File "C:\temp\verify.sql" -Encoding UTF8
Start-Process -FilePath $MYSQL -ArgumentList "-u $DB_USER -p$DB_PASS $DB_NAME" `
    -RedirectStandardInput "C:\temp\verify.sql" `
    -RedirectStandardOutput "C:\temp\verify_out.txt" `
    -Wait -NoNewWindow
Get-Content "C:\temp\verify_out.txt"
