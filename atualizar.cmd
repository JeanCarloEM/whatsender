@echo off
REM Autor: JeanCarloEM.com
REM Site do Autor: https://jeancarloem.com
REM Licenca: Mozilla Public License 2.0
REM Site da Licenca: https://www.mozilla.org/MPL/2.0/
REM Resumo da Licenca: uso, copia, modificacao e distribuicao permitidos conforme os termos da MPL-2.0.
REM Disclaimer: fornecido "AS IS", sem garantias de qualquer tipo.

setlocal

call "%~dp0atualizar.bat" %*
exit /b %ERRORLEVEL%
