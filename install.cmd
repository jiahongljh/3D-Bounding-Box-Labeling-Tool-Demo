echo off
cls
title Python and Flask Installer
cd Installation Files
echo This script will install Python and Flask
echo.

echo Do you want to install Python 3.6.4? You are recommended to do so, unless you already have Python 3.5 or higher. [y/n]
set /P INPUT= %=%
If /I "%INPUT%"=="y" goto installPython
If /I "%INPUT%"=="n" goto chooseFlask

:installPython
echo.
echo Wait one minute for the Python installer window, then install it using default settings wherever an option is given
echo.
python-3.6.4.exe
goto installFlask

:chooseFlask
echo.
echo Do you want to install Flask? You are recommended to do so, as it will install the latest version. [y/n]
set /P INPUT= %=%
If /I "%INPUT%"=="y" goto installFlask
If /I "%INPUT%"=="n" goto afterInstalls


:installFlask
echo.
echo Now installing Flask...
py -m pip install flask
goto afterInstalls


:afterInstalls
cd..
echo.
echo Would you like to run the tool now? It will open in your default browser. Next time, if you want to run the tool, just double click run.cmd. [y/n]
set /P INPUT= %=%
If /I "%INPUT%"=="y" goto runTool
If /I "%INPUT%"=="n" goto endInstaller

:runTool
echo.
echo Running tool...
run.cmd

:endInstaller