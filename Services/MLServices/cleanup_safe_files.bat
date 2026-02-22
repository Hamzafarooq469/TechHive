@echo off
echo Cleaning up unnecessary files from MLServices folder...
echo.

REM Remove metadata file (not needed for sentiment model)
if exist metadata.joblib (
    del metadata.joblib
    echo Removed: metadata.joblib
)

REM Remove documentation files
if exist mlWorking.md (
    del mlWorking.md
    echo Removed: mlWorking.md
)

if exist Workingapi.md (
    del Workingapi.md
    echo Removed: Workingapi.md
)

REM Remove Python cache
if exist __pycache__ (
    rmdir /s /q __pycache__
    echo Removed: __pycache__ directory
)

REM Remove Jupyter Notebook checkpoints
if exist .ipynb_checkpoints (
    rmdir /s /q .ipynb_checkpoints
    echo Removed: .ipynb_checkpoints directory
)

echo.
echo Cleanup complete!
echo.
echo NOTE: Churn model files (churn_prediction_model.joblib, churn_preprocessing.py) were NOT removed.
echo       If you are not using churn prediction, you can manually delete these files.
echo.
pause

