echo off
cls
title Flask Server for 3D Bounding Box Labeling Tool
cd Application
set FLASK_APP=application.py
start "" http://localhost:5000/
echo Please do not close this window while annotations are being done
echo.
echo However, you may minimise it
echo.
echo If you accidentally close your browser window, just open http://localhost:5000/ in your favourite browser
echo.
echo.
echo.

py -m flask run