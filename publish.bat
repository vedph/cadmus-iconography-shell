@echo off
echo NPM PUBLISH
echo Before continuing, ensure that:
echo - you are logged in (npm whoami)
echo - you have successfully rebuilt all the libraries (npm run...)
pause

cd .\dist\myrmidon\cadmus-codicology-ui
call npm publish --access=public
cd ..\..\..
pause

cd .\dist\myrmidon\cadmus-part-codicology-bindings
call npm publish --access=public
cd ..\..\..
pause

cd .\dist\myrmidon\cadmus-part-codicology-contents
call npm publish --access=public
cd ..\..\..
pause

cd .\dist\myrmidon\cadmus-part-codicology-decorations
call npm publish --access=public
cd ..\..\..
pause

cd .\dist\myrmidon\cadmus-part-codicology-edits
call npm publish --access=public
cd ..\..\..
pause

cd .\dist\myrmidon\cadmus-part-codicology-hands
call npm publish --access=public
cd ..\..\..
pause

cd .\dist\myrmidon\cadmus-part-codicology-layouts
call npm publish --access=public
cd ..\..\..
pause

cd .\dist\myrmidon\cadmus-part-codicology-material-dsc
call npm publish --access=public
cd ..\..\..
pause

cd .\dist\myrmidon\cadmus-part-codicology-sheet-labels
call npm publish --access=public
cd ..\..\..
pause

cd .\dist\myrmidon\cadmus-part-codicology-shelfmarks
call npm publish --access=public
cd ..\..\..
pause

cd .\dist\myrmidon\cadmus-part-codicology-watermarks
call npm publish --access=public
cd ..\..\..
pause

cd .\dist\myrmidon\cadmus-part-codicology-pg
call npm publish --access=public
cd ..\..\..
pause

echo ALL DONE
