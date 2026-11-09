Unicode true
Name "Knot"
OutFile "launcher.exe"
RequestExecutionLevel user
SilentInstall silent
Icon "icon.ico"
VIProductVersion "2.2.2.0"
VIAddVersionKey "ProductName" "KNOT"
VIAddVersionKey "FileDescription" "KNOT desktop launcher"
VIAddVersionKey "FileVersion" "2.2.2"
VIAddVersionKey "LegalCopyright" "tujingsushi"

Section
  IfFileExists "$EXEDIR\knot-core.exe" 0 +2
  ExecWait '"$EXEDIR\knot-core.exe" --no-sandbox'
SectionEnd
