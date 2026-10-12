Unicode true
!include "MUI2.nsh"

Name "aiCEV - Internal Assessment"
OutFile "dist-installer\aiCEV-Internal-Assessment-Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\aiCEV - Internal Assessment"
InstallDirRegKey HKCU "Software\Procucev\aiCEV" "InstallDir"
RequestExecutionLevel user

!define MUI_ICON "assets\aicev-icon.ico"
!define MUI_UNICON "assets\aicev-icon.ico"
!define MUI_ABORTWARNING

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

Section "MainSection" SEC01
  SetOutPath "$INSTDIR"
  File /r "dist-installer\win-unpacked\*.*"

  ; Create uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  ; Create Desktop Shortcut (Exactly one desktop shortcut)
  CreateShortCut "$DESKTOP\aiCEV - Internal Assessment.lnk" "$INSTDIR\aiCEV - Internal Assessment.exe" "" "$INSTDIR\aiCEV - Internal Assessment.exe" 0

  ; Create Start Menu Shortcut
  CreateDirectory "$SMPROGRAMS\aiCEV"
  CreateShortCut "$SMPROGRAMS\aiCEV\aiCEV - Internal Assessment.lnk" "$INSTDIR\aiCEV - Internal Assessment.exe" "" "$INSTDIR\aiCEV - Internal Assessment.exe" 0
  CreateShortCut "$SMPROGRAMS\aiCEV\Uninstall aiCEV.lnk" "$INSTDIR\Uninstall.exe" "" "$INSTDIR\Uninstall.exe" 0

  ; Registry keys for Add/Remove Programs
  WriteRegStr HKCU "Software\Procucev\aiCEV" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\aiCEV-Internal-Assessment" "DisplayName" "aiCEV - Internal Assessment"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\aiCEV-Internal-Assessment" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\aiCEV-Internal-Assessment" "DisplayIcon" "$INSTDIR\aiCEV - Internal Assessment.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\aiCEV-Internal-Assessment" "DisplayVersion" "1.0.2"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\aiCEV-Internal-Assessment" "Publisher" "Procucev"
SectionEnd

Section "Uninstall"
  Delete "$DESKTOP\aiCEV - Internal Assessment.lnk"
  Delete "$SMPROGRAMS\aiCEV\aiCEV - Internal Assessment.lnk"
  Delete "$SMPROGRAMS\aiCEV\Uninstall aiCEV.lnk"
  RMDir "$SMPROGRAMS\aiCEV"

  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\aiCEV-Internal-Assessment"
  DeleteRegKey HKCU "Software\Procucev\aiCEV"

  RMDir /r "$INSTDIR"
SectionEnd
